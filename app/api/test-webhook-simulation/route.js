import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Call from "@/lib/models/Call";
import Customer from "@/lib/models/Customer";
import Captain from "@/lib/models/Captain";

export async function POST() {
  try {
    await connectDB();

    // Find a captain to associate with test data
    const captain = await Captain.findOne({
      serviceEnabled: true,
    }).limit(1);

    if (!captain) {
      return NextResponse.json(
        {
          success: false,
          error: "No captain found. Please register a captain first.",
        },
        { status: 400 }
      );
    }

    // Simulate the exact webhook payload structure from VAPI
    const simulatedWebhookPayload = {
      message: {
        timestamp: Date.now(),
        type: "tool-calls",
        toolCalls: [
          {
            id: `test-call-${Date.now()}`,
            type: "function",
            function: {
              name: "collect_customer_info",
              arguments: {
                customerName: "Test Customer",
                phoneNumber: "5551234567",
                preferredDates: ["This Friday", "Saturday evening"],
                partySize: 4,
                tripType: "not-sure",
                experience: "beginner",
                callbackRequested: true,
                urgency: "medium",
                specialRequests: "Looking for a half-day trip",
                budget: "$800",
              },
            },
          },
        ],
      },
      call: {
        id: `test-call-${Date.now()}`,
        assistantId: "test-assistant",
        customer: {
          number: "5551234567",
        },
      },
      assistant: {
        id: "test-assistant",
      },
    };

    // Process the simulated webhook payload
    console.log("🧪 Processing simulated webhook payload...");

    // Extract customer data
    const customerData =
      simulatedWebhookPayload.message.toolCalls[0].function.arguments;
    console.log("Customer data:", customerData);

    // Create call record
    const call = new Call({
      callId: simulatedWebhookPayload.call.id,
      captainId: captain._id,
      assistantId: simulatedWebhookPayload.call.assistantId,
      customerPhone: customerData.phoneNumber,
      status: "completed",
      startedAt: new Date(),
      endedAt: new Date(),
      duration: 180, // 3 minutes
      customerData: customerData,
      transcript: `Assistant: Hey, thanks for calling. Bobby is on the water, but I can help gather your trip details.

Customer: Hey. Yeah. I just wanted some information about going out on the boat.

Assistant: Of course. I'd be happy to help with that. We offer fishing trips along the Gulf Coast, Alabama. Our peak season runs from April through October. In the summer, we've got amazing red snapper and grouper fishing. While the fall is great for king mackerel. We have different trip types like deep sea and fly fishing. Our boat is a 32 feet center console, perfect for up to 6 passengers. Half day trips start at 800 dollars, and full day trips are 1200 dollars. We also offer group discounts for 4 or more people. Anything specific you're interested in?

Customer: Um, Yeah. I just wanted to book a trip for me and a couple of friends, uh, next Friday.

Assistant: Sounds great. Let me grab a few details to get this started. Uh, what's your name?

Customer: Mohammed

Assistant: Nice to meet you, Mohammed. And what's the best contact number for you?

Customer: Uh, 5 5 5 2 6.

Assistant: Got it. Uh, and you mentioned next Friday. Did you have any flexibility on dates, or is that the only day that works?

Customer: Um, probably the weekend as well. So Friday, Saturday, and Sunday.

Assistant: Alright. Friday through Sunday, how many people are in your group?

Customer: Uh, 5.

Assistant: Perfect. And do you guys have any preference on the type of fishing, like deep sea fly fishing, or are you open to anything?

Customer: No. We're we're all super beginners, so we just want the captain just to take us out and show us the ropes.

Assistant: Gotcha. Beginners looking for a fun day out on the water. Sounds like a great time. Any special requests or questions you have for Bobby?

Customer: No.

Assistant: Perfect! Let me just note down these details for Bobby. Thanks for that! Bobby will get back to you shortly to confirm everything. Thanks for reaching out!`,
    });

    await call.save();
    console.log("✅ Call record created:", call._id);

    // Create customer record
    const customer = new Customer({
      captainId: captain._id,
      customerName: customerData.customerName,
      phoneNumber: customerData.phoneNumber,
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
    });

    await customer.save();
    console.log("✅ Customer record created:", customer._id);

    return NextResponse.json({
      success: true,
      message: "Simulated webhook processed successfully!",
      data: {
        call: {
          id: call._id,
          callId: call.callId,
          customerData: call.customerData,
        },
        customer: {
          id: customer._id,
          customerName: customer.customerName,
          phoneNumber: customer.phoneNumber,
        },
        captain: {
          id: captain._id,
          name: captain.captainName,
          business: captain.businessName,
        },
      },
    });
  } catch (error) {
    console.error("Error processing simulated webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process simulated webhook",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Webhook simulation endpoint",
      instructions:
        "Send a POST request to simulate a VAPI webhook with tool calls",
    },
    { status: 200 }
  );
}
