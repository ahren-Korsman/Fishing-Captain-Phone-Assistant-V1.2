import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Captain from "@/lib/models/Captain";

// Helper function to update captain subscription status
async function updateCaptainSubscriptionStatus(userId, isActive) {
  try {
    const captain = await Captain.findOne({ userId });
    if (captain) {
      captain.subscriptionActive = isActive;
      await captain.save();
      console.log(
        `✅ Captain ${captain.captainName} subscription status updated: ${isActive}`
      );
    } else {
      console.log(
        `ℹ️ No captain record found for user ${userId} - user hasn't completed onboarding yet`
      );
    }
  } catch (error) {
    console.error("Error updating captain subscription status:", error);
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`🔔 Stripe webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log("✅ Checkout session completed:", session.id);
    console.log("🔍 DEBUG: Session metadata:", session.metadata);
    console.log("🔍 DEBUG: Session customer:", session.customer);

    const userId = session.metadata?.userId;
    if (!userId) {
      console.error("No userId in checkout session metadata");
      return;
    }

    console.log("🔍 DEBUG: Looking for user by ID:", userId);
    const user = await User.findById(userId);
    console.log("🔍 DEBUG: User found:", user ? "YES" : "NO");
    if (user) {
      console.log("🔍 DEBUG: User email:", user.email);
      console.log(
        "🔍 DEBUG: User current stripeCustomerId:",
        user.stripeCustomerId
      );
    }

    if (!user) {
      console.error("User not found:", userId);
      return;
    }

    // Update user with Stripe customer ID
    user.stripeCustomerId = session.customer;
    await user.save();

    console.log(
      `✅ User ${user.email} updated with Stripe customer ID: ${session.customer}`
    );
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  try {
    console.log("✅ Subscription created:", subscription.id);
    console.log("🔍 DEBUG: Looking for customer:", subscription.customer);
    console.log("🔍 DEBUG: Subscription object:", {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      customer: subscription.customer,
    });

    const user = await User.findByStripeCustomerId(subscription.customer);
    console.log("🔍 DEBUG: User found:", user ? "YES" : "NO");
    if (user) {
      console.log("🔍 DEBUG: User email:", user.email);
      console.log("🔍 DEBUG: User stripeCustomerId:", user.stripeCustomerId);
    }

    if (!user) {
      console.error("User not found for customer:", subscription.customer);
      // Try to find user by email from subscription metadata
      if (subscription.metadata?.userEmail) {
        console.log(
          "🔍 DEBUG: Trying to find user by email:",
          subscription.metadata.userEmail
        );
        const userByEmail = await User.findByEmail(
          subscription.metadata.userEmail
        );
        if (userByEmail) {
          console.log(
            "🔍 DEBUG: Found user by email, updating stripeCustomerId"
          );
          userByEmail.stripeCustomerId = subscription.customer;
          await userByEmail.save();
          // Refresh user from database to get latest status
          await userByEmail.save(); // Save the stripeCustomerId first
          const refreshedUser = await User.findById(userByEmail._id);

          // Only update subscription if it's not already active AND not already has this subscription ID
          if (
            refreshedUser.subscription.status !== "active" &&
            refreshedUser.subscription.stripeSubscriptionId !== subscription.id
          ) {
            console.log(
              "🔍 DEBUG: Updating subscription status from",
              refreshedUser.subscription.status,
              "to",
              subscription.status
            );
            await userByEmail.updateSubscription({
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodStart: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000)
                : undefined,
              currentPeriodEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : undefined,
              cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
              priceId: subscription.items.data[0]?.price?.id,
            });
            console.log(
              `✅ User ${userByEmail.email} subscription created via email fallback: ${subscription.status}`
            );

            // Update captain subscription status
            await updateCaptainSubscriptionStatus(userByEmail._id, true);
          } else {
            console.log(
              `⚠️ User ${userByEmail.email} already has active subscription or same subscription ID, skipping update`
            );
          }
          return;
        }
      }
      return;
    }

    // Refresh user from database to get latest status
    const refreshedUser = await User.findById(user._id);

    // Only update subscription if it's not already active AND not already has this subscription ID
    if (
      refreshedUser.subscription.status !== "active" &&
      refreshedUser.subscription.stripeSubscriptionId !== subscription.id
    ) {
      console.log(
        "🔍 DEBUG: Updating subscription status from",
        refreshedUser.subscription.status,
        "to",
        subscription.status
      );
      await user.updateSubscription({
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        priceId: subscription.items.data[0]?.price?.id,
      });
      console.log(
        `✅ User ${user.email} subscription created: ${subscription.status}`
      );

      // Update captain subscription status
      await updateCaptainSubscriptionStatus(user._id, true);
    } else {
      console.log(
        `⚠️ User ${user.email} already has active subscription or same subscription ID, skipping update`
      );
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log("🔄 Subscription updated:", subscription.id);
    console.log("🔍 DEBUG: Updated subscription status:", subscription.status);
    console.log("🔍 DEBUG: Updated subscription object:", {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      customer: subscription.customer,
      metadata: subscription.metadata,
    });

    const user = await User.findByStripeSubscriptionId(subscription.id);
    console.log(
      "🔍 DEBUG: User found by subscription ID:",
      user ? "YES" : "NO"
    );

    if (!user) {
      console.error("User not found for subscription:", subscription.id);
      // Try to find user by customer ID
      const userByCustomer = await User.findByStripeCustomerId(
        subscription.customer
      );
      if (userByCustomer) {
        console.log(
          "🔍 DEBUG: Found user by customer ID, updating subscription"
        );
        await userByCustomer.updateSubscription({
          stripeSubscriptionId: subscription.id, // Make sure to set this!
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : undefined,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        });
        console.log(
          `✅ User ${userByCustomer.email} subscription updated via customer fallback: ${subscription.status}`
        );

        // Update captain subscription status
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";
        await updateCaptainSubscriptionStatus(userByCustomer._id, isActive);
        return;
      }

      // If still not found, try to find by email from subscription metadata
      if (subscription.metadata?.userEmail) {
        console.log(
          "🔍 DEBUG: Trying to find user by email from subscription metadata:",
          subscription.metadata.userEmail
        );
        const userByEmail = await User.findByEmail(
          subscription.metadata.userEmail
        );
        if (userByEmail) {
          console.log("🔍 DEBUG: Found user by email, updating subscription");
          await userByEmail.updateSubscription({
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : undefined,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined,
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          });
          console.log(
            `✅ User ${userByEmail.email} subscription updated via email fallback: ${subscription.status}`
          );

          // Update captain subscription status
          const isActive =
            subscription.status === "active" ||
            subscription.status === "trialing";
          await updateCaptainSubscriptionStatus(userByEmail._id, isActive);
          return;
        }
      }

      return;
    }

    // Update user subscription data
    await user.updateSubscription({
      stripeSubscriptionId: subscription.id, // Make sure to set this!
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    });

    console.log(
      `✅ User ${user.email} subscription updated: ${subscription.status}`
    );

    // Update captain subscription status based on subscription status
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    await updateCaptainSubscriptionStatus(user._id, isActive);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

// Handle subscription deleted/canceled
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log("❌ Subscription deleted:", subscription.id);

    const user = await User.findByStripeSubscriptionId(subscription.id);
    if (!user) {
      console.error("User not found for subscription:", subscription.id);
      return;
    }

    // Clear user subscription data
    await user.clearSubscription();

    console.log(`✅ User ${user.email} subscription cleared`);

    // Update captain subscription status
    await updateCaptainSubscriptionStatus(user._id, false);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  try {
    console.log("💰 Payment succeeded:", invoice.id);

    const user = await User.findByStripeCustomerId(invoice.customer);
    if (!user) {
      console.error("User not found for customer:", invoice.customer);
      return;
    }

    // Update subscription status to active if it was past_due, incomplete, or none
    if (
      user.subscription.status === "past_due" ||
      user.subscription.status === "incomplete" ||
      user.subscription.status === "none"
    ) {
      await user.updateSubscription({
        status: "active",
      });
      console.log(
        `✅ User ${user.email} subscription activated (was ${user.subscription.status})`
      );

      // Update captain subscription status
      await updateCaptainSubscriptionStatus(user._id, true);
    }
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  try {
    console.log("💸 Payment failed:", invoice.id);

    const user = await User.findByStripeCustomerId(invoice.customer);
    if (!user) {
      console.error("User not found for customer:", invoice.customer);
      return;
    }

    // Update subscription status to past_due
    await user.updateSubscription({
      status: "past_due",
    });

    console.log(`⚠️ User ${user.email} subscription marked as past_due`);

    // Update captain subscription status
    await updateCaptainSubscriptionStatus(user._id, false);
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Stripe webhook endpoint",
      instructions: "This endpoint receives Stripe webhook events",
    },
    { status: 200 }
  );
}
