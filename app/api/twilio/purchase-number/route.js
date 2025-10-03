import { NextResponse } from "next/server";
import twilio from "twilio";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { areaCode, captainId } = body;

    if (!areaCode) {
      return NextResponse.json(
        { error: "Area code is required" },
        { status: 400 }
      );
    }

    if (!captainId) {
      return NextResponse.json(
        { error: "Captain ID is required" },
        { status: 400 }
      );
    }

    // Find the captain
    const captain = await Captain.findById(captainId);
    if (!captain) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    console.log(`🔍 Searching for available numbers in area code: ${areaCode}`);

    // Search for available numbers using Twilio API
    const availableNumbers = await client
      .availablePhoneNumbers("US")
      .local.list({
        areaCode: areaCode,
        limit: 10,
        voiceEnabled: true,
        smsEnabled: true,
      });

    console.log(
      `✅ Found ${availableNumbers.length} available numbers in area code ${areaCode}`
    );

    let selectedNumber = null;

    // If no numbers found in the specific area code, try broader search
    if (availableNumbers.length === 0) {
      console.log(
        `🔍 No numbers found in area code ${areaCode}, trying broader search...`
      );

      // Try searching in the same state/region without area code restriction
      const stateNumbers = await client.availablePhoneNumbers("US").local.list({
        limit: 10,
        voiceEnabled: true,
        smsEnabled: true,
      });

      console.log(
        `✅ Found ${stateNumbers.length} available numbers in broader search`
      );

      if (stateNumbers.length > 0) {
        selectedNumber = stateNumbers[0].phoneNumber;
      } else {
        // If still no numbers in broader search, return error
        console.log(`❌ No numbers found anywhere in the US`);

        return NextResponse.json(
          {
            success: false,
            error: "No phone numbers available",
            message: `No numbers available in area code ${areaCode} or anywhere in the US. Please try again later or contact support.`,
          },
          { status: 404 }
        );
      }
    } else {
      // Select the first available number
      selectedNumber = availableNumbers[0].phoneNumber;
    }

    console.log(`🎯 Auto-selecting number: ${selectedNumber}`);

    // Now purchase the selected number
    // SAFETY CHECK: Prevent accidental purchases in development
    if (
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_REAL_PURCHASES !== "true"
    ) {
      console.log("🛡️ SAFETY MODE: Real purchases disabled in development");

      // Store simulated purchase in Captain document
      const simulatedPurchase = {
        phoneNumber: selectedNumber,
        sid: `PN_SAFETY_MODE_${Date.now()}`,
        purchasedAt: new Date(),
        webhookUrl: "https://api.vapi.ai/twilio/inbound_call", // VAPI-First: Direct to VAPI
        status: "active",
        capabilities: {
          voice: true,
          sms: true,
          mms: true,
          fax: false,
        },
      };

      // Update captain with simulated purchase
      captain.twilioNumber = simulatedPurchase;
      await captain.save();

      return NextResponse.json({
        success: true,
        purchase: {
          success: true,
          phoneNumber: selectedNumber,
          sid: simulatedPurchase.sid,
          cost: "$1.00",
          monthlyRate: "$1.15",
          capabilities: simulatedPurchase.capabilities,
          webhook: {
            url: simulatedPurchase.webhookUrl,
            configured: true,
          },
          safetyMode: true,
          message:
            "SAFETY MODE: No real purchase made. Set ALLOW_REAL_PURCHASES=true to enable real purchases.",
        },
        message: `SAFETY MODE: Auto-purchased ${selectedNumber}`,
        nextSteps: {
          callForwarding: {
            code: "*72",
            instructions: `To enable call forwarding:\n1. Pick up your phone\n2. Dial *72\n3. Dial ${selectedNumber}\n4. Hang up when you hear the confirmation tone`,
          },
        },
      });
    }

    console.log(`🛒 Auto-purchasing Twilio number: ${selectedNumber}`);

    // Purchase the phone number using Twilio API
    // VAPI-First Architecture: Point directly to VAPI's inbound call endpoint
    const incomingPhoneNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: selectedNumber,
      voiceUrl: "https://api.vapi.ai/twilio/inbound_call",
      voiceMethod: "POST",
      smsUrl: "https://api.vapi.ai/twilio/inbound_call",
      smsMethod: "POST",
    });

    console.log(`✅ Successfully auto-purchased Twilio number:`, {
      sid: incomingPhoneNumber.sid,
      phoneNumber: incomingPhoneNumber.phoneNumber,
      voiceUrl: incomingPhoneNumber.voiceUrl,
    });

    // Note: SMS notifications now use a single campaign number
    // Individual Twilio numbers are only used for voice calls
    console.log(
      `📱 SMS notifications will be sent from campaign number: ${
        process.env.TWILIO_SMS_CAMPAIGN_NUMBER || "Not configured"
      }`
    );

    // Store real purchase in Captain document
    const realPurchase = {
      phoneNumber: incomingPhoneNumber.phoneNumber,
      sid: incomingPhoneNumber.sid,
      purchasedAt: new Date(),
      webhookUrl: "https://api.vapi.ai/twilio/inbound_call", // VAPI-First: Direct to VAPI
      status: "active",
      capabilities: {
        voice: incomingPhoneNumber.capabilities.voice || true,
        sms: incomingPhoneNumber.capabilities.sms || true,
        mms: incomingPhoneNumber.capabilities.mms || false,
        fax: incomingPhoneNumber.capabilities.fax || false,
      },
    };

    // Update captain with real purchase
    captain.twilioNumber = realPurchase;
    await captain.save();

    console.log(
      `✅ Captain ${captain.captainName} updated with auto-purchased Twilio number: ${incomingPhoneNumber.phoneNumber}`
    );

    const purchaseResult = {
      success: true,
      phoneNumber: incomingPhoneNumber.phoneNumber,
      sid: incomingPhoneNumber.sid,
      cost: "$1.00", // Twilio's standard setup cost
      monthlyRate: "$1.15", // Twilio's standard monthly rate
      capabilities: incomingPhoneNumber.capabilities,
      webhook: {
        url: incomingPhoneNumber.voiceUrl,
        configured: true,
      },
      twilioData: {
        friendlyName: incomingPhoneNumber.friendlyName,
        accountSid: incomingPhoneNumber.accountSid,
        apiVersion: incomingPhoneNumber.apiVersion,
        dateCreated: incomingPhoneNumber.dateCreated,
        dateUpdated: incomingPhoneNumber.dateUpdated,
      },
    };

    return NextResponse.json({
      success: true,
      purchase: purchaseResult,
      message: `Successfully auto-purchased ${selectedNumber}!`,
      nextSteps: {
        callForwarding: {
          code: "*72",
          instructions: `To enable call forwarding:\n1. Pick up your phone\n2. Dial *72\n3. Dial ${selectedNumber}\n4. Hang up when you hear the confirmation tone`,
        },
      },
    });
  } catch (error) {
    console.error("❌ General error in auto-purchase:", error);

    // Handle specific Twilio errors
    if (error.code === 21211) {
      return NextResponse.json(
        {
          error: "Phone number is not available for purchase",
          details:
            "The selected number may have been purchased by someone else. Please try again.",
          code: error.code,
        },
        { status: 400 }
      );
    } else if (error.code === 21212) {
      return NextResponse.json(
        {
          error: "Invalid phone number format",
          details: "Please ensure the phone number is in the correct format.",
          code: error.code,
        },
        { status: 400 }
      );
    } else if (error.code === 20003) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: "Invalid Twilio credentials. Please check your API keys.",
          code: error.code,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to auto-purchase number", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { phoneNumber, captainId } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!captainId) {
      return NextResponse.json(
        { error: "Captain ID is required" },
        { status: 400 }
      );
    }

    // Find the captain
    const captain = await Captain.findById(captainId);
    if (!captain) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    // SAFETY CHECK: Prevent accidental purchases in development
    if (
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_REAL_PURCHASES !== "true"
    ) {
      console.log("🛡️ SAFETY MODE: Real purchases disabled in development");

      // Store simulated purchase in Captain document
      const simulatedPurchase = {
        phoneNumber: phoneNumber,
        sid: `PN_SAFETY_MODE_${Date.now()}`,
        purchasedAt: new Date(),
        webhookUrl: "https://api.vapi.ai/twilio/inbound_call", // VAPI-First: Direct to VAPI
        status: "active",
        capabilities: {
          voice: true,
          sms: true,
          mms: true,
          fax: false,
        },
      };

      // Update captain with simulated purchase
      captain.twilioNumber = simulatedPurchase;
      await captain.save();

      return NextResponse.json(
        {
          success: true,
          purchase: {
            success: true,
            phoneNumber: phoneNumber,
            sid: simulatedPurchase.sid,
            cost: "$1.00",
            monthlyRate: "$1.15",
            capabilities: simulatedPurchase.capabilities,
            webhook: {
              url: simulatedPurchase.webhookUrl,
              configured: true,
            },
            safetyMode: true,
            message:
              "SAFETY MODE: No real purchase made. Set ALLOW_REAL_PURCHASES=true to enable real purchases.",
          },
          message: `SAFETY MODE: Simulated purchase of ${phoneNumber}`,
          nextSteps: {
            callForwarding: {
              code: "*72",
              instructions: `To enable call forwarding:\n1. Pick up your phone\n2. Dial *72\n3. Dial ${phoneNumber}\n4. Hang up when you hear the confirmation tone`,
            },
          },
        },
        { status: 200 }
      );
    }

    console.log(`🛒 Purchasing Twilio number: ${phoneNumber}`);

    // Purchase the phone number using Twilio API
    // VAPI-First Architecture: Point directly to VAPI's inbound call endpoint
    const incomingPhoneNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
      voiceUrl: "https://api.vapi.ai/twilio/inbound_call",
      voiceMethod: "POST",
      smsUrl: "https://api.vapi.ai/twilio/inbound_call",
      smsMethod: "POST",
    });

    console.log(`✅ Successfully purchased Twilio number:`, {
      sid: incomingPhoneNumber.sid,
      phoneNumber: incomingPhoneNumber.phoneNumber,
      voiceUrl: incomingPhoneNumber.voiceUrl,
    });

    // Note: SMS notifications now use a single campaign number
    // Individual Twilio numbers are only used for voice calls
    console.log(
      `📱 SMS notifications will be sent from campaign number: ${
        process.env.TWILIO_SMS_CAMPAIGN_NUMBER || "Not configured"
      }`
    );

    // Get the actual cost from Twilio
    // const phoneNumberResource = await client
    //   .incomingPhoneNumbers(incomingPhoneNumber.sid)
    //   .fetch();

    // Store real purchase in Captain document
    const realPurchase = {
      phoneNumber: incomingPhoneNumber.phoneNumber,
      sid: incomingPhoneNumber.sid,
      purchasedAt: new Date(),
      webhookUrl: "https://api.vapi.ai/twilio/inbound_call", // VAPI-First: Direct to VAPI
      status: "active",
      capabilities: {
        voice: incomingPhoneNumber.capabilities.voice || true,
        sms: incomingPhoneNumber.capabilities.sms || true,
        mms: incomingPhoneNumber.capabilities.mms || false,
        fax: incomingPhoneNumber.capabilities.fax || false,
      },
    };

    // Update captain with real purchase
    captain.twilioNumber = realPurchase;
    await captain.save();

    console.log(
      `✅ Captain ${captain.captainName} updated with Twilio number: ${incomingPhoneNumber.phoneNumber}`
    );

    const purchaseResult = {
      success: true,
      phoneNumber: incomingPhoneNumber.phoneNumber,
      sid: incomingPhoneNumber.sid,
      cost: "$1.00", // Twilio's standard setup cost
      monthlyRate: "$1.15", // Twilio's standard monthly rate
      capabilities: incomingPhoneNumber.capabilities,
      webhook: {
        url: incomingPhoneNumber.voiceUrl,
        configured: true,
      },
      twilioData: {
        friendlyName: incomingPhoneNumber.friendlyName,
        accountSid: incomingPhoneNumber.accountSid,
        apiVersion: incomingPhoneNumber.apiVersion,
        dateCreated: incomingPhoneNumber.dateCreated,
        dateUpdated: incomingPhoneNumber.dateUpdated,
      },
    };

    return NextResponse.json({
      success: true,
      purchase: purchaseResult,
      message: `Successfully purchased ${phoneNumber}!`,
      nextSteps: {
        callForwarding: {
          code: "*72",
          instructions: `To enable call forwarding:\n1. Pick up your phone\n2. Dial *72\n3. Dial ${phoneNumber}\n4. Hang up when you hear the confirmation tone`,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error purchasing Twilio number:", error);

    // Handle specific Twilio errors
    if (error.code === 21211) {
      return NextResponse.json(
        {
          error: "Phone number is not available for purchase",
          details:
            "The selected number may have been purchased by someone else. Please try selecting a different number.",
          code: error.code,
        },
        { status: 400 }
      );
    } else if (error.code === 21212) {
      return NextResponse.json(
        {
          error: "Invalid phone number format",
          details: "Please ensure the phone number is in the correct format.",
          code: error.code,
        },
        { status: 400 }
      );
    } else if (error.code === 20003) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: "Invalid Twilio credentials. Please check your API keys.",
          code: error.code,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to purchase number",
        details: error.message,
        code: error.code || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
