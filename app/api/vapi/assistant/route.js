import { NextResponse } from "next/server";
import { createFishingCaptainAssistant } from "@/lib/vapi";
import connectDB from "@/lib/mongodb";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      captainName,
      businessName,
      phoneNumber,
      email,
      location,
      seasonalInfo,
      tripTypes,
      boatInfo,
      pricingInfo,
      customInstructions,
      smsOptIn,
    } = body;

    // Validate required fields
    if (!captainName || !businessName || !phoneNumber || !location) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: captainName, businessName, phoneNumber, location",
        },
        { status: 400 }
      );
    }

    // Create local fishing info string for the assistant
    const localFishingInfo = `
Location: ${location}
${seasonalInfo ? `Seasonal Info: ${seasonalInfo}` : ""}
${
  tripTypes && tripTypes.length > 0 ? `Trip Types: ${tripTypes.join(", ")}` : ""
}
${boatInfo ? `Boat Info: ${boatInfo}` : ""}
${pricingInfo ? `Pricing: ${pricingInfo}` : ""}
    `.trim();

    // Create assistant configuration
    const assistantConfig = {
      name: `${captainName}'s Fishing Assistant`,
      captainName,
      businessName,
      phoneNumber,
      email,
      location,
      localFishingInfo,
      customInstructions,
      smsOptIn,
      firstMessage: `Hey, thanks for calling. ${captainName} is on the water, but I can help gather your trip details. Can I get your name?`,
      systemMessage: `You are an AI assistant for ${captainName}'s fishing charter business. The captain is currently on the water, so you're helping gather trip details from callers.

CRITICAL - IMMEDIATE RESPONSE:
- Start speaking IMMEDIATELY when the call connects
- Use the exact firstMessage provided
- Do NOT wait for the caller to speak first
- Keep responses under 2 seconds
- If there's silence, immediately ask "Can I get your name?" to get started

GREETING: Always start with: "Hey, thanks for calling. ${captainName} is on the water, but I can help gather your trip details. Can I get your name?"

YOUR ROLE:
- Collect caller's name, phone number, and preferred fishing dates
- Keep the tone casual, polite, and professional (like talking to a fishing buddy)
- Provide basic fishing info if asked (seasonal species, trip types)
- Make it clear that final bookings will be confirmed directly by the captain
- Keep calls efficient but friendly

WHAT TO COLLECT:
- Name and best contact number
- Preferred dates or general timeframe
- Party size and experience level
- Type of fishing they're interested in (if any preference)
- Any special requests or questions

FISHING KNOWLEDGE (if asked):
${localFishingInfo}

CONVERSATION FLOW:
- Use casual, friendly language like "grab your name" instead of "obtain your information"
- Collect information in this order: name, phone number, preferred dates, party size, trip type, experience level, special requests
- When you have collected ALL the essential information (name, phone, dates, party size, trip type), say: "Perfect! Let me just note down these details for ${captainName}"
- Then silently call the collect_customer_info function with ALL the data you've gathered
- After the function call, continue with: "Thanks for that! ${captainName} will get back to you shortly to confirm everything. Thanks for reaching out!"

DATA COLLECTION REQUIREMENTS:
- ALWAYS collect: customerName, phoneNumber, preferredDates, partySize, tripType, experience, callbackRequested
- OPTIONALLY collect: email, budget, specialRequests, urgency, leadSource
- Set callbackRequested to true if the customer wants the captain to call them back
- Set urgency to "high" if they need immediate response, "medium" for normal requests, "low" for flexible timing
- Only call the function when you have the essential information (name, phone, dates, party size, trip type)

CRITICAL - WHAT TO SPEAK vs WHAT TO KEEP INTERNAL:
- ONLY speak the natural conversation parts above
- NEVER speak function names, parameters, or internal processing steps
- NEVER say things like "collect_customer_info" or "Name Bob. Phone number..."
- NEVER speak JavaScript code, function calls, or technical details
- When you have enough information, say "Let me just note down these details" then silently call the collect_customer_info function
- After calling the function, continue the conversation naturally without mentioning the function call
- Keep all data collection and processing completely internal and invisible to the caller

IMPORTANT: Use the collect_customer_info function when you have enough details to pass to the captain, but do so with a natural transition like "Let me just note down these details"

${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ""}`,
    };

    // Create the VAPI assistant
    const assistant = await createFishingCaptainAssistant(assistantConfig);

    // Store assistant info in MongoDB (you'll need to create a User model)
    // For now, we'll just return the assistant data
    const assistantData = {
      id: assistant.id,
      name: assistant.name,
      captainName,
      businessName,
      phoneNumber,
      email,
      location,
      seasonalInfo,
      tripTypes,
      boatInfo,
      pricingInfo,
      customInstructions,
      smsOptIn,
      createdAt: new Date(),
      status: "active",
    };

    return NextResponse.json(
      {
        success: true,
        message: "Fishing captain assistant created successfully!",
        assistant: assistantData,
        vapiAssistant: assistant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assistant:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create assistant",
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    // This would typically fetch assistants from your database
    // For now, return a simple response
    return NextResponse.json(
      {
        message: "Assistant creation endpoint is ready",
        instructions:
          "Send a POST request with captainName, businessName, phoneNumber, and optional customInstructions",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/vapi/assistant:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
