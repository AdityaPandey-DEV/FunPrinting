import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import PrintJob from '@/models/PrintJob';
import CreatorEarning from '@/models/CreatorEarning';
import { sendPaymentNotification } from '@/lib/notificationService';
import { redis } from '@/lib/jobStore';
import { webhookRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/ratelimit';

// Redis key prefixes for webhook deduplication
const WEBHOOK_EVENT_PREFIX = 'webhook:event:';
const WEBHOOK_EVENT_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * Check if a webhook event has already been processed (Redis-backed)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const result = await redis.get(`${WEBHOOK_EVENT_PREFIX}${eventId}`);
    return result !== null;
  } catch (error) {
    console.error('⚠️ Redis GET error for webhook dedup:', error);
    return false; // Allow processing if Redis is down
  }
}

/**
 * Mark a webhook event as processed (Redis-backed, auto-expires after 24h)
 */
async function markEventProcessed(eventId: string): Promise<void> {
  try {
    await redis.set(`${WEBHOOK_EVENT_PREFIX}${eventId}`, Date.now(), { ex: WEBHOOK_EVENT_TTL });
  } catch (error) {
    console.error('⚠️ Redis SET error for webhook dedup:', error);
  }
}

/**
 * Remove a webhook event from processed set (for retry on failure)
 */
async function removeEventProcessed(eventId: string): Promise<void> {
  try {
    await redis.del(`${WEBHOOK_EVENT_PREFIX}${eventId}`);
  } catch (error) {
    console.error('⚠️ Redis DEL error for webhook dedup:', error);
  }
}

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export async function POST(request: NextRequest) {
  // Rate limiting via Upstash Redis (shared across instances)
  const clientId = getClientIdentifier(request);
  const rateLimitResponse = await checkRateLimit(webhookRateLimit, clientId);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('❌ Missing Razorpay signature');
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Razorpay webhook secret not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const receivedAt = Date.now();
    const eventTimestamp = event.created_at ? event.created_at * 1000 : receivedAt;

    // Calculate webhook delay
    const delay = receivedAt - eventTimestamp;
    const isDelayed = delay > 5 * 60 * 1000; // More than 5 minutes old

    console.log('🔔 Razorpay webhook received:', event.event);
    console.log(`📅 Event timestamp: ${new Date(eventTimestamp).toISOString()}`);
    console.log(`⏱️ Webhook delay: ${Math.round(delay / 1000)}s${isDelayed ? ' (DELAYED - possible replay)' : ''}`);

    // Check for duplicate events via Redis (idempotency protection)
    const eventId = event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id;
    if (eventId && await isEventProcessed(eventId)) {
      console.log(`ℹ️ Duplicate webhook event ignored: ${eventId}`);
      return NextResponse.json({ success: true, message: 'Duplicate event ignored' });
    }

    // Mark event as processed (even if we haven't processed it yet, to prevent race conditions)
    if (eventId) {
      await markEventProcessed(eventId);
    }

    await connectDB();

    let processingSuccess = true;

    switch (event.event) {
      case 'payment.captured':
        processingSuccess = await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event: ${event.event}`);
    }

    // If processing failed, remove from processed events so it can be retried
    if (!processingSuccess && eventId) {
      console.warn(`⚠️ Webhook processing failed for ${eventId}, removing from processed events for retry`);
      await removeEventProcessed(eventId);
    }

    // Always return success to Razorpay to prevent retries from their side
    return NextResponse.json({
      success: true,
      message: processingSuccess ? 'Webhook processed successfully' : 'Webhook processing failed but will retry'
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any, retryCount: number = 0): Promise<boolean> {
  const MAX_RETRIES = 3;

  try {
    console.log(`💰 Payment captured: ${payment.id}${retryCount > 0 ? ` (retry ${retryCount}/${MAX_RETRIES})` : ''}`);
    console.log(`📋 Payment details: order_id=${payment.order_id}, amount=${payment.amount}, status=${payment.status}, captured=${payment.captured}`);

    // Find the order by Razorpay order ID
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });

    if (!order) {
      console.error('❌ Order not found for payment:', payment.order_id);
      return false;
    }

    // Check if order is already processed (race condition protection)
    if (order.paymentStatus === 'completed' && order.razorpayPaymentId === payment.id) {
      console.log(`ℹ️ Order ${order.orderId} already processed for payment ${payment.id}`);
      return true;
    }

    // If order is already completed with a different payment ID, log warning
    if (order.paymentStatus === 'completed' && order.razorpayPaymentId !== payment.id) {
      console.warn(`⚠️ Order ${order.orderId} already completed with different payment: ${order.razorpayPaymentId} (new: ${payment.id})`);
      return true;
    }

    // Validate payment amount matches order amount
    const expectedAmount = Math.round(order.amount * 100);
    if (payment.amount !== expectedAmount) {
      console.error(`❌ Payment amount mismatch for order ${order.orderId}: expected ${expectedAmount}, got ${payment.amount}`);
    }

    // Update order with payment details using atomic operation
    const updateResult = await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentStatus: { $ne: 'completed' }
      },
      {
        $set: {
          paymentStatus: 'completed',
          razorpayPaymentId: payment.id,
          status: 'paid',
          orderStatus: 'pending',
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updateResult) {
      console.log(`ℹ️ Order ${order.orderId} already processed or not found`);
      return true;
    }

    console.log(`✅ Order ${order.orderId} marked as paid`);

    // Create CreatorEarning record for paid template orders
    if (updateResult.orderType === 'template' &&
      updateResult.creatorShareAmount &&
      updateResult.creatorShareAmount > 0 &&
      updateResult.templateCreatorUserId) {
      try {
        const existingEarning = await CreatorEarning.findOne({ orderId: updateResult.orderId });

        if (!existingEarning) {
          const earning = new CreatorEarning({
            creatorUserId: updateResult.templateCreatorUserId,
            templateId: updateResult.templateId,
            orderId: updateResult.orderId,
            razorpayPaymentId: payment.id,
            amount: updateResult.creatorShareAmount,
            platformShareAmount: updateResult.platformShareAmount || 0,
            status: 'pending',
          });

          await earning.save();
          console.log(`💰 CreatorEarning created via webhook: ₹${updateResult.creatorShareAmount} for creator ${updateResult.templateCreatorUserId}`);
        } else {
          console.log(`ℹ️ CreatorEarning already exists for order ${updateResult.orderId}`);
        }
      } catch (earningError) {
        console.error('❌ Error creating CreatorEarning in webhook:', earningError);
      }
    }

    // Send payment completion notification to admin
    try {
      await sendPaymentNotification({
        orderId: updateResult.orderId,
        customerName: updateResult.customerInfo.name,
        customerEmail: updateResult.customerInfo.email,
        customerPhone: updateResult.customerInfo.phone,
        orderType: updateResult.orderType,
        amount: updateResult.amount,
        pageCount: updateResult.printingOptions.pageCount,
        printingOptions: updateResult.printingOptions,
        deliveryOption: updateResult.deliveryOption,
        createdAt: updateResult.createdAt,
        paymentStatus: updateResult.paymentStatus,
        orderStatus: updateResult.orderStatus,
        templateName: updateResult.templateName,
        fileName: updateResult.originalFileName
      }, 'completed');
    } catch (notificationError) {
      console.error('❌ Failed to send payment completion notification:', notificationError);
    }

    // Create print job if this is a file order
    if (order.orderType === 'file' && order.fileURL) {
      try {
        const existingPrintJob = await PrintJob.findOne({ orderId: order._id.toString() });
        if (existingPrintJob) {
          console.log(`ℹ️ Print job already exists for order ${order.orderId}`);
          return true;
        }

        console.log('🖨️ Creating print job for order:', order.orderId);

        const estimatedDuration = Math.ceil(
          (order.printingOptions.pageCount * order.printingOptions.copies * 0.5) +
          (order.printingOptions.color === 'color' ? order.printingOptions.pageCount * 0.3 : 0)
        );

        const printJob = new PrintJob({
          orderId: order._id.toString(),
          orderNumber: order.orderId,
          customerName: order.customerInfo.name,
          customerEmail: order.customerInfo.email,
          fileURL: order.fileURL,
          fileName: order.originalFileName || 'document.pdf',
          fileType: order.fileType || 'application/pdf',
          printingOptions: order.printingOptions,
          priority: 'normal',
          estimatedDuration,
          status: 'pending'
        });

        await printJob.save();
        console.log(`✅ Print job created: ${printJob.orderNumber}`);
        console.log(`✅ Order ${order.orderId} ready for manual processing`);
      } catch (printJobError) {
        console.error('Error creating print job:', printJobError);
      }
    }

    return true;

  } catch (error) {
    console.error(`❌ Error handling payment captured (attempt ${retryCount + 1}):`, error);

    // Retry logic for transient errors
    if (retryCount < MAX_RETRIES) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const isTransientError = errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('MongoError') ||
        errorMessage.includes('MongooseError');

      if (isTransientError) {
        const retryDelay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retrying payment captured handler in ${retryDelay}ms...`);

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return await handlePaymentCaptured(payment, retryCount + 1);
      }
    }

    console.error(`❌ Failed to handle payment captured after ${retryCount + 1} attempts`);
    return false;
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    console.log('❌ Payment failed:', payment.id);

    const order = await Order.findOne({ razorpayOrderId: payment.order_id });

    if (!order) {
      console.error('❌ Order not found for failed payment:', payment.order_id);
      return;
    }

    // Update order status
    order.paymentStatus = 'failed';
    order.status = 'pending_payment';
    order.orderStatus = 'pending';

    await order.save();
    console.log(`❌ Order ${order.orderId} marked as failed`);

    // Send payment failure notification to admin
    try {
      await sendPaymentNotification({
        orderId: order.orderId,
        customerName: order.customerInfo.name,
        customerEmail: order.customerInfo.email,
        customerPhone: order.customerInfo.phone,
        orderType: order.orderType,
        amount: order.amount,
        pageCount: order.printingOptions.pageCount,
        printingOptions: order.printingOptions,
        deliveryOption: order.deliveryOption,
        createdAt: order.createdAt,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        templateName: order.templateName,
        fileName: order.originalFileName
      }, 'failed');
    } catch (notificationError) {
      console.error('❌ Failed to send payment failure notification:', notificationError);
    }

  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
  }
}

/**
 * Handle order.paid event — uses atomic findOneAndUpdate to prevent race conditions
 * with payment.captured handler
 */
async function handleOrderPaid(order: any) {
  try {
    console.log('✅ Order paid:', order.id);

    // Atomic update — only updates if not already completed
    const updateResult = await Order.findOneAndUpdate(
      {
        razorpayOrderId: order.id,
        paymentStatus: { $ne: 'completed' }
      },
      {
        $set: {
          paymentStatus: 'completed',
          status: 'paid',
          orderStatus: 'pending',
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updateResult) {
      console.log(`ℹ️ Order for Razorpay order ${order.id} already completed or not found`);
      return;
    }

    console.log(`✅ Order ${updateResult.orderId} marked as paid via order.paid event`);

  } catch (error) {
    console.error('❌ Error handling order paid:', error);
  }
}
