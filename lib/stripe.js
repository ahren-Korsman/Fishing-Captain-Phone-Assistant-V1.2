import Stripe from "stripe";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // Use latest stable API version
});

// Stripe configuration
export const stripeConfig = {
  // Production price ID (default)
  priceId: process.env.STRIPE_PRICE_ID,
  // Test price ID for testing
  testPriceId: process.env.STRIPE_TEST_PRICE_ID,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// Validate configuration
export function validateStripeConfig() {
  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PRICE_ID",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(", ")}`
    );
  }

  return true;
}

// Create a Stripe checkout session
export async function createCheckoutSession(
  customerEmail,
  userId,
  priceId = null
) {
  try {
    validateStripeConfig();

    // Use provided priceId, or fall back to production priceId
    const selectedPriceId = priceId || stripeConfig.priceId;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        userId: userId,
        userEmail: customerEmail,
        priceId: selectedPriceId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      subscription_data: {
        metadata: {
          userId: userId,
          userEmail: customerEmail,
          priceId: selectedPriceId,
        },
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

// Retrieve a checkout session
export async function getCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    throw error;
  }
}

// Create a Stripe customer
export async function createCustomer(email, name, userId) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId,
      },
    });

    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}

// Retrieve a customer
export async function getCustomer(customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error("Error retrieving customer:", error);
    throw error;
  }
}

// Retrieve a subscription
export async function getSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

// Create a customer portal session
export async function createCustomerPortalSession(customerId, returnUrl) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    throw error;
  }
}

// Verify webhook signature
export function verifyWebhookSignature(payload, signature, secret) {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    throw error;
  }
}

// Get subscription status from Stripe
export async function getSubscriptionStatus(subscriptionId) {
  try {
    const subscription = await getSubscription(subscriptionId);
    return subscription.status;
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return "unknown";
  }
}

// Check if subscription is active
export function isSubscriptionActive(status) {
  return status === "active" || status === "trialing";
}

// Get subscription details for a user
export async function getUserSubscriptionDetails(customerId) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subscription = subscriptions.data[0];
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0]?.price?.id,
    };
  } catch (error) {
    console.error("Error getting user subscription details:", error);
    throw error;
  }
}

export default stripe;
