import { NextResponse } from "next/server";
import {
  importTwilioNumberToVapi,
  assignAssistantToPhoneNumber,
} from "@/lib/vapi";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { twilioNumber, captainId, assistantId } = body;

    console.log("🔍 VAPI Phone Number Import Request:", {
      twilioNumber,
      captainId,
      assistantId,
      hasTwilioCredentials: !!(
        process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ),
    });

    if (!twilioNumber || !captainId) {
      console.error("❌ Missing required fields:", { twilioNumber, captainId });
      return NextResponse.json(
        {
          success: false,
          error: "twilioNumber and captainId are required",
        },
        { status: 400 }
      );
    }

    // Get captain from database to retrieve assistant ID
    const captain = await Captain.findById(captainId);
    if (!captain) {
      console.error("❌ Captain not found:", captainId);
      return NextResponse.json(
        {
          success: false,
          error: "Captain not found",
        },
        { status: 404 }
      );
    }

    console.log("✅ Captain found:", {
      captainName: captain.captainName,
      vapiAssistantId: captain.vapiAssistantId,
    });

    // Use assistant ID from database or provided parameter
    const finalAssistantId = assistantId || captain.vapiAssistantId;
    if (!finalAssistantId) {
      console.error("❌ No assistant ID found:", {
        providedAssistantId: assistantId,
        captainAssistantId: captain.vapiAssistantId,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Assistant ID not found. Please create an assistant first.",
        },
        { status: 400 }
      );
    }

    console.log("✅ Using assistant ID:", finalAssistantId);

    // Get Twilio credentials from environment
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    console.log("🔑 Twilio credentials check:", {
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
      accountSidLength: twilioAccountSid?.length || 0,
    });

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error("❌ Twilio credentials missing:", {
        accountSid: twilioAccountSid ? "SET" : "MISSING",
        authToken: twilioAuthToken ? "SET" : "MISSING",
      });
      return NextResponse.json(
        {
          success: false,
          error: "Twilio credentials not configured",
          fallback: "webhook",
        },
        { status: 400 }
      );
    }

    console.log(
      `📞 Setting up VAPI integration for Twilio number ${twilioNumber} with assistant ${finalAssistantId}...`
    );

    // Check if this is a simulated number (Safety Mode)
    const isSimulatedNumber =
      twilioNumber.startsWith("+1XXXXXXXXXX") ||
      twilioNumber.includes("SAFETY_MODE") ||
      twilioNumber === "+13392298722" || // Known simulated number
      (process.env.NODE_ENV === "development" &&
        process.env.ALLOW_REAL_PURCHASES !== "true");

    if (isSimulatedNumber) {
      console.log("🛡️ SAFETY MODE: Skipping VAPI import for simulated number");

      // Create simulated VAPI phone number data
      const simulatedVapiPhoneNumber = {
        id: `vapi_simulated_${Date.now()}`,
        number: twilioNumber,
        assistantId: finalAssistantId,
        status: "active",
        simulated: true,
      };

      console.log(
        "✅ Simulated VAPI phone number created:",
        simulatedVapiPhoneNumber.id
      );

      // Update captain with simulated VAPI data
      if (captain && captain.twilioNumber) {
        captain.twilioNumber.vapiPhoneNumberId = simulatedVapiPhoneNumber.id;
        captain.twilioNumber.vapiPhoneNumber = simulatedVapiPhoneNumber.number; // Store the actual phone number
        captain.twilioNumber.assistantId = finalAssistantId;
        captain.twilioNumber.vapiIntegrationStatus = "active";
        await captain.save();
        console.log(
          `✅ Captain ${captain.captainName} updated with simulated VAPI phone number ID: ${simulatedVapiPhoneNumber.id} and number: ${simulatedVapiPhoneNumber.number}`
        );
      }

      return NextResponse.json({
        success: true,
        vapiPhoneNumberId: simulatedVapiPhoneNumber.id,
        vapiPhoneNumber: simulatedVapiPhoneNumber,
        message: `SAFETY MODE: Simulated VAPI integration for ${twilioNumber} with assistant ${finalAssistantId}`,
        simulated: true,
      });
    }

    // Step 1: Import Twilio number to VAPI (Real numbers only)
    console.log("🚀 Starting VAPI phone number import...");
    const vapiPhoneNumber = await importTwilioNumberToVapi(
      twilioNumber,
      finalAssistantId,
      twilioAccountSid,
      twilioAuthToken
    );

    // Step 2: Assign assistant to the imported phone number
    console.log(
      `🔗 Assigning assistant ${finalAssistantId} to phone number ${vapiPhoneNumber.id}...`
    );
    await assignAssistantToPhoneNumber(vapiPhoneNumber.id, finalAssistantId);

    // Update captain with VAPI phone number ID
    if (captain && captain.twilioNumber) {
      captain.twilioNumber.vapiPhoneNumberId = vapiPhoneNumber.id;
      captain.twilioNumber.vapiPhoneNumber = vapiPhoneNumber.number; // Store the actual phone number
      captain.twilioNumber.assistantId = finalAssistantId;
      captain.twilioNumber.vapiIntegrationStatus = "active";
      await captain.save();
      console.log(
        `✅ Captain ${captain.captainName} updated with VAPI phone number ID: ${vapiPhoneNumber.id} and number: ${vapiPhoneNumber.number}`
      );
    }

    return NextResponse.json({
      success: true,
      vapiPhoneNumberId: vapiPhoneNumber.id,
      vapiPhoneNumber: vapiPhoneNumber,
      message: `Successfully imported ${twilioNumber} to VAPI and assigned to assistant ${finalAssistantId}`,
    });
  } catch (error) {
    console.error("❌ Error importing Twilio number to VAPI:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import Twilio number to VAPI",
        fallback: "webhook",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "VAPI phone number import endpoint",
      instructions:
        "Send a POST request with twilioNumber, captainId, and assistantId to import a Twilio number to VAPI and assign it to an assistant",
    },
    { status: 200 }
  );
}
