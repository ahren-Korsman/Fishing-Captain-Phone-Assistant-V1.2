import {
  importTwilioNumberToVapi,
  assignAssistantToPhoneNumber,
  createFishingCaptainAssistant,
} from "./lib/vapi.js";

async function testRealVapiImport() {
  try {
    console.log(
      "🚀 Testing REAL VAPI import with your existing Twilio number: +1 (239) 932 5528"
    );

    // Your real Twilio credentials
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error("❌ Twilio credentials not found in environment");
      return;
    }

    console.log("✅ Twilio credentials found");
    console.log("📞 Account SID:", twilioAccountSid);
    console.log("🔑 Auth Token:", twilioAuthToken ? "***SET***" : "MISSING");

    // Your real Twilio number
    const testPhoneNumber = "+12399325528"; // Your real Twilio number

    console.log("\n🤖 Step 1: Creating a test VAPI assistant...");

    // Create a test assistant first
    const assistantConfig = {
      name: "Test Fishing Captain Assistant",
      captainName: "Test Captain",
      businessName: "Test Boats",
      phoneNumber: testPhoneNumber,
      localFishingInfo: "Test fishing location with various trip types",
      customInstructions: "This is a test assistant for VAPI import testing",
    };

    const assistant = await createFishingCaptainAssistant(assistantConfig);
    console.log("✅ VAPI assistant created:", assistant.id);

    console.log("\n📞 Step 2: Importing your real Twilio number to VAPI...");
    console.log("Phone Number:", testPhoneNumber);
    console.log("Assistant ID:", assistant.id);

    // Import the number
    const vapiPhoneNumber = await importTwilioNumberToVapi(
      testPhoneNumber,
      assistant.id,
      twilioAccountSid,
      twilioAuthToken
    );

    console.log("✅ VAPI import successful!");
    console.log("VAPI Phone Number ID:", vapiPhoneNumber.id);
    console.log("VAPI Phone Number:", vapiPhoneNumber);

    console.log("\n🔗 Step 3: Assigning assistant to phone number...");

    // Assign assistant to the imported number
    const assignmentResult = await assignAssistantToPhoneNumber(
      vapiPhoneNumber.id,
      assistant.id
    );

    console.log("✅ Assistant assignment successful!");
    console.log("Assignment Result:", assignmentResult);

    console.log("\n🎉 SUCCESS! Real VAPI import and assignment completed!");
  } catch (error) {
    console.error("❌ Error during VAPI import test:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }
}

// Run the test
testRealVapiImport();
