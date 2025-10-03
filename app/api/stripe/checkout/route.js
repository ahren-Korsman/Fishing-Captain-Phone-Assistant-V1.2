import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, validateStripeConfig } from "@/lib/stripe";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Validate Stripe configuration
    validateStripeConfig();

    // Handle both MongoDB ObjectIds and Google OAuth IDs
    let user;
    try {
      // Try to find by MongoDB ObjectId first
      user = await User.findById(session.user.id);
    } catch {
      // If that fails, try to find by email (for Google OAuth users)
      user = await User.findByEmail(session.user.email);
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has an active subscription
    if (user.hasActiveSubscription()) {
      return NextResponse.json(
        {
          error: "User already has an active subscription",
          subscription: user.subscription,
        },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession(
      user.email,
      user._id.toString()
    );

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Stripe checkout endpoint",
      instructions: "Send a POST request to create a checkout session",
    },
    { status: 200 }
  );
}
