import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { smsOptIn } = await request.json();

    // Validate input
    if (typeof smsOptIn !== "boolean") {
      return NextResponse.json(
        { error: "smsOptIn must be a boolean value" },
        { status: 400 }
      );
    }

    const captain = await Captain.findOneAndUpdate(
      { userId: session.user.id },
      { smsOptIn },
      { new: true }
    );

    if (!captain) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    console.log(
      `📱 SMS preferences updated for captain ${captain.captainName}:`,
      {
        smsOptIn: captain.smsOptIn,
        userId: session.user.id,
      }
    );

    return NextResponse.json({
      success: true,
      smsOptIn: captain.smsOptIn,
      captainName: captain.captainName,
      phoneNumber: captain.phoneNumber,
    });
  } catch (error) {
    console.error("Error updating SMS preferences:", error);
    return NextResponse.json(
      { error: "Failed to update SMS preferences" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const captain = await Captain.findOne({ userId: session.user.id });

    if (!captain) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      smsOptIn: captain.smsOptIn,
      captainName: captain.captainName,
      phoneNumber: captain.phoneNumber,
    });
  } catch (error) {
    console.error("Error fetching SMS preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS preferences" },
      { status: 500 }
    );
  }
}
