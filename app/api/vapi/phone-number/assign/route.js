import { NextResponse } from "next/server";
import { assignAssistantToPhoneNumber } from "@/lib/vapi";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { phoneNumberId, assistantId, captainId } = body;

    if (!phoneNumberId || !assistantId || !captainId) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumberId, assistantId, and captainId are required",
        },
        { status: 400 }
      );
    }

    console.log(
      `🔗 Assigning assistant ${assistantId} to VAPI phone number ${phoneNumberId}...`
    );

    // Assign assistant to phone number in VAPI
    const result = await assignAssistantToPhoneNumber(
      phoneNumberId,
      assistantId
    );

    // Update captain with assistant assignment confirmation
    const captain = await Captain.findById(captainId);
    if (captain && captain.twilioNumber) {
      captain.twilioNumber.assistantId = assistantId;
      captain.twilioNumber.vapiIntegrationStatus = "active";
      await captain.save();
      console.log(
        `✅ Captain ${captain.captainName} updated with assistant assignment`
      );
    }

    return NextResponse.json({
      success: true,
      result: result,
      message: `Successfully assigned assistant ${assistantId} to phone number ${phoneNumberId}`,
    });
  } catch (error) {
    console.error("❌ Error assigning assistant to phone number:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to assign assistant to phone number",
        fallback: "webhook",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "VAPI phone number assignment endpoint",
      instructions:
        "Send a POST request with phoneNumberId, assistantId, and captainId to assign an assistant to a VAPI phone number",
    },
    { status: 200 }
  );
}
