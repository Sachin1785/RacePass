import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Didit webhook endpoint
 * Receives verification results from Didit after user completes verification
 */
export async function GET(request: NextRequest) {
  // Return status or dummy data if someone tries to GET it in browser
  return NextResponse.json({ 
    message: 'Didit Webhook endpoint is active. Use POST for live updates.',
    success: true 
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 📂 Log payload to file for debugging (so you don't lose it on crash)
    const logFilePath = path.join(process.cwd(), 'didit-webhook-payloads.log');
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      payload: data
    }, null, 2) + '\n---\n';
    fs.appendFileSync(logFilePath, logEntry);

    const imageUrl = data.decision?.face_matches?.[0]?.target_image;
    const sessionId = data.session_id || 'unknown-session';

    // 🛡️ Safe logging
    console.log('Didit Webhook Received:', {
      session_id: sessionId,
      status: data.status,
      timestamp: new Date().toISOString(),
      image_url: imageUrl || 'No image available'
    });

    // 📸 Download and store the image
    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const buffer = await imageResponse.arrayBuffer();
          
          // Use 'storage/kyc-images' folder
          const storageDir = path.join(process.cwd(), 'storage', 'kyc-images');
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
          }

          // Use session ID or UUID for unique filename
          const fileName = `${sessionId}-${Date.now()}.jpg`;
          const filePath = path.join(storageDir, fileName);
          
          fs.writeFileSync(filePath, Buffer.from(buffer));
          console.log(`✅ KYC image stored successfully: ${filePath}`);
        } else {
          console.warn(`Failed to fetch image from URL: ${imageResponse.statusText}`);
        }
      } catch (imageError) {
        console.error('Error saving KYC image:', imageError);
      }
    }

    // Here you would:
    // 1. Validate the webhook signature (if Didit provides one)
    // 2. Store the verification results in your database
    // 3. Update user's KYC status
    // 4. Trigger any post-verification actions

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
