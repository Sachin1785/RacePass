import { NextRequest, NextResponse } from 'next/server';

/**
 * Didit webhook endpoint
 * Receives verification results from Didit after user completes verification
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Didit Webhook Received:', {
      session_id: data.session_id,
      status: data.status,
      timestamp: new Date().toISOString(),
    });

    // Here you would:
    // 1. Validate the webhook signature (if Didit provides one)
    // 2. Store the verification results in your database
    // 3. Update user's KYC status
    // 4. Trigger any post-verification actions

    // Example: Store in database
    // await db.users.update({
    //   where: { id: data.vendor_data }, // user_id we passed during session creation
    //   data: {
    //     kycStatus: data.status,
    //     kycSessionId: data.session_id,
    //     kycCompletedAt: new Date(),
    //   }
    // });

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
