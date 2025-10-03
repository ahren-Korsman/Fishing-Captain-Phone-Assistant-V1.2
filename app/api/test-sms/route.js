import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";
import { sendTestSMS } from "@/lib/utils/sms";

export async function POST() {
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

    // Check if captain has SMS enabled
    if (!captain.smsOptIn) {
      return NextResponse.json(
        {
          error: "SMS notifications are disabled for this captain",
          smsOptIn: false,
        },
        { status: 400 }
      );
    }

    // Check if captain has required phone number
    if (!captain.phoneNumber) {
      return NextResponse.json(
        {
          error: "Captain phone number not found",
        },
        { status: 400 }
      );
    }

    // Send test SMS using single campaign number
    const result = await sendTestSMS(captain.phoneNumber);

    if (result.success) {
      console.log(
        `✅ Test SMS sent successfully to captain ${captain.captainName}`
      );
      return NextResponse.json({
        success: true,
        message: "Test SMS sent successfully",
        messageSid: result.messageSid,
        status: result.status,
        captainName: captain.captainName,
        phoneNumber: captain.phoneNumber,
      });
    } else {
      console.error(
        `❌ Test SMS failed for captain ${captain.captainName}:`,
        result.error
      );
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          captainName: captain.captainName,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test SMS:", error);
    return NextResponse.json(
      { error: "Failed to send test SMS" },
      { status: 500 }
    );
  }
}
