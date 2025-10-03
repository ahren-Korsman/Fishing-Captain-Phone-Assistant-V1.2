#!/usr/bin/env node

/**
 * Test script for Twilio Carrier Detection
 * Run with: node scripts/test-twilio-carrier.js
 */

import twilio from "twilio";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testCarrierLookup(phoneNumber) {
  console.log(`\n🔍 Testing carrier lookup for: ${phoneNumber}`);

  try {
    const lookup = await client.lookups.v1
      .phoneNumbers(phoneNumber)
      .fetch({ type: ["carrier"] });

    console.log("✅ Twilio Lookup Successful!");
    console.log("📊 Results:");
    console.log(`   Carrier: ${lookup.carrier.name || "Unknown"}`);
    console.log(`   Type: ${lookup.carrier.type || "Unknown"}`);
    console.log(`   Country: ${lookup.countryCode}`);
    console.log(
      `   Mobile Country Code: ${lookup.carrier.mobileCountryCode || "N/A"}`
    );
    console.log(
      `   Mobile Network Code: ${lookup.carrier.mobileNetworkCode || "N/A"}`
    );

    return {
      success: true,
      carrier: lookup.carrier.name,
      type: lookup.carrier.type,
      country: lookup.countryCode,
    };
  } catch (error) {
    console.error("❌ Twilio Lookup Failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testAPIEndpoint(phoneNumber) {
  console.log(`\n🌐 Testing API endpoint for: ${phoneNumber}`);

  try {
    const response = await fetch(
      "http://localhost:3000/api/twilio/carrier-lookup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log("✅ API Endpoint Working!");
      console.log("📊 Results:");
      console.log(`   Carrier: ${data.carrier.name || "Unknown"}`);
      console.log(`   Type: ${data.carrier.type || "Unknown"}`);
      console.log(`   Country: ${data.carrier.country}`);
      console.log(
        `   Call Forwarding Supported: ${data.callForwarding.supported}`
      );
      console.log(`   Forwarding Code: ${data.callForwarding.code || "N/A"}`);
      console.log(`   Is Mock: ${data.isMock ? "Yes" : "No"}`);
    } else {
      console.error("❌ API Endpoint Failed:", data.error);
    }

    return data;
  } catch (error) {
    console.error("❌ API Endpoint Error:", error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("🚀 Twilio Carrier Detection Test");
  console.log("================================");

  // Check if credentials are available
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.error("❌ Missing Twilio credentials in .env.local");
    console.log("Please add:");
    console.log("TWILIO_ACCOUNT_SID=your_account_sid");
    console.log("TWILIO_AUTH_TOKEN=your_auth_token");
    process.exit(1);
  }

  console.log("✅ Twilio credentials found");

  // Test phone numbers
  const testNumbers = [
    "+15551234567", // Test number
    "+12125551234", // Another test number
    "+14155552671", // Twilio's test number
  ];

  for (const phoneNumber of testNumbers) {
    await testCarrierLookup(phoneNumber);
    await testAPIEndpoint(phoneNumber);
  }

  console.log("\n🎉 Test completed!");
  console.log("\nNext steps:");
  console.log("1. Visit http://localhost:3000/onboarding");
  console.log("2. Enter a phone number and test carrier detection");
  console.log("3. Check the browser console for any errors");
}

main().catch(console.error);
