import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function checkUserSubscription() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        hasAccess: false,
        reason: "Not authenticated",
        user: null,
      };
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return {
        hasAccess: false,
        reason: "User not found",
        user: null,
      };
    }

    // Admins always have access
    if (user.isAdmin()) {
      return {
        hasAccess: true,
        reason: "Admin user",
        user,
        subscription: user.subscription,
      };
    }

    // Check if user has active subscription
    if (user.hasActiveSubscription()) {
      return {
        hasAccess: true,
        reason: "Active subscription",
        user,
        subscription: user.subscription,
      };
    }

    return {
      hasAccess: false,
      reason: "No active subscription",
      user,
      subscription: user.subscription,
    };
  } catch (error) {
    console.error("Error checking user subscription:", error);
    return {
      hasAccess: false,
      reason: "Error checking subscription",
      user: null,
    };
  }
}

export async function requireSubscription() {
  const result = await checkUserSubscription();

  if (!result.hasAccess) {
    throw new Error(`Access denied: ${result.reason}`);
  }

  return result;
}

export async function requireActiveSubscription() {
  const result = await checkUserSubscription();

  if (!result.hasAccess) {
    throw new Error(`Access denied: ${result.reason}`);
  }

  // Additional check for non-admin users
  if (!result.user?.isAdmin() && !result.user?.hasActiveSubscription()) {
    throw new Error("Access denied: No active subscription");
  }

  return result;
}
