import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-vapi-signature");

    console.log("🧪 Test webhook received!");
    console.log("📝 Signature:", signature);
    console.log("📦 Body:", body);

    return NextResponse.json(
      {
        success: true,
        message: "Test webhook received successfully!",
        timestamp: new Date().toISOString(),
        signature: signature,
        bodyLength: body.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Test webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Test webhook endpoint ready",
      instructions: "Send a POST request to test webhook functionality",
      webhookUrl: "https://your-ngrok-url.ngrok.io/api/test-webhook",
    },
    { status: 200 }
  );
}
