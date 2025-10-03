import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Call from "@/lib/models/Call";
import Customer from "@/lib/models/Customer";
import Captain from "@/lib/models/Captain";
import { sendCustomerNotificationSMS } from "@/lib/utils/sms";

// Verify webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  // In development mode, allow requests without signature verification
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Development mode: Skipping signature verification");
    return true;
  }

  if (!secret) {
    console.warn(
      "⚠️  No webhook secret configured - skipping signature verification"
    );
    console.warn("🔧 To enable webhook verification:");
    console.warn("   1. Generate a secret: ./generate-webhook-secret.sh");
    console.warn("   2. Add VAPI_WEBHOOK_SECRET to your .env.local file");
    console.warn(
      "   3. Use the SAME secret in your VAPI dashboard webhook settings"
    );
    return true; // Allow in development
  }

  // Check if signature exists
  if (!signature) {
    console.warn("⚠️  No signature provided in webhook request");
    return false;
  }

  // VAPI sends the webhook secret directly in the x-vapi-secret header
  // This is different from HMAC signature verification used by other services
  console.log("🔍 Verifying VAPI webhook secret...");
  console.log("  - Received signature:", signature);
  console.log("  - Expected secret:", secret ? "configured" : "missing");

  // Simple string comparison for VAPI webhook authentication
  const isValid = signature === secret;

  if (!isValid) {
    console.error("❌ Webhook secret mismatch");
    console.error("  - Received:", signature);
    console.error("  - Expected:", secret);
  } else {
    console.log("✅ Webhook secret verified successfully");
  }

  return isValid;
}

export async function POST(request) {
  const startTime = Date.now();
  console.log("🚀 VAPI WEBHOOK RECEIVED - Starting processing...");
  console.log("📊 Environment:", process.env.NODE_ENV);
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully");

    const body = await request.text();
    const signature =
      request.headers.get("x-vapi-signature") ||
      request.headers.get("x-vapi-secret");
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

    console.log("🔍 WEBHOOK DEBUG INFO:");
    console.log("  - Body length:", body.length);
    console.log("  - Body preview:", body.substring(0, 200) + "...");
    console.log("  - Signature:", signature ? "present" : "missing");
    console.log("  - Secret configured:", webhookSecret ? "YES" : "NO");
    console.log("  - Request URL:", request.url);
    console.log("  - Request method:", request.method);
    console.log("  - Headers:", Object.fromEntries(request.headers.entries()));

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("❌ INVALID WEBHOOK SIGNATURE");
      console.error("  - Signature:", signature);
      console.error("  - Body preview:", body.substring(0, 100) + "...");
      console.error("  - Secret configured:", webhookSecret ? "YES" : "NO");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("✅ Webhook signature verified successfully");

    const event = JSON.parse(body);
    console.log("📦 PARSED EVENT DATA:");
    console.log(JSON.stringify(event, null, 2));

    // Handle different event types
    if (event.type) {
      console.log(`🎯 Processing event type: ${event.type}`);
      switch (event.type) {
        case "assistant-created":
          console.log("🤖 Assistant created event");
          await handleAssistantCreated(event);
          break;

        case "call-started":
          console.log("📞 Call started event");
          await handleCallStarted(event);
          break;

        case "call-ended":
          console.log("📞 Call ended event");
          await handleCallEnded(event);
          break;

        case "function-call":
          console.log("🔧 Function call event");
          await handleFunctionCall(event);
          break;

        case "transcript":
          console.log("📝 Transcript event");
          await handleTranscript(event);
          break;

        case "speech-update":
          console.log("🎤 Speech update event");
          await handleSpeechUpdate(event);
          break;

        case "message":
          console.log("💬 Message event");
          if (event.message?.type === "tool-calls") {
            console.log("🔧 Tool calls message detected");
            await handleToolCalls(event);
          } else {
            console.log(`📝 Message type: ${event.message?.type}`);
          }
          break;

        default:
          console.log(`❓ UNHANDLED EVENT TYPE: ${event.type}`);
          if (event.message) {
            console.log(`📝 Message type: ${event.message.type}`);
          }
      }
    } else if (event.message?.type === "status-update") {
      console.log("📊 Processing status-update message");
      console.log(
        "🔍 DEBUG [1]: Webhook received status-update event, routing to handler"
      );
      await handleStatusUpdate(event);
    } else if (event.message?.type === "tool-calls") {
      console.log("🔧 Processing tool-calls message directly (no event.type)");
      await handleToolCalls(event);
    } else {
      console.log("❓ NO EVENT TYPE FOUND - Checking message type");
      if (event.message) {
        console.log(`📝 Message type: ${event.message.type}`);
        if (event.message.type === "tool-calls") {
          console.log("🔧 Processing tool-calls from message");
          await handleToolCalls(event);
        }
      } else {
        console.log("❌ No message found in event");
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ WEBHOOK PROCESSING COMPLETED in ${processingTime}ms`);

    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed successfully",
        processingTime: processingTime,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("❌ WEBHOOK PROCESSING ERROR:");
    console.error("  - Error:", error.message);
    console.error("  - Stack:", error.stack);
    console.error("  - Processing time:", processingTime + "ms");
    console.error("  - Timestamp:", new Date().toISOString());

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
        details: error.message,
        processingTime: processingTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Event handlers
async function handleAssistantCreated(event) {
  console.log("Assistant created:", event.assistant);
  // Store assistant info in database if needed
}

async function handleCallStarted(event) {
  console.log("Call started:", event.call);

  try {
    // Find the captain associated with this assistant
    const captain = await Captain.findOne({
      "twilioNumber.assistantId": event.call.assistantId,
      serviceEnabled: true,
      subscriptionActive: true,
    });

    if (!captain) {
      console.error("No captain found for call:", event.call.id);
      console.error(
        "This could be due to inactive subscription or service disabled"
      );
      return;
    }

    // Create call record
    const callData = {
      callId: event.call.id,
      captainId: captain._id,
      assistantId: event.call.assistantId,
      customerPhone: event.call.customer?.number || "Unknown",
      status: "in-progress",
      startedAt: new Date(event.call.startedAt || Date.now()),
      metadata: {
        callerId: event.call.customer?.number,
        language: event.call.language || "en",
      },
    };

    const call = new Call(callData);
    await call.save();

    console.log("✅ Call record created:", call._id);
  } catch (error) {
    console.error("Error saving call start:", error);
  }
}

async function handleCallEnded(event) {
  console.log("Call ended:", event.call);

  try {
    // Find the captain associated with this assistant
    const captain = await Captain.findOne({
      "twilioNumber.assistantId": event.call.assistantId,
      serviceEnabled: true,
      subscriptionActive: true,
    });

    if (!captain) {
      console.error("No captain found for call:", event.call.id);
      console.error(
        "This could be due to inactive subscription or service disabled"
      );
      return;
    }

    // Update call record
    const call = await Call.findOne({
      callId: event.call.id,
      captainId: captain._id,
    });

    if (call) {
      const endedAt = new Date(event.call.endedAt || Date.now());
      const duration = Math.floor((endedAt - call.startedAt) / 1000);

      call.status = "completed";
      call.endedAt = endedAt;
      call.duration = duration;
      call.cost = event.call.cost || 0;
      call.metadata.recordingUrl = event.call.recordingUrl;
      call.metadata.qualityScore = event.call.qualityScore;

      await call.save();
      console.log("✅ Call record updated:", call._id);
    }
  } catch (error) {
    console.error("Error updating call end:", error);
  }
}

async function handleFunctionCall(event) {
  console.log("Function call:", event.functionCall);

  try {
    // Find the captain associated with this assistant
    const captain = await Captain.findOne({
      "twilioNumber.assistantId": event.call.assistantId,
      serviceEnabled: true,
      subscriptionActive: true,
    });

    if (!captain) {
      console.error("No captain found for function call:", event.call.id);
      return;
    }

    // This is where we get the structured customer data
    if (event.functionCall.name?.toLowerCase() === "collect_customer_info") {
      const customerData = event.functionCall.parameters;
      console.log("Customer data collected:", customerData);

      // Update call record with customer data
      const call = await Call.findOne({
        callId: event.call.id,
        captainId: captain._id,
      });

      if (call) {
        call.customerData = customerData;
        await call.save();
        console.log("✅ Call updated with customer data:", call._id);
      }

      // Create or update customer record
      const existingCustomer = await Customer.findOne({
        captainId: captain._id,
        phoneNumber: customerData.phoneNumber,
      });

      if (existingCustomer) {
        // Update existing customer
        existingCustomer.totalCalls += 1;
        existingCustomer.lastCallDate = new Date();
        existingCustomer.customerName =
          customerData.customerName || existingCustomer.customerName;
        existingCustomer.email = customerData.email || existingCustomer.email;
        existingCustomer.preferredDates =
          customerData.preferredDates || existingCustomer.preferredDates;
        existingCustomer.partySize =
          customerData.partySize || existingCustomer.partySize;
        existingCustomer.tripType =
          customerData.tripType || existingCustomer.tripType;
        existingCustomer.experience =
          customerData.experience || existingCustomer.experience;
        existingCustomer.specialRequests =
          customerData.specialRequests || existingCustomer.specialRequests;
        existingCustomer.budget =
          customerData.budget || existingCustomer.budget;
        existingCustomer.callbackRequested =
          customerData.callbackRequested || existingCustomer.callbackRequested;
        existingCustomer.urgency =
          customerData.urgency || existingCustomer.urgency;

        await existingCustomer.save();
        console.log("✅ Customer record updated:", existingCustomer._id);
      } else {
        // Create new customer
        const customerInfo = {
          captainId: captain._id,
          customerName: customerData.customerName,
          phoneNumber: customerData.phoneNumber,
          email: customerData.email,
          preferredDates: customerData.preferredDates,
          partySize: customerData.partySize,
          tripType: customerData.tripType,
          experience: customerData.experience,
          specialRequests: customerData.specialRequests,
          budget: customerData.budget,
          callbackRequested: customerData.callbackRequested,
          urgency: customerData.urgency,
          totalCalls: 1,
          lastCallDate: new Date(),
          status: "new",
        };

        const customer = new Customer(customerInfo);
        await customer.save();
        console.log("✅ New customer record created:", customer._id);
      }

      // Send SMS notification to captain (only if not already sent)
      try {
        // Check if SMS was already sent for this call
        const callRecord = await Call.findOne({
          callId: event.call.id,
          captainId: captain._id,
        });

        if (callRecord && callRecord.smsSent) {
          console.log("📱 SMS already sent for this call, skipping...");
          return;
        }

        console.log(
          "📱 Attempting to send SMS notification from function call..."
        );
        const smsResult = await sendCustomerNotificationSMS(
          captain,
          customerData
        );

        if (smsResult.success) {
          console.log(
            `✅ SMS notification sent successfully to ${captain.captainName}:`,
            {
              messageSid: smsResult.messageSid,
              customerName: smsResult.customerName,
            }
          );

          // Mark SMS as sent in call record
          if (callRecord) {
            callRecord.smsSent = true;
            await callRecord.save();
          }
        } else {
          console.log(
            `📱 SMS notification skipped for ${captain.captainName}: ${
              smsResult.reason || smsResult.error
            }`
          );
        }
      } catch (smsError) {
        console.error("❌ SMS notification error:", smsError);
        // Don't fail the webhook if SMS fails - this is non-critical
      }
    }
  } catch (error) {
    console.error("Error handling function call:", error);
  }
}

async function handleTranscript(event) {
  console.log("Transcript update:", event.transcript);

  try {
    // Find the captain associated with this assistant
    const captain = await Captain.findOne({
      "twilioNumber.assistantId": event.call.assistantId,
      serviceEnabled: true,
      subscriptionActive: true,
    });

    if (!captain) {
      console.error("No captain found for transcript:", event.call.id);
      return;
    }

    // Update call record with transcript
    const call = await Call.findOne({
      callId: event.call.id,
      captainId: captain._id,
    });

    if (call) {
      call.transcript = event.transcript.text || call.transcript;
      await call.save();
      console.log("✅ Call transcript updated:", call._id);
    }
  } catch (error) {
    console.error("Error updating transcript:", error);
  }
}

async function handleSpeechUpdate(event) {
  console.log("Speech update:", event.speechUpdate);
  // Handle real-time speech updates if needed
}

async function handleStatusUpdate(event) {
  console.log("📊 Status update:", event.message);

  try {
    // Check if this is a call ended status update
    if (event.message?.status === "ended") {
      console.log("📞 Call ended via status-update");

      // Extract call information from the message
      const callId = event.message?.call?.id || event.call?.id;
      const assistantId =
        event.message?.call?.assistantId || event.call?.assistantId;

      console.log("🔍 Extracted IDs:", { callId, assistantId });
      console.log(
        "🔍 DEBUG [2]: Raw call data in message:",
        JSON.stringify({
          messageCallId: event.message?.call?.id,
          messageAssistantId: event.message?.call?.assistantId,
          directCallId: event.call?.id,
          directAssistantId: event.call?.assistantId,
        })
      );

      if (!callId || !assistantId) {
        console.error("❌ Missing call ID or assistant ID in status update");
        return;
      }

      // Find the captain associated with this assistant
      console.log(
        "🔍 DEBUG [3]: Looking for captain with assistantId:",
        assistantId
      );
      const captain = await Captain.findOne({
        "twilioNumber.assistantId": assistantId,
        serviceEnabled: true,
        subscriptionActive: true,
      });

      // Log the query result
      console.log(
        "🔍 DEBUG [4]: Captain query result:",
        captain
          ? `Found: ${captain.captainName} (ID: ${captain._id})`
          : "No captain found"
      );

      // If no captain found with active subscription, try without subscription check
      if (!captain) {
        console.log(
          "🔍 DEBUG [5]: Trying captain lookup without subscription check"
        );
        const inactiveCaptain = await Captain.findOne({
          "twilioNumber.assistantId": assistantId,
        });

        if (inactiveCaptain) {
          console.log("🔍 DEBUG [6]: Found captain but inactive:", {
            name: inactiveCaptain.captainName,
            serviceEnabled: inactiveCaptain.serviceEnabled,
            subscriptionActive: inactiveCaptain.subscriptionActive,
          });
        }

        console.error("❌ No captain found for assistant ID:", assistantId);
        return;
      }

      console.log(`✅ Found captain: ${captain.captainName} for status update`);

      // Update call record
      console.log("🔍 DEBUG [7]: Looking for call record with ID:", callId);
      const call = await Call.findOne({
        callId: callId,
        captainId: captain._id,
      });

      console.log(
        "🔍 DEBUG [8]: Call lookup result:",
        call
          ? `Found call (ID: ${call._id}, status: ${call.status})`
          : "No existing call record found"
      );

      if (call) {
        const endedAt = new Date();
        const duration = Math.floor((endedAt - call.startedAt) / 1000);

        call.status = "completed";
        call.endedAt = endedAt;
        call.duration = duration;
        call.metadata = call.metadata || {};
        call.metadata.endedReason = event.message.endedReason;

        await call.save();
        console.log("✅ Call record updated via status-update:", call._id);
      } else {
        console.log("❌ Call not found for status update, call ID:", callId);
      }

      // Process any tool calls or customer data from the artifact
      if (event.message.artifact?.messages) {
        console.log("🔧 Processing artifact messages from status update");
        console.log(
          "🔍 DEBUG [9]: Artifact contains",
          event.message.artifact.messages.length,
          "messages"
        );

        // Look for tool calls in the artifact messages
        const messages = event.message.artifact.messages;
        let toolCallsFound = 0;

        for (const message of messages) {
          if (message.toolCalls && Array.isArray(message.toolCalls)) {
            toolCallsFound++;
            console.log("🔧 Found tool calls in artifact, processing...");
            console.log(
              "🔍 DEBUG [10]: Tool call found in message:",
              message.toolCalls
                .map((tc) => tc.function?.name || "unnamed")
                .join(", ")
            );

            // Create a synthetic event for tool call processing
            const toolCallEvent = {
              call: { id: callId, assistantId: assistantId },
              message: {
                type: "tool-calls",
                toolCalls: message.toolCalls,
                artifact: event.message.artifact,
              },
            };

            await handleToolCalls(toolCallEvent);
          }
        }

        console.log(
          "🔍 DEBUG [11]: Finished processing artifact, tool calls found:",
          toolCallsFound || "none"
        );
      }
    }
  } catch (error) {
    console.error("❌ Error handling status update:", error);
  }
}

async function handleToolCalls(event) {
  console.log("🔧 TOOL CALLS EVENT RECEIVED:");
  console.log("📦 Event data:", JSON.stringify(event, null, 2));

  try {
    // Validate required data
    console.log(
      "🔍 DEBUG [12]: handleToolCalls received event with call ID:",
      event.call?.id || "undefined"
    );

    if (!event.call?.assistantId) {
      console.error(
        "❌ No assistant ID found in tool calls event:",
        event.call?.id
      );
      console.log(
        "🔍 DEBUG [13]: Full event data (missing assistantId):",
        JSON.stringify(event, null, 2)
      );
      return;
    }

    // Find the captain associated with this assistant
    console.log(
      "🔍 Looking for captain with assistant ID:",
      event.call.assistantId
    );
    const captain = await Captain.findOne({
      "twilioNumber.assistantId": event.call.assistantId,
      serviceEnabled: true,
      subscriptionActive: true,
    });

    if (!captain) {
      console.error(
        "❌ No captain found for assistant ID:",
        event.call.assistantId
      );
      console.error(
        "This could be due to inactive subscription or service disabled"
      );
      return;
    }

    console.log(
      `✅ Found captain: ${captain.captainName} for assistant: ${event.call.assistantId}`
    );

    // Extract transcript from artifact messages
    let transcript = "";
    if (
      event.message.artifact &&
      event.message.artifact.messagesOpenAIFormatted
    ) {
      const messages = event.message.artifact.messagesOpenAIFormatted;
      transcript = messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map(
          (msg) =>
            `${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n");
      console.log(
        "📝 Extracted transcript:",
        transcript.substring(0, 100) + "..."
      );
    }

    // Process each tool call
    if (event.message.toolCalls && Array.isArray(event.message.toolCalls)) {
      console.log(`🔧 Processing ${event.message.toolCalls.length} tool calls`);

      for (const toolCall of event.message.toolCalls) {
        console.log(
          "🔧 Processing tool call:",
          JSON.stringify(toolCall, null, 2)
        );

        // Handle collect_customer_info tool calls
        if (
          toolCall.function?.name?.toLowerCase() === "collect_customer_info"
        ) {
          console.log("📊 COLLECT_CUSTOMER_INFO TOOL CALL DETECTED");

          // Extract customer data from the tool call arguments
          console.log("🔍 DEBUG [14]: Extracting customer data from tool call");
          let rawCustomerData =
            toolCall.function.arguments || toolCall.function.parameters;

          console.log(
            "🔍 DEBUG [15]: Raw customer data type:",
            typeof rawCustomerData,
            typeof rawCustomerData === "string"
              ? `(length: ${rawCustomerData.length})`
              : ""
          );

          // Parse if it's a JSON string
          try {
            const customerData =
              typeof rawCustomerData === "string"
                ? JSON.parse(rawCustomerData)
                : rawCustomerData;

            console.log(
              "📊 Customer data collected:",
              JSON.stringify(customerData, null, 2)
            );
          } catch (parseError) {
            console.error(
              "❌ ERROR parsing customer data:",
              parseError.message
            );
            console.log(
              "🔍 DEBUG [16]: Raw customer data that failed parsing:",
              rawCustomerData
            );
            return;
          }

          // Update call record with customer data
          console.log("🔍 Looking for call with ID:", event.call?.id);
          const call = await Call.findOne({
            callId: event.call?.id,
            captainId: captain._id,
          });

          if (call) {
            call.customerData = customerData;
            if (transcript) {
              call.transcript = transcript;
            }
            await call.save();
            console.log(
              "✅ Call updated with customer data and transcript:",
              call._id
            );
          } else {
            console.log("❌ Call not found, creating new call record");
            // Create a new call record if one doesn't exist
            const newCall = new Call({
              callId: event.call?.id || `unknown-${Date.now()}`,
              captainId: captain._id,
              assistantId: event.assistant?.id || "unknown",
              customerPhone: customerData.phoneNumber || "unknown",
              status: "completed",
              startedAt: new Date(),
              endedAt: new Date(),
              duration: 0,
              customerData: customerData,
              transcript: transcript,
            });
            await newCall.save();
            console.log(
              "✅ New call record created with transcript:",
              newCall._id
            );
          }

          // Create or update customer record
          console.log("🔍 Looking for existing customer...");
          console.log(
            "🔍 DEBUG [17]: Looking for customer with phone:",
            customerData.phoneNumber,
            "and captainId:",
            captain._id
          );

          const existingCustomer = await Customer.findOne({
            captainId: captain._id,
            phoneNumber: customerData.phoneNumber,
          });

          if (existingCustomer) {
            console.log("✅ Found existing customer, updating...");
            // Update existing customer
            existingCustomer.totalCalls += 1;
            existingCustomer.lastCallDate = new Date();
            existingCustomer.customerName =
              customerData.customerName || existingCustomer.customerName;
            existingCustomer.email =
              customerData.email || existingCustomer.email;
            existingCustomer.preferredDates =
              customerData.preferredDates || existingCustomer.preferredDates;
            existingCustomer.partySize =
              customerData.partySize || existingCustomer.partySize;
            existingCustomer.tripType =
              customerData.tripType || existingCustomer.tripType;
            existingCustomer.experience =
              customerData.experience || existingCustomer.experience;
            existingCustomer.specialRequests =
              customerData.specialRequests || existingCustomer.specialRequests;
            existingCustomer.budget =
              customerData.budget || existingCustomer.budget;
            existingCustomer.callbackRequested =
              customerData.callbackRequested !== undefined
                ? customerData.callbackRequested
                : existingCustomer.callbackRequested;
            existingCustomer.urgency =
              customerData.urgency || existingCustomer.urgency;

            await existingCustomer.save();
            console.log("✅ Existing customer updated:", existingCustomer._id);
            console.log(
              "🔍 DEBUG [18]: Customer successfully updated in database"
            );
          } else {
            console.log("📝 Creating new customer record...");
            console.log(
              "🔍 DEBUG [19]: No existing customer found, creating new record"
            );
            // Create new customer
            const customerInfo = {
              captainId: captain._id,
              customerName: customerData.customerName || "Unknown",
              phoneNumber: customerData.phoneNumber || "Unknown",
              email: customerData.email || "",
              preferredDates: customerData.preferredDates || [],
              partySize: customerData.partySize || 0,
              tripType: customerData.tripType || "Not specified",
              experience: customerData.experience || "Not specified",
              specialRequests: customerData.specialRequests || "",
              budget: customerData.budget || "Not specified",
              callbackRequested: customerData.callbackRequested || false,
              urgency: customerData.urgency || "medium",
              totalCalls: 1,
              lastCallDate: new Date(),
              status: "new",
            };

            const customer = new Customer(customerInfo);
            await customer.save();
            console.log("✅ New customer record created:", customer._id);
            console.log(
              "🔍 DEBUG [20]: New customer successfully saved to database"
            );
          }

          // Send SMS notification to captain (only if not already sent)
          try {
            // Check if SMS was already sent for this call
            const callRecord = await Call.findOne({
              callId: event.call?.id,
              captainId: captain._id,
            });

            if (callRecord && callRecord.smsSent) {
              console.log("📱 SMS already sent for this call, skipping...");
              return;
            }

            console.log("📱 Attempting to send SMS notification...");
            const smsResult = await sendCustomerNotificationSMS(
              captain,
              customerData
            );

            if (smsResult.success) {
              console.log(
                `✅ SMS notification sent successfully to ${captain.captainName}:`,
                {
                  messageSid: smsResult.messageSid,
                  customerName: smsResult.customerName,
                }
              );

              // Mark SMS as sent in call record
              if (callRecord) {
                callRecord.smsSent = true;
                await callRecord.save();
              }
            } else {
              console.log(
                `📱 SMS notification skipped for ${captain.captainName}: ${
                  smsResult.reason || smsResult.error
                }`
              );
            }
          } catch (smsError) {
            console.error("❌ SMS notification error:", smsError);
            // Don't fail the webhook if SMS fails - this is non-critical
          }
        }
      }
    }
  } catch (error) {
    console.error("Error handling tool calls:", error);
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json(
    {
      message: "VAPI webhook endpoint is ready",
      status: "active",
    },
    { status: 200 }
  );
}
