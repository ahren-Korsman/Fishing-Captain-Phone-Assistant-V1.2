"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SubscriptionCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function SubscriptionCheck({
  children,
  fallback,
  redirectTo = "/auth/signin",
}: SubscriptionCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    canAccessPlatform: boolean;
    isAdmin: boolean;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      // If NextAuth is still loading, wait
      if (status === "loading") return;

      // If user is not authenticated, redirect to sign-in
      if (status === "unauthenticated" || !session) {
        router.push(redirectTo);
        return;
      }

      // Only check subscription for authenticated users
      if (!session?.user || !("id" in session.user)) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/stripe/subscription-status");
        const data = await response.json();

        if (data.success) {
          setSubscriptionStatus(data.subscription);

          // If user can't access platform and is authenticated, redirect
          if (
            !data.subscription.canAccessPlatform &&
            status === "authenticated"
          ) {
            router.push(redirectTo);
          }
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [
    status,
    session?.user && "id" in session.user
      ? (session.user as { id: string }).id
      : null,
    router,
    redirectTo,
  ]); // Use specific session.user.id instead of entire session object

  // Show loading state only when NextAuth is loading or when we're checking subscription for authenticated users
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {status === "loading"
              ? "Loading..."
              : "Checking subscription status..."}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to sign-in page
  if (status === "unauthenticated" || !session) {
    router.push(redirectTo);
    return null;
  }

  // Subscription status not loaded yet for authenticated users
  if (status === "authenticated" && !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  // User can access platform (admin or has active subscription)
  if (subscriptionStatus?.canAccessPlatform) {
    return <>{children}</>;
  }

  // User cannot access platform - show fallback or redirect
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback - redirect to pricing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Required
        </h2>
        <p className="text-gray-600 mb-6">
          You need an active subscription to access this feature.
          {subscriptionStatus?.status === "past_due" &&
            " Your subscription payment failed."}
          {subscriptionStatus?.status === "canceled" &&
            " Your subscription has been canceled."}
        </p>
        <button
          onClick={() => router.push(redirectTo)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );
}
