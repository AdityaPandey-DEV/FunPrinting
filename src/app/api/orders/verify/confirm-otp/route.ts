import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order';
import { otpStore } from '@/lib/otp-store';
import crypto from 'crypto';

/**
 * POST /api/orders/verify/confirm-otp
 * Validates OTP and returns a verification token for subsequent status updates.
 * Body: { orderId: string, otp: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, otp } = await req.json();

    if (!orderId || !otp) {
      return NextResponse.json(
        { success: false, error: 'Order ID and OTP are required' },
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

    // Check OTP from in-memory store first
    const otpKey = `dispatch_${orderId}`;
    const storedOtpData = otpStore.get(otpKey);
    let otpValid = false;

    if (storedOtpData) {
      // Check if OTP matches and is not expired
      if (storedOtpData.otp === otp && !otpStore.isExpired(storedOtpData.timestamp)) {
        otpValid = true;
      }
    }

    // Fallback: check OTP from database
    if (!otpValid && order.verificationOtp === otp) {
      if (order.otpExpiresAt && new Date(order.otpExpiresAt) > new Date()) {
        otpValid = true;
      }
    }

    if (!otpValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }

    // OTP is valid — clean up
    otpStore.delete(otpKey);
    await Order.updateOne(
      { orderId },
      { $unset: { verificationOtp: 1, otpExpiresAt: 1 } }
    );

    // Generate a short-lived verification token (valid for 15 minutes)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 15 * 60 * 1000;

    // Store the token in the OTP store (reuse infrastructure)
    const tokenKey = `verify_token_${orderId}`;
    otpStore.set(tokenKey, `${verificationToken}|${tokenExpiry}`);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verificationToken,
      email: order.customerInfo.email,
    });
  } catch (error) {
    console.error('Error in confirm-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
