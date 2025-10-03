import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Call from "@/lib/models/Call";
import Customer from "@/lib/models/Customer";
import Captain from "@/lib/models/Captain";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { testType = "tool-calls" } = body;

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

    if (testType === "tool-calls") {
      // Create test call record
      const testCall = new Call({
        callId: `test-call-${Date.now()}`,
        captainId: captain._id,
        assistantId: "test-assistant",
        customerPhone: "+1234567890",
        status: "in-progress",
        startedAt: new Date(),
        metadata: {
          callerId: "+1234567890",
          language: "en",
        },
      });

      await testCall.save();

      // Create test customer data
      const testCustomer = new Customer({
        captainId: captain._id,
        customerName: "Test Customer",
        phoneNumber: "+1234567890",
        email: "test@example.com",
        preferredDates: ["2024-02-15", "2024-02-16"],
        partySize: 4,
        tripType: "offshore",
        experience: "intermediate",
        specialRequests: "Looking for a half-day trip",
        budget: "$800",
        callbackRequested: true,
        urgency: "medium",
        totalCalls: 1,
        lastCallDate: new Date(),
        status: "new",
      });

      await testCustomer.save();

      // Update call with customer data
      testCall.customerData = {
        customerName: testCustomer.customerName,
        phoneNumber: testCustomer.phoneNumber,
        email: testCustomer.email,
        preferredDates: testCustomer.preferredDates,
        partySize: testCustomer.partySize,
        tripType: testCustomer.tripType,
        experience: testCustomer.experience,
        specialRequests: testCustomer.specialRequests,
        budget: testCustomer.budget,
        callbackRequested: testCustomer.callbackRequested,
        urgency: testCustomer.urgency,
      };

      testCall.status = "completed";
      testCall.endedAt = new Date();
      testCall.duration = 180; // 3 minutes
      testCall.transcript = `Assistant: Hey, thanks for calling. Bobby is on the water, but I can help gather your trip details.

Customer: Hi, I'm interested in booking a fishing trip for my family.

Assistant: That sounds great! I'd be happy to help you with that. We offer fishing trips along the Gulf Coast, Alabama. Our peak season runs from April through October. In the summer, we've got amazing red snapper and grouper fishing. While the fall is great for king mackerel. We have different trip types like deep sea and fly fishing. Our boat is a 32 feet center console, perfect for up to 6 passengers. Half day trips start at 800 dollars, and full day trips are 1200 dollars. We also offer group discounts for 4 or more people. What's your name?

Customer: I'm Test Customer.

Assistant: Nice to meet you, Test Customer. And what's the best contact number for you?

Customer: 5551234567

Assistant: Got it. What dates are you thinking for your trip?

Customer: This Friday or Saturday evening would work great.

Assistant: Perfect. How many people will be in your group?

Customer: There will be 4 of us.

Assistant: Great! Do you have any preference on the type of fishing, like deep sea, fly fishing, or are you open to anything?

Customer: We're not sure, we're beginners.

Assistant: No problem at all! We love taking beginners out and showing them the ropes. Any special requests or questions you have for Bobby?

Customer: We're looking for a half-day trip, and our budget is around $800.

Assistant: Perfect! Let me just note down these details for Bobby. Thanks for that! Bobby will get back to you shortly to confirm everything. Thanks for reaching out!`;

      await testCall.save();

      return NextResponse.json({
        success: true,
        message: "Test data created successfully!",
        data: {
          call: testCall,
          customer: testCustomer,
          captain: {
            id: captain._id,
            name: captain.captainName,
            business: captain.businessName,
          },
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid test type",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating test data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create test data",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Test webhook data endpoint",
      instructions: "Send a POST request to create test call and customer data",
      testTypes: ["tool-calls"],
    },
    { status: 200 }
  );
}
