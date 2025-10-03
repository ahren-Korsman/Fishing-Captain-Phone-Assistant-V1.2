#!/usr/bin/env node

import { updateAssistant, getAssistant } from "./lib/vapi.js";
import { getWebhookUrl } from "./lib/utils/urls.js";

async function updateAssistantWebhook(assistantId) {
  try {
    console.log(`🔍 Getting assistant ${assistantId}...`);

    // Get current assistant configuration
    const currentAssistant = await getAssistant(assistantId);
    console.log("📋 Current assistant:", currentAssistant.name);

    // Update with server configuration
    const updates = {
      server: {
        url: getWebhookUrl(),
        secret: process.env.VAPI_WEBHOOK_SECRET,
      },
    };

    console.log("🔧 Updating assistant with webhook configuration...");
    console.log("📡 Webhook URL:", updates.server.url);
    console.log(
      "🔐 Webhook secret configured:",
      !!process.env.VAPI_WEBHOOK_SECRET
    );

    const updatedAssistant = await updateAssistant(assistantId, updates);

    console.log("✅ Assistant updated successfully!");
    console.log("📋 Updated assistant:", updatedAssistant.name);
    console.log("🔗 Server URL:", updatedAssistant.server?.url);
    console.log(
      "🔐 Server secret configured:",
      !!updatedAssistant.server?.secret
    );

    return updatedAssistant;
  } catch (error) {
    console.error("❌ Error updating assistant:", error.message);
    throw error;
  }
}

// Get assistant ID from command line argument
const assistantId = process.argv[2];

if (!assistantId) {
  console.error("❌ Please provide an assistant ID");
  console.log("Usage: node update-assistant-webhook.js <assistant-id>");
  process.exit(1);
}

// Run the update
updateAssistantWebhook(assistantId)
  .then(() => {
    console.log("🎉 Update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Update failed:", error.message);
    process.exit(1);
  });
