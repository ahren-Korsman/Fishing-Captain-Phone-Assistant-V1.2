import axios from "axios";
import { getWebhookUrl } from "./utils/urls.js";

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_BASE_URL = "https://api.vapi.ai";

if (!VAPI_API_KEY) {
  throw new Error("Please define the VAPI_API_KEY environment variable");
}

// Create axios instance with default headers
const vapiClient = axios.create({
  baseURL: VAPI_BASE_URL,
  headers: {
    Authorization: `Bearer ${VAPI_API_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Create a fishing captain assistant
 * @param {Object} assistantConfig - Configuration for the assistant
 * @returns {Promise<Object>} Created assistant data
 */
export async function createFishingCaptainAssistant(assistantConfig) {
  try {
    console.log("🎣 Creating fishing captain assistant...");
    console.log("📋 Assistant config:", assistantConfig);

    // Get only the customer info tool instead of all tools
    const customerInfoTool = await getCustomerInfoTool();
    const toolIds = customerInfoTool ? [customerInfoTool.id] : [];

    console.log("🛠️ Tool IDs (customer info only):", toolIds);

    // Complete assistant configuration with function calling
    const assistantData = {
      name: assistantConfig.name || "Fishing Captain Assistant",
      model: {
        provider: "openai",
        model: "gpt-4o",
        toolIds: toolIds, // Only essential tool
        temperature: 0.7,
        maxTokens: 1000,
        messages: [
          {
            role: "system",
            content:
              assistantConfig.systemMessage ||
              `You are an AI assistant for ${
                assistantConfig.captainName || "Captain Charlie"
              }'s fishing charter business. The captain is currently on the water, so you're helping gather trip details from callers.

              GREETING: Always start with: "Hey, thanks for calling. ${
                assistantConfig.captainName || "Captain Charlie"
              } is on the water, but I can help gather your trip details. Can I get your name?"

              YOUR ROLE:
              - Collect caller's name, phone number, and preferred fishing dates
              - Keep the tone casual, polite, and professional (like talking to a fishing buddy)
              - Provide basic fishing info if asked (seasonal species, trip types)
              - Make it clear that final bookings will be confirmed directly by the captain
              - Keep calls efficient but friendly

              WHAT TO COLLECT:
              - Name and best contact number
              - Preferred dates or general timeframe
              - Party size and experience level
              - Type of fishing they're interested in (if any preference)
              - Any special requests or questions

              FISHING KNOWLEDGE (if asked):
              ${
                assistantConfig.localFishingInfo ||
                "Share general info about local fishing seasons and popular species."
              }

              CONVERSATION FLOW:
              - Use casual, friendly language like "grab your name" instead of "obtain your information"
              - Collect information in this order: name, phone number, preferred dates, party size, trip type, experience level, special requests
              - When you have collected ALL the essential information (name, phone, dates, party size, trip type), say: "Perfect! Let me just note down these details for ${
                assistantConfig.captainName || "Captain Charlie"
              }"
              - Then silently call the collect_customer_info function with ALL the data you've gathered
              - After the function call, continue with: "Thanks for that! ${
                assistantConfig.captainName || "Captain Charlie"
              } will get back to you shortly to confirm everything. Thanks for reaching out!"

              DATA COLLECTION REQUIREMENTS:
              - ALWAYS collect: customerName, phoneNumber, preferredDates, partySize, tripType, experience, callbackRequested
              - OPTIONALLY collect: email, budget, specialRequests, urgency, leadSource
              - Set callbackRequested to true if the customer wants the captain to call them back
              - Set urgency to "high" if they need immediate response, "medium" for normal requests, "low" for flexible timing
              - Only call the function when you have the essential information (name, phone, dates, party size, trip type)

              CRITICAL - WHAT TO SPEAK vs WHAT TO KEEP INTERNAL:
              - ONLY speak the natural conversation parts above
              - NEVER speak function names, parameters, or internal processing steps
              - NEVER say things like "collect_customer_info" or "Name Bob. Phone number..."
              - NEVER speak JavaScript code, function calls, or technical details
              - When you have enough information, say "Let me just note down these details" then silently call the collect_customer_info function
              - After calling the function, continue the conversation naturally without mentioning the function call
              - Keep all data collection and processing completely internal and invisible to the caller
              
              IMPORTANT: Use the collect_customer_info function when you have enough details to pass to the captain, but do so with a natural transition like "Let me just note down these details"`,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "DHeSUVQvhhYeIxNUbtj3",
      },
      server: {
        url: getWebhookUrl(),
        secret: process.env.VAPI_WEBHOOK_SECRET,
      },
      firstMessage:
        assistantConfig.firstMessage ||
        `Hey, thanks for calling. ${
          assistantConfig.captainName || "Captain Charlie"
        } is on the water, but I can help gather your trip details.`,
    };

    const response = await vapiClient.post("/assistant", assistantData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating VAPI assistant:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to create VAPI assistant: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Get assistant by ID
 * @param {string} assistantId - Assistant ID
 * @returns {Promise<Object>} Assistant data
 */
export async function getAssistant(assistantId) {
  try {
    const response = await vapiClient.get(`/assistant/${assistantId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching VAPI assistant:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to fetch VAPI assistant: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Update assistant
 * @param {string} assistantId - Assistant ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated assistant data
 */
export async function updateAssistant(assistantId, updates) {
  try {
    const response = await vapiClient.patch(
      `/assistant/${assistantId}`,
      updates
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error updating VAPI assistant:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to update VAPI assistant: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Delete assistant
 * @param {string} assistantId - Assistant ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteAssistant(assistantId) {
  try {
    const response = await vapiClient.delete(`/assistant/${assistantId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting VAPI assistant:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to delete VAPI assistant: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Get all assistants
 * @returns {Promise<Array>} List of assistants
 */
export async function getAllAssistants() {
  try {
    const response = await vapiClient.get("/assistant");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching VAPI assistants:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to fetch VAPI assistants: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Create a VAPI tool for collecting customer information
 * @returns {Promise<Object>} Created tool data
 */
export async function createCustomerInfoTool() {
  try {
    const toolData = {
      type: "function",
      server: {
        url: getWebhookUrl(),
      },
      function: {
        name: "collect_customer_info",
        description:
          "Silently collect customer contact information and trip preferences for fishing charter booking. This function should be called internally when the assistant has gathered enough information (name, phone, dates, party size, trip type) with a natural transition like 'Let me just note down these details'. ALWAYS collect: customerName, phoneNumber, preferredDates, partySize, tripType, experience, callbackRequested. OPTIONALLY collect: email, budget, specialRequests, urgency, leadSource.",
        parameters: {
          type: "object",
          properties: {
            customerName: {
              type: "string",
              description: "Customer's full name",
            },
            phoneNumber: {
              type: "string",
              description: "Customer's phone number",
            },
            email: {
              type: "string",
              description: "Customer's email address (optional)",
            },
            preferredDates: {
              type: "array",
              items: { type: "string" },
              description:
                "Preferred dates for fishing trip (e.g., 'March 15', 'next weekend')",
            },
            partySize: {
              type: "number",
              description: "Number of people in the fishing party",
            },
            tripType: {
              type: "string",
              enum: ["inshore", "offshore", "deep-sea", "not-sure"],
              description: "Type of fishing trip preferred",
            },
            experience: {
              type: "string",
              enum: [
                "beginner",
                "intermediate",
                "experienced",
                "not-specified",
              ],
              description: "Fishing experience level of the group",
            },
            specialRequests: {
              type: "string",
              description:
                "Any special requests, dietary restrictions, or accessibility needs",
            },
            budget: {
              type: "string",
              description: "Budget range or specific budget for the trip",
            },
            callbackRequested: {
              type: "boolean",
              description:
                "Whether the customer wants a callback from the captain",
            },
            urgency: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "How urgent is the booking request",
            },
            leadSource: {
              type: "string",
              description: "How the customer heard about the charter service",
            },
          },
          required: ["customerName", "phoneNumber", "callbackRequested"],
        },
      },
    };

    const response = await vapiClient.post("/tool", toolData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating VAPI tool:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to create VAPI tool: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Get the customer info tool specifically
 * @returns {Promise<Object>} Customer info tool data
 */
export async function getCustomerInfoTool() {
  try {
    const response = await vapiClient.get("/tool");
    const tools = response.data;

    // Find the customer info tool specifically
    const customerInfoTool = tools.find(
      (tool) => tool.function?.name === "collect_customer_info"
    );

    if (!customerInfoTool) {
      console.warn("⚠️ Customer info tool not found, creating it...");
      return await createCustomerInfoTool();
    }

    console.log("✅ Found customer info tool:", customerInfoTool.id);
    return customerInfoTool;
  } catch (error) {
    console.error("Error fetching customer info tool:", error);
    // Fallback: create the tool
    return await createCustomerInfoTool();
  }
}

/**
 * Get all VAPI tools
 * @returns {Promise<Array>} List of tools
 */
export async function getAllTools() {
  try {
    const response = await vapiClient.get("/tool");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching VAPI tools:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to fetch VAPI tools: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Create a tool for scheduling callbacks
 * @returns {Promise<Object>} Created tool data
 */
export async function createCallbackSchedulingTool() {
  try {
    const toolData = {
      type: "function",
      server: {
        url: getWebhookUrl(),
      },
      function: {
        name: "schedule_callback",
        description: "Schedule a callback appointment with the fishing captain",
        parameters: {
          type: "object",
          properties: {
            customerName: {
              type: "string",
              description: "Customer's name for the callback",
            },
            phoneNumber: {
              type: "string",
              description: "Phone number to call back",
            },
            preferredTime: {
              type: "string",
              description:
                "Customer's preferred callback time (e.g., 'morning', 'afternoon', 'specific time')",
            },
            urgency: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "How urgent is this callback",
            },
            notes: {
              type: "string",
              description: "Additional notes about the callback request",
            },
          },
          required: ["customerName", "phoneNumber", "preferredTime"],
        },
      },
    };

    const response = await vapiClient.post("/tool", toolData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating callback scheduling tool:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to create callback scheduling tool: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Create a tool for transferring calls to the captain
 * @returns {Promise<Object>} Created tool data
 */
export async function createTransferCallTool() {
  try {
    const toolData = {
      type: "function",
      server: {
        url: getWebhookUrl(),
      },
      function: {
        name: "transfer_to_captain",
        description: "Transfer the call directly to the fishing captain",
        parameters: {
          type: "object",
          properties: {
            destination: {
              type: "string",
              enum: ["+1234567890"], // This would be the captain's actual number
              description: "The phone number to transfer the call to",
            },
            message: {
              type: "string",
              default:
                "I'm transferring you to the captain now. Please hold on.",
              description: "Message to play before transferring",
            },
          },
          required: ["destination"],
        },
      },
    };

    const response = await vapiClient.post("/tool", toolData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating transfer call tool:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to create transfer call tool: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

/**
 * Delete a VAPI tool
 * @param {string} toolId - Tool ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteTool(toolId) {
  try {
    const response = await vapiClient.delete(`/tool/${toolId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting VAPI tool:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to delete VAPI tool: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

// Phone Number Management Functions
export async function importTwilioNumberToVapi(
  twilioNumber,
  assistantId,
  accountSid,
  authToken
) {
  try {
    console.log(
      `📞 Importing Twilio number ${twilioNumber} to VAPI and assigning to assistant ${assistantId}...`
    );

    // Use the correct VAPI import endpoint
    const response = await fetch(
      "https://api.vapi.ai/phone-number/import/twilio",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twilioPhoneNumber: twilioNumber,
          twilioAccountSid: accountSid,
          twilioAuthToken: authToken,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ VAPI import error details:", errorData);
      console.error("❌ Request body sent:", {
        twilioPhoneNumber: twilioNumber,
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken ? "***SET***" : "MISSING",
      });
      console.error("❌ Response status:", response.status);
      console.error(
        "❌ Response headers:",
        Object.fromEntries(response.headers.entries())
      );
      throw new Error(
        `VAPI phone number import failed: ${
          errorData.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    console.log(`✅ Successfully imported Twilio number to VAPI:`, data.id);

    return data;
  } catch (error) {
    console.error("❌ Error importing Twilio number to VAPI:", error);
    throw error;
  }
}

export async function assignAssistantToPhoneNumber(phoneNumberId, assistantId) {
  try {
    console.log(
      `🔗 Assigning assistant ${assistantId} to phone number ${phoneNumberId}...`
    );

    const response = await fetch(
      `https://api.vapi.ai/phone-number/${phoneNumberId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId: assistantId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `VAPI phone number assignment failed: ${
          errorData.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    console.log(`✅ Successfully assigned assistant to phone number`);
    return data;
  } catch (error) {
    console.error("❌ Error assigning assistant to phone number:", error);
    throw error;
  }
}

export async function getVapiPhoneNumber(phoneNumberId) {
  try {
    const response = await fetch(
      `https://api.vapi.ai/phone-number/${phoneNumberId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to get VAPI phone number: ${
          errorData.message || response.statusText
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error getting VAPI phone number:", error);
    throw error;
  }
}

export async function deleteVapiPhoneNumber(phoneNumberId) {
  try {
    console.log(`🗑️ Deleting VAPI phone number ${phoneNumberId}...`);

    const response = await fetch(
      `https://api.vapi.ai/phone-number/${phoneNumberId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to delete VAPI phone number: ${
          errorData.message || response.statusText
        }`
      );
    }

    console.log(`✅ Successfully deleted VAPI phone number`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting VAPI phone number:", error);
    throw error;
  }
}

export default vapiClient;
