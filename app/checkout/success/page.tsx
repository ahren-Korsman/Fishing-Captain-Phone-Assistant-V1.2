"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, AlertTriangle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  canAccessPlatform: boolean;
  isAdmin: boolean;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  priceId?: string;
  lastUpdated?: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const sessionId = searchParams.get("session_id");
  const maxAttempts = 20; // 40 seconds total (2 second intervals)

  useEffect(() => {
    if (!sessionId) {
      setError(
        "No session ID found. Please contact support if you completed payment."
      );
      setLoading(false);
      return;
    }

    console.log(
      "🔍 DEBUG: Checkout success page loaded with session_id:",
      sessionId
    );

    // Start polling for subscription status
    const pollSubscription = async () => {
      setPolling(true);
      let currentAttempts = 0;

      const checkSubscription = async () => {
        try {
          console.log(
            `🔍 DEBUG: Checking subscription status... attempt ${
              currentAttempts + 1
            }/${maxAttempts}`
          );

          const response = await fetch("/api/stripe/subscription-status");
          const data = await response.json();

          console.log("🔍 DEBUG: Subscription status API response:", data);

          if (data.success) {
            setSubscriptionStatus(data.subscription);

            // Check if user can now access the platform
            if (data.subscription.canAccessPlatform) {
              console.log(
                "✅ DEBUG: Subscription is now active! Redirecting to onboarding..."
              );
              setPolling(false);
              setLoading(false);
              // Redirect to onboarding page
              router.push("/onboarding");
              return;
            }
          }

          currentAttempts++;
          setAttempts(currentAttempts);

          if (currentAttempts < maxAttempts) {
            // Continue polling
            setTimeout(checkSubscription, 2000);
          } else {
            // Timeout reached
            console.log(
              "⚠️ DEBUG: Timeout waiting for subscription activation"
            );
            setPolling(false);
            setLoading(false);
            setError(
              "Subscription activation is taking longer than expected. Please contact support if this continues."
            );
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
          currentAttempts++;
          setAttempts(currentAttempts);

          if (currentAttempts < maxAttempts) {
            setTimeout(checkSubscription, 2000);
          } else {
            setPolling(false);
            setLoading(false);
            setError(
              "Failed to verify subscription status. Please contact support."
            );
          }
        }
      };

      // Start the polling
      checkSubscription();
    };

    // Initial check before starting polling
    const initialCheck = async () => {
      try {
        const response = await fetch("/api/stripe/subscription-status");
        const data = await response.json();

        if (data.success && data.subscription.canAccessPlatform) {
          console.log(
            "✅ DEBUG: Subscription already active! Redirecting immediately..."
          );
          router.push("/onboarding");
          return;
        }

        // Start polling if not already active
        pollSubscription();
      } catch (error) {
        console.error("Error in initial subscription check:", error);
        setError(
          "Failed to check subscription status. Please contact support."
        );
        setLoading(false);
      }
    };

    initialCheck();
  }, [sessionId, router]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                Payment Successful!
              </CardTitle>
              <CardDescription className="text-lg">
                Thank you for your subscription. We&apos;re setting up your
                account...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 mb-4">
                Processing your subscription...
              </p>
              {polling && (
                <div className="text-sm text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Attempt {attempts} of {maxAttempts}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-xl text-yellow-800">
                Processing Issue
              </CardTitle>
              <CardDescription className="text-base">{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Don&apos;t worry - your payment was successful. This is just a
                temporary delay in account activation.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500 mb-1">
                  Session ID for support:
                </p>
                <p className="text-xs text-gray-700 break-all font-mono">
                  {sessionId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  // This should not be reached due to the redirect logic above, but just in case
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Ready to Continue!
            </CardTitle>
            <CardDescription className="text-lg">
              Your subscription is active. Let&apos;s complete your setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/onboarding" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">
                Complete Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-800">
                  Loading...
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              </CardContent>
            </Card>
          </div>
        </ProtectedRoute>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
