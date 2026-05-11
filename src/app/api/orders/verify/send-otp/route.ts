import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { otpStore } from '@/lib/otp-store';
import { sendDispatchOtpEmail } from '@/lib/dispatch-email';

/**
 * POST /api/orders/verify/send-otp
 * Sends an OTP to the order's customer email for dispatch/delivery verification.
 * Body: { orderId: string, email: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, email } = await req.json();

    if (!orderId || !email) {
      return NextResponse.json(
        { success: false, error: 'Order ID and email are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the order
    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the email matches the order's customer email
    if (order.customerInfo.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email does not match order records' },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory store (keyed by orderId to avoid conflicts with login OTPs)
    const otpKey = `dispatch_${orderId}`;
    otpStore.set(otpKey, otp);

    // Also store in the order document for persistence
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await Order.updateOne(
      { orderId },
      { $set: { verificationOtp: otp, otpExpiresAt: otpExpiry } }
    );

    // Send OTP email
    const emailSent = await sendDispatchOtpEmail(
      email,
      order.customerInfo.name,
      orderId,
      otp
    );

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
