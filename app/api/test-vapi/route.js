import { NextResponse } from "next/server";
import { getAllAssistants } from "@/lib/vapi";

export async function GET() {
  try {
    // Test VAPI API connectivity
    const assistants = await getAllAssistants();

    return NextResponse.json(
      {
        message: "VAPI API connection successful!",
        status: "connected",
        assistantsCount: assistants.length,
        assistants: assistants.slice(0, 3), // Show first 3 assistants
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("VAPI API connection error:", error);

    return NextResponse.json(
      {
        message: "VAPI API connection failed",
        error: error.message,
        status: "error",
        timestamp: new Date().toISOString(),
        troubleshooting: {
          checkApiKey: "Make sure VAPI_API_KEY is set in your .env.local file",
          checkAccount: "Verify your VAPI account is active and has API access",
          checkNetwork: "Ensure your server can reach api.vapi.ai",
        },
      },
      { status: 500 }
    );
  }
}
