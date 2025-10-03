import { NextResponse } from "next/server";
import twilio from "twilio";

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper function to get forwarding instructions based on carrier
// Based on Conditional_Call_Forwarding_Codes_by_Carrier.md
function getForwardingInstructions(carrierName) {
  const instructions = {
    Verizon: {
      code: "*72",
      description: "Verizon Unconditional Call Forwarding",
      steps: [
        "Pick up your phone and listen for dial tone",
        "Dial *72 followed by the forwarding number",
        "Wait for confirmation tone",
        "Hang up when you hear confirmation",
      ],
      disableCode: "*73",
      notes: [
        "Verizon codes do not use trailing #",
        "Forwarded calls still incur airtime charges",
        "Forwarding to international numbers is not allowed",
        "⚠️ IMPORTANT: Verizon does NOT support unreachable forwarding",
        "💡 RECOMMENDATION: Use 'Forward All Calls' (*72) when going offshore",
      ],
      conditionalCodes: {
        busy: "*71",
        noAnswer: "*71",
        unreachable: "Not supported (defaults to voicemail)",
      },
      // Special guidance for fishing captains - TWILIO-FIRST APPROACH
      fishingCaptainGuidance: {
        recommended: "unconditional", // Always use unconditional forwarding
        explanation:
          "✅ RECOMMENDED: Use unconditional forwarding (*72) for reliable call handling. Our Twilio-First system will try to reach you first, then seamlessly transfer to AI if you're unavailable.",
        benefits: [
          "100% reliable - no carrier-dependent conditional forwarding",
          "Seamless customer experience - they never know the difference",
          "Works perfectly offshore when you have no service",
          "AI takes over only when you're truly unavailable",
        ],
        setupInstructions:
          "Dial *72 + [your Twilio number] to forward all calls. Our system handles the rest!",
      },
    },
    "AT&T": {
      code: "*21*",
      description: "AT&T Unconditional Call Forwarding",
      steps: [
        "Pick up your phone and listen for dial tone",
        "Dial *21* followed by the forwarding number",
        "Press # to confirm",
        "Wait for confirmation message",
        "Hang up",
      ],
      disableCode: "##21#",
      notes: [
        "AT&T uses GSM-standard single-star codes",
        "All codes end with #",
        "✅ EXCELLENT: AT&T supports unreachable forwarding (*62*)",
        "🌊 PERFECT for offshore fishing with no service",
      ],
      conditionalCodes: {
        busy: "*67*",
        noAnswer: "*61*",
        unreachable: "*62*",
      },
      fishingCaptainGuidance: {
        recommended: "unconditional", // Always use unconditional forwarding
        explanation:
          "✅ RECOMMENDED: Use unconditional forwarding (*21*) for reliable call handling. Our Twilio-First system will try to reach you first, then seamlessly transfer to AI if you're unavailable.",
        benefits: [
          "100% reliable - no carrier-dependent conditional forwarding",
          "Seamless customer experience - they never know the difference",
          "Works perfectly offshore when you have no service",
          "AI takes over only when you're truly unavailable",
        ],
        setupInstructions:
          "Dial *21* + [your Twilio number] + # to forward all calls. Our system handles the rest!",
      },
    },
    "T-Mobile": {
      code: "**21*",
      description: "T-Mobile Unconditional Call Forwarding",
      steps: [
        "Pick up your phone and listen for dial tone",
        "Dial **21*1 followed by the forwarding number",
        "Press # to activate",
        "Listen for confirmation",
        "Hang up",
      ],
      disableCode: "##21#",
      notes: [
        "Requires dialing full 11-digit number (with leading 1)",
        "Double asterisk format (**)",
        "##004# resets all forwarding settings to default",
        "✅ EXCELLENT: T-Mobile supports unreachable forwarding (**62*1)",
        "🌊 PERFECT for offshore fishing with no service",
      ],
      conditionalCodes: {
        busy: "**67*1",
        noAnswer: "**61*1",
        unreachable: "**62*1",
      },
      fishingCaptainGuidance: {
        recommended: "unconditional", // Always use unconditional forwarding
        explanation:
          "✅ RECOMMENDED: Use unconditional forwarding (**21*1) for reliable call handling. Our Twilio-First system will try to reach you first, then seamlessly transfer to AI if you're unavailable.",
        benefits: [
          "100% reliable - no carrier-dependent conditional forwarding",
          "Seamless customer experience - they never know the difference",
          "Works perfectly offshore when you have no service",
          "AI takes over only when you're truly unavailable",
        ],
        setupInstructions:
          "Dial **21*1 + [your Twilio number] + # to forward all calls. Our system handles the rest!",
      },
    },
    "US Cellular": {
      code: "*72",
      description: "US Cellular Unconditional Call Forwarding",
      steps: [
        "Pick up your phone and listen for dial tone",
        "Dial *72 followed by the forwarding number",
        "Wait for the phone to ring once and hang up",
        "Call forwarding is now active",
      ],
      disableCode: "*73",
      notes: [
        "Uses simple star codes, no #",
        "Forwarded calls count against plan minutes",
        "✅ GOOD: US Cellular supports unreachable forwarding (*92)",
        "🌊 GOOD for offshore fishing with no service",
      ],
      conditionalCodes: {
        busy: "*90",
        noAnswer: "*71",
        unreachable: "*92",
      },
      fishingCaptainGuidance: {
        recommended: "unconditional", // Always use unconditional forwarding
        explanation:
          "✅ RECOMMENDED: Use unconditional forwarding (*72) for reliable call handling. Our Twilio-First system will try to reach you first, then seamlessly transfer to AI if you're unavailable.",
        benefits: [
          "100% reliable - no carrier-dependent conditional forwarding",
          "Seamless customer experience - they never know the difference",
          "Works perfectly offshore when you have no service",
          "AI takes over only when you're truly unavailable",
        ],
        setupInstructions:
          "Dial *72 + [your Twilio number] to forward all calls. Our system handles the rest!",
      },
    },
    Sprint: {
      code: "*72",
      description: "Sprint Call Forwarding (Legacy - Now T-Mobile)",
      steps: [
        "Pick up your phone and listen for dial tone",
        "Press *72",
        "Enter the forwarding number",
        "Wait for the phone to ring once and hang up",
        "Call forwarding is now active",
      ],
      disableCode: "*73",
      notes: [
        "Sprint merged with T-Mobile",
        "May use T-Mobile codes on newer devices",
        "✅ EXCELLENT: Now uses T-Mobile's unreachable forwarding",
        "🌊 PERFECT for offshore fishing with no service",
      ],
      conditionalCodes: {
        busy: "**67*1", // T-Mobile codes
        noAnswer: "**61*1", // T-Mobile codes
        unreachable: "**62*1", // T-Mobile codes
      },
      fishingCaptainGuidance: {
        recommended: "unconditional", // Always use unconditional forwarding
        explanation:
          "✅ RECOMMENDED: Use unconditional forwarding (*72) for reliable call handling. Our Twilio-First system will try to reach you first, then seamlessly transfer to AI if you're unavailable.",
        benefits: [
          "100% reliable - no carrier-dependent conditional forwarding",
          "Seamless customer experience - they never know the difference",
          "Works perfectly offshore when you have no service",
          "AI takes over only when you're truly unavailable",
        ],
        setupInstructions:
          "Dial *72 + [your Twilio number] to forward all calls. Our system handles the rest!",
      },
    },
  };

  // Handle MVNOs by mapping to host network
  // Based on Conditional_Call_Forwarding_Codes_by_Carrier.md guidance
  const mvnoMapping = {
    // Major carriers with variations
    "T-Mobile USA, Inc.": "T-Mobile",
    "T-Mobile": "T-Mobile",
    "AT&T Mobility": "AT&T",
    "AT&T": "AT&T",
    "Verizon Wireless": "Verizon",
    Verizon: "Verizon",
    "US Cellular": "US Cellular",

    // AT&T MVNOs
    Cricket: "AT&T",
    "Consumer Cellular": "AT&T",
    "Red Pocket": "AT&T",
    "H2O Wireless": "AT&T",
    Airvoice: "AT&T",

    // T-Mobile MVNOs
    Metro: "T-Mobile",
    Mint: "T-Mobile",
    Boost: "T-Mobile",
    "Virgin Mobile": "T-Mobile",
    "Google Fi": "T-Mobile",
    "Republic Wireless": "T-Mobile",
    Ting: "T-Mobile",
    "Ultra Mobile": "T-Mobile",
    "Simple Mobile": "T-Mobile",

    // Verizon MVNOs
    Visible: "Verizon",
    "Straight Talk": "Verizon",
    TracFone: "Verizon",
    "Total Wireless": "Verizon",
    Net10: "Verizon",
    "Page Plus": "Verizon",

    // Note: Sprint merged with T-Mobile, so legacy Sprint numbers may use T-Mobile codes
    Sprint: "T-Mobile",
  };

  const hostCarrier = mvnoMapping[carrierName] || carrierName;
  return instructions[hostCarrier] || instructions["Verizon"]; // Default fallback
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { phoneNumber, manualCarrier } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format phone number for Twilio (E.164 format)
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
      // Remove any non-digit characters and add +1 for US numbers
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      if (cleanNumber.length === 10) {
        formattedNumber = `+1${cleanNumber}`;
      } else if (cleanNumber.length === 11 && cleanNumber.startsWith("1")) {
        formattedNumber = `+${cleanNumber}`;
      } else {
        return NextResponse.json(
          { error: "Invalid US phone number format" },
          { status: 400 }
        );
      }
    }

    // If manual carrier is provided, use it instead of Twilio lookup
    if (manualCarrier) {
      console.log(`🔧 Using manual carrier selection: ${manualCarrier}`);

      const carrierInfo = {
        name: manualCarrier,
        type: "mobile",
        country: "US",
      };

      // Get forwarding instructions for this carrier
      const forwardingInstructions = getForwardingInstructions(manualCarrier);

      return NextResponse.json({
        success: true,
        phoneNumber: formattedNumber,
        carrier: carrierInfo,
        callForwarding: {
          supported: true,
          ...forwardingInstructions,
        },
        message: `Using manually selected ${manualCarrier} carrier. Call forwarding supported.`,
        isMock: false,
      });
    }

    console.log(`🔍 Looking up carrier for: ${formattedNumber}`);

    try {
      // Lookup carrier information using Twilio
      const lookup = await client.lookups.v1
        .phoneNumbers(formattedNumber)
        .fetch({ type: ["carrier"] });

      console.log(`✅ Twilio lookup successful:`, {
        carrier: lookup.carrier.name,
        type: lookup.carrier.type,
        country: lookup.countryCode,
      });

      const carrierInfo = {
        name: lookup.carrier.name,
        type: lookup.carrier.type, // mobile, landline, voip
        country: lookup.countryCode,
        mobileCountryCode: lookup.carrier.mobileCountryCode,
        mobileNetworkCode: lookup.carrier.mobileNetworkCode,
      };

      // Get forwarding instructions for this carrier
      const forwardingInstructions = getForwardingInstructions(
        carrierInfo.name
      );

      return NextResponse.json({
        success: true,
        phoneNumber: formattedNumber,
        carrier: carrierInfo,
        callForwarding: {
          supported: carrierInfo.type === "mobile",
          ...forwardingInstructions,
        },
        message: `Detected ${carrierInfo.name} carrier. Call forwarding ${
          carrierInfo.type === "mobile" ? "supported" : "not supported"
        }.`,
        isMock: false,
      });
    } catch (twilioError) {
      console.error("❌ Twilio Lookup API error:", twilioError.message);

      // Return error with available carriers for manual selection
      return NextResponse.json(
        {
          success: false,
          error: "Failed to lookup carrier information",
          details: twilioError.message,
          availableCarriers: ["Verizon", "AT&T", "T-Mobile", "US Cellular"],
        },
        { status: 200 } // Return 200 so UI can handle the error gracefully
      );
    }
  } catch (error) {
    console.error("❌ General error in carrier lookup:", error);
    return NextResponse.json(
      { error: "Failed to lookup carrier information" },
      { status: 500 }
    );
  }
}
