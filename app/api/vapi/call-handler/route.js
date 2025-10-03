import { NextResponse } from "next/server";
import { createFishingCaptainAssistant } from "@/lib/vapi";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";
import { getServerUrl } from "@/lib/utils/urls";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    console.log("🎣 Received call request:", body);

    // Extract call information from VAPI
    const { customer } = body;

    // Look up captain information from database
    // You'll need to determine which captain this call is for
    // This could be based on the phone number, caller ID, or other logic
    const captain = await Captain.findOne({
      serviceEnabled: true,
    }).limit(1); // For now, get the first enabled captain

    if (!captain) {
      console.error("❌ No captain found for call");
      return NextResponse.json({
        response: "hang",
        message: "Sorry, no captain is available at this time.",
      });
    }

    const captainInfo = {
      captainName: captain.captainName,
      businessName: captain.businessName,
      phoneNumber: customer?.number || "Unknown",
      customInstructions: captain.customInstructions,
      location: captain.location,
      seasonalInfo: captain.seasonalInfo,
      tripTypes: captain.tripTypes,
      boatInfo: captain.boatInfo,
      pricingInfo: captain.pricingInfo,
    };

    // Create the assistant configuration
    const assistantConfig = {
      name: `${captainInfo.captainName}'s Fishing Assistant`,
      captainName: captainInfo.captainName,
      businessName: captainInfo.businessName,
      phoneNumber: captainInfo.phoneNumber,
      localFishingInfo: `${captainInfo.location} fishing guide. ${
        captainInfo.seasonalInfo || "Available for various fishing experiences."
      } Trip types: ${
        captainInfo.tripTypes?.join(", ") || "inshore, offshore"
      }. ${captainInfo.boatInfo || ""} ${captainInfo.pricingInfo || ""}`.trim(),
      customInstructions: captainInfo.customInstructions,
    };

    // Create the VAPI assistant dynamically
    const assistant = await createFishingCaptainAssistant(assistantConfig);

    console.log("✅ Created assistant for call:", assistant.id);

    // Return VAPI response to start the call
    return NextResponse.json({
      response: "continue",
      assistant: {
        id: assistant.id,
      },
    });
  } catch (error) {
    console.error("❌ Error handling call:", error);

    // Return error response to VAPI
    return NextResponse.json(
      {
        response: "hang",
        message:
          "Sorry, we're experiencing technical difficulties. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Call handler endpoint ready",
      instructions:
        "This endpoint receives calls from VAPI and creates custom assistants for each captain",
      webhookUrl: getServerUrl(),
    },
    { status: 200 }
  );
}
