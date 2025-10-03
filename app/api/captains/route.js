import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      captainName,
      businessName,
      phoneNumber,
      email,
      customInstructions,
      location,
      seasonalInfo,
      tripTypes,
      boatInfo,
      pricingInfo,
      smsOptIn,
    } = body;

    // Validate required fields
    if (
      !userId ||
      !captainName ||
      !businessName ||
      !phoneNumber ||
      !email ||
      !location
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: userId, captainName, businessName, phoneNumber, email, location",
        },
        { status: 400 }
      );
    }

    // Check if captain already exists for this user
    const existingCaptain = await Captain.findOne({
      $or: [{ userId }, { phoneNumber }, { email }],
    });

    if (existingCaptain) {
      return NextResponse.json(
        {
          error: "Captain with this phone number or email already exists",
        },
        { status: 409 }
      );
    }

    // Create new captain
    const captain = new Captain({
      userId,
      captainName,
      businessName,
      phoneNumber,
      email,
      customInstructions: customInstructions || "",
      location,
      seasonalInfo: seasonalInfo || "",
      tripTypes: tripTypes || ["inshore", "offshore"],
      boatInfo: boatInfo || "",
      pricingInfo: pricingInfo || "",
      smsOptIn: smsOptIn !== undefined ? smsOptIn : true,
      serviceEnabled: true,
    });

    await captain.save();

    return NextResponse.json(
      {
        success: true,
        message: "Captain registered successfully!",
        captain: {
          id: captain._id,
          captainName: captain.captainName,
          businessName: captain.businessName,
          phoneNumber: captain.phoneNumber,
          email: captain.email,
          serviceEnabled: captain.serviceEnabled,
          createdAt: captain.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering captain:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to register captain",
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    // Get user ID from session (this would need to be passed from the frontend)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Build query - filter by user if userId provided
    const query = { serviceEnabled: true };
    if (userId) {
      query.userId = userId;
    }

    const captains = await Captain.find(query);

    return NextResponse.json(
      {
        success: true,
        captains: captains.map((captain) => ({
          id: captain._id,
          captainName: captain.captainName,
          businessName: captain.businessName,
          phoneNumber: captain.phoneNumber,
          email: captain.email,
          serviceEnabled: captain.serviceEnabled,
          twilioNumber: captain.twilioNumber,
          createdAt: captain.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching captains:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch captains",
      },
      { status: 500 }
    );
  }
}
