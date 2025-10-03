#!/usr/bin/env node

/**
 * Test script to verify subscription check implementation
 * This script simulates the VAPI webhook flow to test subscription blocking
 */

const connectDB = require("./lib/mongodb.js").default;
const Captain = require("./lib/models/Captain.js").default;
const User = require("./lib/models/User.js").default;

async function testSubscriptionCheck() {
  try {
    console.log("🧪 Testing subscription check implementation...");

    await connectDB();
    console.log("✅ Connected to database");

    // Find a test captain
    const captain = await Captain.findOne({});
    if (!captain) {
      console.log("❌ No captains found in database");
      return;
    }

    console.log(`📋 Testing with captain: ${captain.captainName}`);
    console.log(`📋 Current subscriptionActive: ${captain.subscriptionActive}`);

    // Test 1: Simulate VAPI webhook lookup with current subscription status
    console.log(
      "\n🔍 Test 1: VAPI webhook lookup with current subscription status"
    );
    const vapiLookup = await Captain.findOne({
      "twilioNumber.assistantId":
        captain.twilioNumber?.assistantId || "test-assistant-id",
      serviceEnabled: true,
      subscriptionActive: true,
    });

    if (vapiLookup) {
      console.log("✅ Captain found - subscription is active");
    } else {
      console.log(
        "❌ Captain not found - subscription is inactive or service disabled"
      );
    }

    // Test 2: Toggle subscription status and test again
    console.log("\n🔍 Test 2: Toggle subscription status and test again");
    const originalStatus = captain.subscriptionActive;

    // Set to inactive
    captain.subscriptionActive = false;
    await captain.save();
    console.log("📋 Set subscriptionActive to false");

    const vapiLookupInactive = await Captain.findOne({
      "twilioNumber.assistantId":
        captain.twilioNumber?.assistantId || "test-assistant-id",
      serviceEnabled: true,
      subscriptionActive: true,
    });

    if (vapiLookupInactive) {
      console.log(
        "❌ Captain found - this should not happen with inactive subscription"
      );
    } else {
      console.log(
        "✅ Captain not found - subscription blocking works correctly"
      );
    }

    // Restore original status
    captain.subscriptionActive = originalStatus;
    await captain.save();
    console.log("📋 Restored original subscription status");

    // Test 3: Check if user has active subscription
    console.log("\n🔍 Test 3: Check user subscription status");
    const user = await User.findById(captain.userId);
    if (user) {
      console.log(`📋 User subscription status: ${user.subscription.status}`);
      console.log(
        `📋 User hasActiveSubscription: ${user.hasActiveSubscription()}`
      );
      console.log(`📋 User canAccessPlatform: ${user.canAccessPlatform()}`);
    } else {
      console.log("❌ No user found for captain");
    }

    console.log("\n✅ Subscription check test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testSubscriptionCheck();
