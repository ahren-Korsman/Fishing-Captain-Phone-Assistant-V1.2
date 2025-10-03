"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      console.log("🔍 DEBUG: AuthCallbackPage useEffect triggered");
      console.log("🔍 DEBUG: NextAuth status:", status);
      console.log("🔍 DEBUG: Session object:", session);
      console.log("🔍 DEBUG: Session user:", session?.user);
      console.log(
        "🔍 DEBUG: Session user ID:",
        session?.user && "id" in session.user
          ? (session.user as { id: string }).id
          : "undefined"
      );
      console.log("🔍 DEBUG: Session user email:", session?.user?.email);

      if (status === "loading") {
        console.log("🔍 DEBUG: NextAuth still loading, waiting...");
        return;
      }

      if (status === "authenticated" && session) {
        console.log("🔍 DEBUG: User is authenticated, checking if admin");

        // Check if user is admin first
        // @ts-expect-error - isAdmin is added by auth callback
        if (session.user?.isAdmin) {
          console.log(
            "🔍 DEBUG: User is admin, redirecting to admin dashboard"
          );
          router.push("/admin");
          return;
        }

        console.log(
          "🔍 DEBUG: User is not admin, checking subscription status"
        );
        try {
          // First check if user already has an active subscription
          console.log("🔍 DEBUG: Checking subscription status before checkout");
          const subscriptionResponse = await fetch(
            "/api/stripe/subscription-status"
          );
          const subscriptionData = await subscriptionResponse.json();

          console.log(
            "🔍 DEBUG: Subscription status response:",
            subscriptionData
          );

          if (
            subscriptionData.success &&
            subscriptionData.subscription.hasActiveSubscription
          ) {
            console.log(
              "🔍 DEBUG: User already has active subscription, checking captain enrollment"
            );

            // Check if captain is enrolled
            const userId = (session.user as { id: string })?.id;
            if (userId) {
              const captainResponse = await fetch(
                `/api/captains?userId=${userId}`
              );
              const captainData = await captainResponse.json();

              if (captainData.success && captainData.captains.length > 0) {
                console.log(
                  "🔍 DEBUG: Captain is enrolled, redirecting to dashboard"
                );
                router.push("/dashboard");
              } else {
                console.log(
                  "🔍 DEBUG: Captain not enrolled, redirecting to onboarding"
                );
                router.push("/onboarding");
              }
            } else {
              console.log("🔍 DEBUG: No user ID, redirecting to onboarding");
              router.push("/onboarding");
            }
            return;
          }

          // User doesn't have subscription, proceed to checkout
          console.log(
            "🔍 DEBUG: No active subscription, proceeding to checkout"
          );
          const response = await fetch("/api/stripe/direct-checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("🔍 DEBUG: Response status:", response.status);
          const data = await response.json();
          console.log("🔍 DEBUG: Response data:", data);

          if (data.success) {
            console.log(
              "🔍 DEBUG: Checkout session created, redirecting to:",
              data.url
            );
            // Redirect to Stripe checkout
            window.location.href = data.url;
          } else if (data.redirectTo) {
            console.log(
              "🔍 DEBUG: User already has subscription, redirecting to:",
              data.redirectTo
            );
            // User already has subscription, redirect to dashboard
            router.push(data.redirectTo);
          } else {
            console.error(
              "🔍 DEBUG: Failed to create checkout session:",
              data.error
            );
            // Fallback to sign-in page
            router.push("/auth/signin");
          }
        } catch (error) {
          console.error("🔍 DEBUG: Error in callback:", error);
          // Fallback to sign-in page
          router.push("/auth/signin");
        }
      } else if (status === "unauthenticated") {
        console.log(
          "🔍 DEBUG: User is not authenticated, redirecting to sign-in"
        );
        // User is not authenticated, redirect to sign-in
        router.push("/auth/signin");
      } else {
        console.log("🔍 DEBUG: Unknown status, redirecting to sign-in");
        router.push("/auth/signin");
      }
    };

    handleCallback();
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
