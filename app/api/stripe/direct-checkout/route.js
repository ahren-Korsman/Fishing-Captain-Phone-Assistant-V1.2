import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCheckoutSession, validateStripeConfig } from "@/lib/stripe";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST() {
  try {
    console.log("🔍 DEBUG: Direct checkout API called");

    // Get the current session
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
    console.log("🔍 DEBUG: Database connected");

    // Validate Stripe configuration
    validateStripeConfig();
    console.log("🔍 DEBUG: Stripe config validated");

    // Handle both MongoDB ObjectIds and Google OAuth IDs
    let user;
    try {
      console.log("🔍 DEBUG: Attempting to find user by ID:", session.user.id);
      // Try to find by MongoDB ObjectId first
      user = await User.findById(session.user.id);
      console.log("🔍 DEBUG: User found by ID:", user ? "YES" : "NO");
    } catch (error) {
      console.log("🔍 DEBUG: Error finding user by ID:", error.message);
      console.log(
        "🔍 DEBUG: Attempting to find user by email:",
        session.user.email
      );
      // If that fails, try to find by email (for Google OAuth users)
      user = await User.findByEmail(session.user.email);
      console.log("🔍 DEBUG: User found by email:", user ? "YES" : "NO");
    }

    if (!user) {
      console.log("🔍 DEBUG: User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🔍 DEBUG: User found:", {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasActiveSubscription: user.hasActiveSubscription(),
      subscriptionStatus: user.subscription.status,
    });

    // Check if user is admin - admins should not go through checkout
    if (user.isAdmin()) {
      console.log("🔍 DEBUG: User is admin, redirecting to admin dashboard");
      return NextResponse.json(
        {
          error: "Admin user - no checkout required",
          redirectTo: "/admin",
        },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    if (user.hasActiveSubscription()) {
      console.log("🔍 DEBUG: User already has active subscription");
      return NextResponse.json(
        {
          error: "User already has an active subscription",
          subscription: user.subscription,
          redirectTo: "/dashboard",
        },
        { status: 400 }
      );
    }

    console.log("🔍 DEBUG: Creating Stripe checkout session");
    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession(
      user.email,
      user._id.toString()
    );

    console.log("🔍 DEBUG: Checkout session created:", {
      id: checkoutSession.id,
      url: checkoutSession.url,
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("🔍 DEBUG: Error creating direct checkout session:", error);
    console.error("🔍 DEBUG: Error stack:", error.stack);
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
      message: "Direct Stripe checkout endpoint",
      instructions:
        "Send a POST request to create a checkout session for authenticated users",
    },
    { status: 200 }
  );
}
