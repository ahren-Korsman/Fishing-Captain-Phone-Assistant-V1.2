import twilio from "twilio";

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS notification to captain when a customer inquiry is received
 * @param {Object} captain - Captain document from database
 * @param {Object} customerData - Customer data collected by VAPI
 * @returns {Object} Result object with success status and details
 */
export async function sendCustomerNotificationSMS(captain, customerData) {
  try {
    // Validate inputs
    if (!captain) {
      throw new Error("Captain data is required");
    }

    if (!customerData) {
      throw new Error("Customer data is required");
    }

    // Check if captain has opted in for SMS notifications
    if (!captain.smsOptIn) {
      console.log(
        `📱 SMS notifications disabled for captain: ${captain.captainName}`
      );
      return {
        success: false,
        reason: "SMS opt-out",
        captainName: captain.captainName,
      };
    }

    // Validate captain has a phone number
    if (!captain.phoneNumber) {
      console.error(
        `❌ No phone number found for captain: ${captain.captainName}`
      );
      return {
        success: false,
        reason: "No captain phone number",
        captainName: captain.captainName,
      };
    }

    // Get the single SMS campaign number from environment
    const smsCampaignNumber = process.env.TWILIO_SMS_CAMPAIGN_NUMBER;
    if (!smsCampaignNumber) {
      console.error(
        `❌ No SMS campaign number configured in environment variables`
      );
      return {
        success: false,
        reason: "No SMS campaign number configured",
        captainName: captain.captainName,
      };
    }

    // Format customer name (fallback to "Customer" if not provided)
    const customerName = customerData.customerName || "Customer";

    // Format phone number (remove any formatting)
    const customerPhone = customerData.phoneNumber || "Unknown";

    // Format trip type
    const tripType = customerData.tripType || "Not specified";

    // Format party size
    const partySize = customerData.partySize || "Not specified";

    // Format budget
    const budget = customerData.budget || "Not specified";

    // Check if callback is requested
    const callbackRequested = customerData.callbackRequested
      ? "📞 Callback requested"
      : "";

    // Format urgency level
    const urgency = customerData.urgency
      ? `\nUrgency: ${customerData.urgency}`
      : "";

    // Format preferred dates
    const preferredDates =
      customerData.preferredDates && customerData.preferredDates.length > 0
        ? `\nPreferred dates: ${customerData.preferredDates.join(", ")}`
        : "";

    // Create the SMS message
    const message = `🎣 New fishing inquiry from ${customerName} (${customerPhone})

Trip: ${tripType}
Party Size: ${partySize}
Budget: ${budget}${urgency}${preferredDates}
${callbackRequested}

Check your dashboard for full details and call transcript.`;

    console.log(
      `📱 Preparing to send SMS to captain ${captain.captainName} at ${captain.phoneNumber}`
    );

    // Send SMS using Twilio
    const smsConfig = {
      body: message,
      from: smsCampaignNumber, // Use the single SMS campaign number as sender
      to: captain.phoneNumber, // Send to captain's personal phone
    };

    // Add messaging service if configured (for A2P 10DLC compliance)
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (messagingServiceSid) {
      smsConfig.messagingServiceSid = messagingServiceSid;
      console.log(
        `📱 Using messaging service for compliance: ${messagingServiceSid}`
      );
    } else {
      console.log(`📱 No messaging service configured - using direct number`);
    }

    const messageResponse = await client.messages.create(smsConfig);

    console.log(`✅ SMS sent successfully to captain ${captain.captainName}:`, {
      messageSid: messageResponse.sid,
      status: messageResponse.status,
      to: messageResponse.to,
      from: messageResponse.from,
    });

    return {
      success: true,
      messageSid: messageResponse.sid,
      status: messageResponse.status,
      captainName: captain.captainName,
      customerName: customerName,
    };
  } catch (error) {
    console.error("❌ Failed to send SMS notification:", {
      error: error.message,
      captainName: captain?.captainName,
      captainPhone: captain?.phoneNumber,
      twilioNumber: captain?.twilioNumber?.phoneNumber,
    });

    return {
      success: false,
      error: error.message,
      captainName: captain?.captainName,
    };
  }
}

/**
 * Send a test SMS to verify Twilio configuration
 * @param {string} captainPhone - Captain's phone number
 * @returns {Object} Result object with success status
 */
export async function sendTestSMS(captainPhone) {
  try {
    // Get the single SMS campaign number from environment
    const smsCampaignNumber = process.env.TWILIO_SMS_CAMPAIGN_NUMBER;
    if (!smsCampaignNumber) {
      console.error(
        `❌ No SMS campaign number configured in environment variables`
      );
      return {
        success: false,
        error: "No SMS campaign number configured",
      };
    }

    const testMessage = `🎣 Test SMS from Fishing Captain AI Assistant

This is a test message to verify SMS notifications are working correctly.

If you received this message, SMS notifications are properly configured!`;

    const smsConfig = {
      body: testMessage,
      from: smsCampaignNumber, // Use the single SMS campaign number
      to: captainPhone,
    };

    // Add messaging service if configured (for A2P 10DLC compliance)
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (messagingServiceSid) {
      smsConfig.messagingServiceSid = messagingServiceSid;
      console.log(
        `📱 Test SMS using messaging service for compliance: ${messagingServiceSid}`
      );
    } else {
      console.log(
        `📱 Test SMS using direct number (no messaging service configured)`
      );
    }

    const messageResponse = await client.messages.create(smsConfig);

    console.log(`✅ Test SMS sent successfully:`, messageResponse.sid);

    return {
      success: true,
      messageSid: messageResponse.sid,
      status: messageResponse.status,
    };
  } catch (error) {
    console.error("❌ Failed to send test SMS:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
}
