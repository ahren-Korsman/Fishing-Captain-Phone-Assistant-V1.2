import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🔍 DEBUG: Manual subscription fix for:", user.email);
    console.log(
      "🔍 DEBUG: Current subscription status:",
      user.subscription.status
    );
    console.log(
      "🔍 DEBUG: Current subscription ID:",
      user.subscription.stripeSubscriptionId
    );

    // If user has a subscription ID but status is incomplete, update to active
    if (
      user.subscription.stripeSubscriptionId &&
      user.subscription.status === "incomplete"
    ) {
      await user.updateSubscription({
        status: "active",
      });

      console.log("✅ Manual fix: Updated subscription status to active");

      return NextResponse.json({
        success: true,
        message: "Subscription status updated to active",
        previousStatus: "incomplete",
        newStatus: "active",
      });
    }

    return NextResponse.json({
      success: true,
      message: "No fix needed",
      currentStatus: user.subscription.status,
    });
  } catch (error) {
    console.error("Error fixing subscription:", error);
    return NextResponse.json(
      { error: "Failed to fix subscription" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Subscription fix endpoint",
    instructions: "Send a POST request to manually fix subscription status",
  });
}
