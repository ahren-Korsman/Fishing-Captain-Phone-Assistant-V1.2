import { NextResponse } from "next/server";
import twilio from "twilio";

// Initialize Twilio client
// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

export async function POST() {
  try {
    // VAPI-FIRST ARCHITECTURE: This webhook is no longer used
    // Twilio phone numbers now point directly to VAPI's inbound call endpoint
    console.log(
      "⚠️ DEPRECATED: Twilio webhook called but not used in VAPI-First architecture"
    );
    console.log(
      "📞 Twilio numbers now point directly to: https://api.vapi.ai/twilio/inbound_call"
    );

    // Return a simple response since this webhook is not used
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("This service is no longer active. Please contact support.");
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });

    // OLD CODE BELOW - KEPT FOR REFERENCE BUT NOT EXECUTED
    /*
    await connectDB();

    const body = await request.formData();

    // Extract Twilio call data
    const callSid = body.get("CallSid");
    const from = body.get("From");
    const to = body.get("To");
    const callStatus = body.get("CallStatus");
    const dialCallStatus = body.get("DialCallStatus"); // Status of the dialed call
    const dialCallDuration = body.get("DialCallDuration"); // Duration of the dialed call

    // Find the captain associated with this Twilio number
    const captain = await Captain.findOne({
      "twilioNumber.phoneNumber": to,
      serviceEnabled: true,
    });

    console.log("📞 Twilio webhook received:", {
      callSid,
      from,
      to,
      callStatus,
      dialCallStatus,
      dialCallDuration,
      captainFound: !!captain,
      captainName: captain?.captainName,
      captainPhone: captain?.phoneNumber,
      vapiPhoneNumberId: captain?.twilioNumber?.vapiPhoneNumberId,
      vapiPhoneNumber: captain?.twilioNumber?.vapiPhoneNumber,
      vapiIntegrationStatus: captain?.twilioNumber?.vapiIntegrationStatus,
    });

    if (!captain) {
      console.error("❌ No captain found for Twilio number:", to);
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say("Sorry, this service is not available at the moment.");
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    const twiml = new twilio.twiml.VoiceResponse();

    // Check if VAPI integration is active
    if (captain.twilioNumber?.vapiIntegrationStatus === "active" && captain.twilioNumber?.vapiPhoneNumber) {
      // VAPI Integration Active: Forward directly to VAPI
      console.log(`🤖 VAPI Integration Active: Forwarding to VAPI phone number: ${captain.twilioNumber.vapiPhoneNumber}`);
      
      twiml.dial(captain.twilioNumber.vapiPhoneNumber, {
        callerId: to,
      });
      
      console.log("✅ TwiML created: Forwarding to VAPI");
    } else {
      // VAPI Integration Not Ready: Use Twilio-First approach
      console.log("⚠️ VAPI integration not ready, using Twilio-First approach");
      
      // Check if this is the initial call (no dialCallStatus means we haven't tried to reach captain yet)
      if (!dialCallStatus) {
        console.log(
          `🎣 INITIAL CALL: Attempting to reach captain ${captain.captainName} at ${captain.phoneNumber}`
        );

        // First, try to reach the captain directly
        const dial = twiml.dial({
          timeout: 20, // Wait 20 seconds for captain to answer
          action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/webhook?captainId=${captain._id}`,
          method: "POST",
          callerId: to, // Use the purchased number as caller ID
        });

        // Format captain's phone number with country code if missing
        let captainPhoneNumber = captain.phoneNumber;
        if (!captainPhoneNumber.startsWith("+")) {
          if (captainPhoneNumber.length === 10) {
            captainPhoneNumber = `+1${captainPhoneNumber}`;
          } else if (
            captainPhoneNumber.length === 11 &&
            captainPhoneNumber.startsWith("1")
          ) {
            captainPhoneNumber = `+${captainPhoneNumber}`;
          } else {
            // If it doesn't match expected patterns, assume it's a 10-digit US number
            captainPhoneNumber = `+1${captainPhoneNumber}`;
          }
        }

        console.log(`📞 Dialing captain at: ${captainPhoneNumber}`);
        dial.number(captainPhoneNumber);

        console.log("✅ TwiML created: Attempting to reach captain first");
      } else if (
        dialCallStatus === "no-answer" ||
        dialCallStatus === "busy" ||
        dialCallStatus === "failed"
      ) {
        // Captain didn't answer or is busy - AI takes over
        console.log(
          `🤖 Captain ${captain.captainName} ${dialCallStatus}, AI taking over`
        );

        // Get VAPI phone number for this captain
        const vapiPhoneNumber = captain.twilioNumber?.vapiPhoneNumber;

        if (vapiPhoneNumber) {
          console.log(`📞 Forwarding to VAPI phone number: ${vapiPhoneNumber}`);

          // Forward to VAPI AI assistant using the actual phone number
          twiml.dial(vapiPhoneNumber, {
            callerId: to,
          });
        } else {
          console.error(
            "❌ No VAPI phone number found for captain:",
            captain.captainName
          );
          console.error("❌ Captain VAPI data:", {
            vapiPhoneNumberId: captain.twilioNumber?.vapiPhoneNumberId,
            vapiPhoneNumber: captain.twilioNumber?.vapiPhoneNumber,
            vapiIntegrationStatus: captain.twilioNumber?.vapiIntegrationStatus,
          });

          // Fallback: Use a default VAPI number or create a simple response
          const fallbackNumber = process.env.VAPI_PHONE_NUMBER || "+1234567890";
          console.log(`📞 Using fallback VAPI number: ${fallbackNumber}`);

          twiml.dial(fallbackNumber, {
            callerId: to,
          });
        }

        console.log("✅ TwiML created: Forwarding to AI assistant");
      } else if (dialCallStatus === "completed") {
        // Captain answered and call completed normally
        console.log(
          `✅ Captain ${captain.captainName} handled the call successfully`
        );
        twiml.hangup();
      } else {
        // Fallback: Forward to AI
        console.log("🔄 Fallback: Forwarding to AI assistant");
        console.log(
          `📊 Fallback triggered - Call Status: ${callStatus}, Dial Status: ${dialCallStatus}`
        );

        // Get VAPI phone number for this captain
        const vapiPhoneNumber = captain.twilioNumber?.vapiPhoneNumber;

        if (vapiPhoneNumber) {
          console.log(
            `📞 Fallback forwarding to VAPI phone number: ${vapiPhoneNumber}`
          );

          // Forward to VAPI AI assistant using the actual phone number
          twiml.dial(vapiPhoneNumber, {
            callerId: to,
          });
        } else {
          console.error(
            "❌ No VAPI phone number found for captain:",
            captain.captainName
          );
          console.error("❌ Captain VAPI data:", {
            vapiPhoneNumberId: captain.twilioNumber?.vapiPhoneNumberId,
            vapiPhoneNumber: captain.twilioNumber?.vapiPhoneNumber,
            vapiIntegrationStatus: captain.twilioNumber?.vapiIntegrationStatus,
          });

          // Fallback: Use a default VAPI number or create a simple response
          const fallbackNumber = process.env.VAPI_PHONE_NUMBER || "+1234567890";
          console.log(`📞 Using fallback VAPI number: ${fallbackNumber}`);

          twiml.dial(fallbackNumber, {
            callerId: to,
          });
        }
      }
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
    */
  } catch (error) {
    console.error("❌ Error in deprecated webhook:", error);

    // Return error TwiML
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      "Sorry, we're experiencing technical difficulties. Please try again later."
    );
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Twilio webhook endpoint (DEPRECATED)",
      status: "deprecated",
      architecture: "VAPI-First",
      instructions:
        "This webhook is no longer used. Twilio numbers now point directly to VAPI's inbound call endpoint.",
      vapiEndpoint: "https://api.vapi.ai/twilio/inbound_call",
    },
    { status: 200 }
  );
}
