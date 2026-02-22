import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Didit verification session
 * This endpoint creates a session with the Didit API and returns the verification URL
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, callback_url } = await request.json();

    const apiKey = process.env.DIDIT_API_KEY;
    const workflowId = process.env.DIDIT_WORKFLOW_ID;
    const apiEndpoint = process.env.DIDIT_API_ENDPOINT || 'https://verification.didit.me';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DIDIT_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'DIDIT_WORKFLOW_ID not configured' },
        { status: 500 }
      );
    }

    // Create session with Didit API
    const response = await fetch(`${apiEndpoint}/v3/session/`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        callback: callback_url || `${process.env.NEXTAUTH_URL || 'https://yourapp.com'}/api/kyc/webhook`,
        vendor_data: user_id || 'anonymous',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Didit API Error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Didit API error: ${response.status} ${errorText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('Didit API Response:', JSON.stringify(data, null, 2));
    
    // Didit API may return different field names
    const verificationUrl = data.verification_url || data.session_url || data.url;
    
    if (!verificationUrl) {
      console.error('No verification URL in response. Available fields:', Object.keys(data));
      return NextResponse.json(
        { 
          success: false, 
          error: 'No verification URL received from Didit API' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session_id: data.session_id,
      session_token: data.session_token,
      verification_url: verificationUrl,
      status: data.status,
    });

  } catch (error) {
    console.error('KYC Session Creation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
