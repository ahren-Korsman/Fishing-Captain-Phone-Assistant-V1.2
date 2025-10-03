import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    console.log("🔍 DEBUG: Subscription status API called");
    const session = await getServerSession(authOptions);
    console.log("🔍 DEBUG: Server session:", session);
    console.log("🔍 DEBUG: Session user:", session?.user);
    console.log("🔍 DEBUG: Session user ID:", session?.user?.id);
    console.log("🔍 DEBUG: Session user email:", session?.user?.email);

    if (!session?.user?.id) {
      console.log("🔍 DEBUG: No session or user ID, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Handle both MongoDB ObjectIds and Google OAuth IDs
    let user;
    try {
      // Try to find by MongoDB ObjectId first
      console.log("🔍 DEBUG: Looking for user by ID:", session.user.id);
      user = await User.findById(session.user.id);
      console.log("🔍 DEBUG: User found by ID:", user ? "YES" : "NO");
    } catch {
      // If that fails, try to find by email (for Google OAuth users)
      console.log(
        "🔍 DEBUG: ID lookup failed, trying email:",
        session.user.email
      );
      user = await User.findByEmail(session.user.email);
      console.log("🔍 DEBUG: User found by email:", user ? "YES" : "NO");
    }

    if (!user) {
      console.log("🔍 DEBUG: User not found, returning 404");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(
      "🔍 DEBUG: User subscription status:",
      user.subscription.status
    );
    console.log(
      "🔍 DEBUG: User hasActiveSubscription:",
      user.hasActiveSubscription()
    );
    console.log("🔍 DEBUG: User canAccessPlatform:", user.canAccessPlatform());

    return NextResponse.json({
      success: true,
      subscription: {
        status: user.subscription.status,
        hasActiveSubscription: user.hasActiveSubscription(),
        canAccessPlatform: user.canAccessPlatform(),
        isAdmin: user.isAdmin(),
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        priceId: user.subscription.priceId,
        lastUpdated: user.subscription.lastUpdated,
      },
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      message: "Subscription status endpoint",
      instructions: "Send a GET request to check subscription status",
    },
    { status: 200 }
  );
}
