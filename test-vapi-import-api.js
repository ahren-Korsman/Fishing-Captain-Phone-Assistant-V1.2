import fetch from "node-fetch";

async function testVapiImportViaAPI() {
  try {
    console.log(
      "🚀 Testing VAPI import via API with your real Twilio number: +1 (239) 932 5528"
    );

    // Your real Twilio number
    const testPhoneNumber = "+12399325528";

    console.log("\n🤖 Step 1: Creating a test VAPI assistant...");

    // Create a test assistant first
    const assistantResponse = await fetch(
      "http://localhost:3000/api/vapi/assistant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captainName: "Test Captain",
          businessName: "Test Boats",
          phoneNumber: testPhoneNumber,
          email: "test@example.com",
          location: "Test Location",
          seasonalInfo: "Test seasonal info",
          tripTypes: ["offshore", "inshore"],
          boatInfo: "Test boat info",
          pricingInfo: "Test pricing",
          customInstructions:
            "This is a test assistant for VAPI import testing",
          smsOptIn: true,
        }),
      }
    );

    if (!assistantResponse.ok) {
      const errorData = await assistantResponse.json();
      console.error("❌ Failed to create assistant:", errorData);
      return;
    }

    const assistantData = await assistantResponse.json();
    console.log("✅ VAPI assistant created:", assistantData.vapiAssistant.id);

    console.log("\n📞 Step 2: Importing your real Twilio number to VAPI...");
    console.log("Phone Number:", testPhoneNumber);
    console.log("Assistant ID:", assistantData.vapiAssistant.id);

    // Import the number to VAPI
    const importResponse = await fetch(
      "http://localhost:3000/api/vapi/phone-number",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twilioNumber: testPhoneNumber,
          captainId: "test-captain-id", // We'll use a test ID
          assistantId: assistantData.vapiAssistant.id,
        }),
      }
    );

    if (!importResponse.ok) {
      const errorData = await importResponse.json();
      console.error("❌ Failed to import number to VAPI:", errorData);
      return;
    }

    const importData = await importResponse.json();
    console.log("✅ VAPI import successful!");
    console.log("VAPI Phone Number ID:", importData.vapiPhoneNumberId);
    console.log("VAPI Phone Number:", importData.vapiPhoneNumber);

    console.log("\n🎉 SUCCESS! Real VAPI import completed!");
    console.log(
      "Your Twilio number +1 (239) 932 5528 is now imported into VAPI!"
    );
  } catch (error) {
    console.error("❌ Error during VAPI import test:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }
}

// Run the test
testVapiImportViaAPI();
