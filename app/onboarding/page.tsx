"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import ProtectedRoute from "@/components/auth/protected-route";
import SubscriptionCheck from "@/components/auth/subscription-check";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Phone,
  Ship,
  Clock,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { LiveVoicemailModal } from "@/components/ui/live-voicemail-modal";
import { formatPhoneNumber, formatPhoneNumberForForwarding } from "@/lib/utils";

interface CarrierInfo {
  success: boolean;
  phoneNumber: string;
  carrier: {
    name: string | null;
    type: string | null;
    country: string;
    mobileCountryCode?: string;
    mobileNetworkCode?: string;
  };
  callForwarding: {
    supported: boolean;
    code?: string;
    description?: string;
    steps?: string[];
    disableCode?: string;
    conditionalCodes?: {
      busy?: string;
      noAnswer?: string;
      unreachable?: string;
    };
    notes?: string[];
    fishingCaptainGuidance?: {
      recommended: string;
      explanation: string;
      alternative: string;
    };
  };
  message: string;
  isMock?: boolean;
  error?: string;
  details?: string;
  availableCarriers?: string[];
}

interface PurchaseResult {
  purchase: {
    phoneNumber: string;
    cost: string;
    monthlyRate: string;
    sid: string;
    capabilities: {
      voice: boolean;
      sms: boolean;
      mms: boolean;
      fax: boolean;
    };
    webhook: {
      url: string;
      configured: boolean;
    };
    safetyMode?: boolean;
  };
}

interface AssistantResult {
  assistant: {
    name: string;
  };
  vapiAssistant?: {
    id: string;
  };
}

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [waitingForSubscription, setWaitingForSubscription] = useState(false);
  const [captainData, setCaptainData] = useState<{
    captainName: string;
    businessName: string;
    phoneNumber: string;
    email: string;
    location: string;
    seasonalInfo: string;
    tripTypes: string[];
    boatInfo: string;
    pricingInfo: string;
    customInstructions: string;
    smsOptIn: boolean;
  }>({
    captainName: "",
    businessName: "",
    phoneNumber: "",
    email: "",
    location: "",
    seasonalInfo: "",
    tripTypes: [],
    boatInfo: "",
    pricingInfo: "",
    customInstructions: "",
    smsOptIn: true,
  });

  const [carrierInfo, setCarrierInfo] = useState<CarrierInfo | null>(null);
  const [manualCarrierSelection, setManualCarrierSelection] =
    useState<string>("");
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(
    null
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [assistantResult, setAssistantResult] =
    useState<AssistantResult | null>(null);

  // List of supported carriers for manual selection (only the 4 main carriers with accurate codes)
  const supportedCarriers = ["Verizon", "AT&T", "T-Mobile", "US Cellular"];
  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Handle Stripe session_id parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (sessionId) {
      console.log("🔍 DEBUG: Stripe session_id found:", sessionId);

      // First check if user already has an active subscription
      const checkExistingSubscription = async () => {
        try {
          const response = await fetch("/api/stripe/subscription-status");
          const data = await response.json();

          console.log("🔍 DEBUG: Initial subscription check:", data);

          if (data.success && data.subscription.hasActiveSubscription) {
            console.log(
              "✅ DEBUG: User already has active subscription, skipping polling"
            );
            setWaitingForSubscription(false);
            return;
          }

          // Only start polling if subscription is not active
          setWaitingForSubscription(true);

          // Poll for subscription status every 2 seconds for up to 30 seconds
          const pollSubscription = async () => {
            let attempts = 0;
            const maxAttempts = 15; // 30 seconds total

            const checkSubscription = async () => {
              try {
                const response = await fetch("/api/stripe/subscription-status");
                const data = await response.json();

                console.log(
                  "🔍 DEBUG: Subscription status API response:",
                  data
                );

                if (data.success && data.subscription.hasActiveSubscription) {
                  console.log("✅ DEBUG: Subscription is now active!");
                  // Refresh the NextAuth session to get updated subscription status
                  await updateSession();
                  setWaitingForSubscription(false);
                  return true;
                }

                attempts++;
                if (attempts < maxAttempts) {
                  console.log(
                    `🔍 DEBUG: Waiting for subscription... attempt ${attempts}/${maxAttempts}`
                  );
                  setTimeout(checkSubscription, 2000);
                } else {
                  console.log("⚠️ DEBUG: Timeout waiting for subscription");
                  setWaitingForSubscription(false);
                }

                return false;
              } catch (error) {
                console.error("Error checking subscription:", error);
                attempts++;
                if (attempts < maxAttempts) {
                  setTimeout(checkSubscription, 2000);
                } else {
                  setWaitingForSubscription(false);
                }
                return false;
              }
            };

            checkSubscription();
          };

          pollSubscription();
        } catch (error) {
          console.error("Error checking existing subscription:", error);
          setWaitingForSubscription(false);
        }
      };

      checkExistingSubscription();
    }
  }, [updateSession]);

  // Helper function to get the correct forwarding code based on user preference and carrier
  const getForwardingCode = (
    forwardType: string,
    carrierInfo: CarrierInfo | null
  ) => {
    if (!carrierInfo?.callForwarding?.supported) {
      return null;
    }

    const { callForwarding } = carrierInfo;

    switch (forwardType) {
      case "all":
        return callForwarding.code;
      case "busy":
        return callForwarding.conditionalCodes?.busy;
      case "noAnswer":
        return callForwarding.conditionalCodes?.noAnswer;
      case "unreachable":
        return callForwarding.conditionalCodes?.unreachable;
      default:
        return callForwarding.code;
    }
  };

  // Helper function to format the forwarding code with the destination number
  const formatForwardingCode = (
    code: string | null | undefined,
    destinationNumber: string
  ) => {
    if (!code) return null;

    // Format the phone number for forwarding codes (preserves country code when needed)
    const formattedDestination = formatPhoneNumberForForwarding(
      destinationNumber,
      code
    );

    // Handle different carrier formats
    if (code.includes("*21*")) {
      // AT&T format: *21*[number]#
      return `${code}${formattedDestination}#`;
    } else if (code.includes("**21*")) {
      // T-Mobile format: **21*1[number]# (requires 1 prefix)
      return `${code}${formattedDestination}#`;
    } else if (
      code.includes("*67*") ||
      code.includes("*61*") ||
      code.includes("*62*")
    ) {
      // AT&T conditional format: *67*[number]#
      return `${code}${formattedDestination}#`;
    } else if (
      code.includes("**67*") ||
      code.includes("**61*") ||
      code.includes("**62*")
    ) {
      // T-Mobile conditional format: **67*1[number]# (requires 1 prefix)
      return `${code}${formattedDestination}#`;
    } else {
      // Verizon/US Cellular format: *72[number] (no #)
      return `${code}${formattedDestination}`;
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setCaptainData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTripTypeToggle = (tripType: string) => {
    setCaptainData((prev) => ({
      ...prev,
      tripTypes: prev.tripTypes.includes(tripType)
        ? prev.tripTypes.filter((t) => t !== tripType)
        : [...prev.tripTypes, tripType],
    }));
  };

  const handleCarrierLookup = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/twilio/carrier-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: captainData.phoneNumber }),
      });

      const data = await response.json();
      if (data.success) {
        setCarrierInfo(data);
        // Don't automatically advance to step 3 - let user click "Get My Business Number"
      } else {
        // Carrier detection failed, show manual selection
        setCarrierInfo(data);
      }
    } catch (error) {
      console.error("Carrier lookup failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCarrierSelection = (selectedCarrier: string) => {
    setManualCarrierSelection(selectedCarrier);

    // Get forwarding instructions for the selected carrier
    fetch("/api/twilio/carrier-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: captainData.phoneNumber,
        manualCarrier: selectedCarrier,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setCarrierInfo(data);
        }
      })
      .catch((error) => {
        console.error("Failed to get forwarding instructions:", error);
      });
  };

  const handleNumberSearch = async () => {
    setLoading(true);
    try {
      // First, register the captain to get a captain ID
      const captainResponse = await fetch("/api/captains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...captainData,
          // @ts-expect-error - session.user.id is added by auth callback
          userId: session?.user?.id, // Link to authenticated user
        }),
      });

      const captainData_result = await captainResponse.json();
      if (!captainData_result.success) {
        throw new Error(
          captainData_result.error || "Failed to register captain"
        );
      }

      const captainId = captainData_result.captain.id;

      // Extract area code from phone number
      const areaCode = captainData.phoneNumber.replace(/\D/g, "").slice(1, 4);

      // Auto-purchase the first available number
      const response = await fetch("/api/twilio/purchase-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaCode, captainId }),
      });

      const data = await response.json();
      if (data.success) {
        setPurchaseResult(data);
        // Create assistant and complete setup
        await handleCompleteSetup(captainId, data);
      } else {
        throw new Error(data.error || "Failed to purchase number");
      }
    } catch (error) {
      console.error("Auto-purchase failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async (
    captainId: string,
    purchaseData?: PurchaseResult
  ) => {
    try {
      console.log("🚀 Starting complete setup with VAPI integration...");

      // Step 1: Create VAPI assistant first
      console.log("🤖 Step 1: Creating VAPI assistant...");
      const assistantResponse = await fetch("/api/vapi/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...captainData,
          captainId: captainId,
        }),
      });

      if (assistantResponse.ok) {
        const assistantData = await assistantResponse.json();

        // Step 2: Save assistant ID to Captain record
        if (assistantData.vapiAssistant?.id) {
          try {
            console.log("💾 Step 2: Saving assistant ID to Captain record...");
            const updateResponse = await fetch(
              "/api/captains/update-assistant",
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  captainId: captainId,
                  vapiAssistantId: assistantData.vapiAssistant.id,
                }),
              }
            );

            if (updateResponse.ok) {
              console.log("✅ Assistant ID saved to Captain record");
            } else {
              console.warn("⚠️ Failed to save assistant ID to Captain record");
            }
          } catch (updateError) {
            console.warn("⚠️ Error saving assistant ID:", updateError);
          }
        }

        // Step 3: Import Twilio number to VAPI and assign to assistant
        if (assistantData.vapiAssistant?.id) {
          try {
            console.log(
              "📞 Step 3: Importing Twilio number to VAPI and assigning to assistant..."
            );
            const vapiPhoneResponse = await fetch("/api/vapi/phone-number", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                twilioNumber: purchaseData?.purchase?.phoneNumber,
                captainId: captainId,
                assistantId: assistantData.vapiAssistant.id,
              }),
            });

            if (vapiPhoneResponse.ok) {
              const vapiPhoneData = await vapiPhoneResponse.json();
              console.log(
                "✅ Twilio number imported to VAPI and assigned to assistant:",
                vapiPhoneData.vapiPhoneNumberId
              );
            } else {
              const errorData = await vapiPhoneResponse.json();
              console.error("❌ VAPI phone number import failed:", errorData);
              throw new Error(
                `VAPI import failed: ${errorData.error || "Unknown error"}`
              );
            }
          } catch (vapiError) {
            console.error("❌ VAPI phone number import error:", vapiError);
            throw new Error(
              `VAPI import failed: ${
                vapiError instanceof Error ? vapiError.message : "Unknown error"
              }`
            );
          }
        }

        setAssistantResult(assistantData);
        setCurrentStep(3);
      } else {
        console.error("❌ Failed to create VAPI assistant");
        const errorData = await assistantResponse.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Setup completion failed:", error);
    }
  };

  return (
    <ProtectedRoute>
      <SubscriptionCheck>
        {/* Show loading state while waiting for subscription to be processed */}
        {waitingForSubscription ? (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Processing Your Subscription
              </h2>
              <p className="text-gray-600">
                Please wait while we activate your account...
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
            {/* Navigation */}
            <nav className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    CaptainAI
                  </span>
                </Link>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 pb-12">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant Setup
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Get Your AI Assistant Ready
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  In just a few minutes, you&apos;ll have a 24/7 AI assistant
                  handling your customer calls
                </p>

                {/* Progress Bar */}
                <div className="mt-8 max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress
                    </span>
                    <span className="text-sm text-gray-500">
                      {currentStep} of {totalSteps}
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center mt-8 space-x-4">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div key={i} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          i + 1 < currentStep
                            ? "bg-green-500 text-white"
                            : i + 1 === currentStep
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {i + 1 < currentStep ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      {i < totalSteps - 1 && (
                        <div
                          className={`w-8 h-1 mx-2 ${
                            i + 1 < currentStep ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <Card className="mb-6 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Ship className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          Tell us about your fishing business
                        </CardTitle>
                        <CardDescription className="text-lg">
                          This information will personalize your AI assistant to
                          sound authentic
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Basic Information Section */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="captainName"
                            className="text-base font-medium"
                          >
                            Captain Name
                          </Label>
                          <Input
                            id="captainName"
                            placeholder="Captain Charlie"
                            value={captainData.captainName}
                            onChange={(e) =>
                              handleInputChange("captainName", e.target.value)
                            }
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="businessName"
                            className="text-base font-medium"
                          >
                            Business Name
                          </Label>
                          <Input
                            id="businessName"
                            placeholder="Gulf Coast Charters"
                            value={captainData.businessName}
                            onChange={(e) =>
                              handleInputChange("businessName", e.target.value)
                            }
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="phoneNumber"
                            className="text-base font-medium"
                          >
                            Your Phone Number
                          </Label>
                          <Input
                            id="phoneNumber"
                            placeholder="+1 (555) 123-4567"
                            value={captainData.phoneNumber}
                            onChange={(e) =>
                              handleInputChange("phoneNumber", e.target.value)
                            }
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="email"
                            className="text-base font-medium"
                          >
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="captain@gulfcoastcharters.com"
                            value={captainData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="location"
                          className="text-base font-medium"
                        >
                          Fishing Location
                        </Label>
                        <Input
                          id="location"
                          placeholder="Gulf Coast, Alabama"
                          value={captainData.location}
                          onChange={(e) =>
                            handleInputChange("location", e.target.value)
                          }
                          className="h-12"
                        />
                      </div>
                    </div>

                    {/* Business Details Section */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="seasonalInfo"
                          className="text-base font-medium"
                        >
                          Seasonal Fishing Info
                        </Label>
                        <Textarea
                          id="seasonalInfo"
                          placeholder="Peak season April-October. Red snapper and grouper are hot in summer. Fall brings great king mackerel fishing."
                          value={captainData.seasonalInfo}
                          onChange={(e) =>
                            handleInputChange("seasonalInfo", e.target.value)
                          }
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          Trip Types You Offer
                        </Label>
                        <div className="flex flex-wrap gap-3">
                          {[
                            "inshore",
                            "offshore",
                            "deep-sea",
                            "fly-fishing",
                            "family-friendly",
                          ].map((type) => (
                            <Badge
                              key={type}
                              variant={
                                captainData.tripTypes.includes(type)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer px-4 py-2 text-sm"
                              onClick={() => handleTripTypeToggle(type)}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="boatInfo"
                          className="text-base font-medium"
                        >
                          Boat Information
                        </Label>
                        <Textarea
                          id="boatInfo"
                          placeholder="32ft center console, up to 6 passengers, fully equipped with GPS, fishfinder, and safety gear"
                          value={captainData.boatInfo}
                          onChange={(e) =>
                            handleInputChange("boatInfo", e.target.value)
                          }
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="pricingInfo"
                          className="text-base font-medium"
                        >
                          Pricing Information
                        </Label>
                        <Textarea
                          id="pricingInfo"
                          placeholder="Half day trips start at $800, full day $1200. Group discounts available for 4+ people."
                          value={captainData.pricingInfo}
                          onChange={(e) =>
                            handleInputChange("pricingInfo", e.target.value)
                          }
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>

                    {/* Additional Settings Section */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="customInstructions"
                          className="text-base font-medium"
                        >
                          Special Instructions for AI
                        </Label>
                        <Textarea
                          id="customInstructions"
                          placeholder="Always mention our group discounts and that we provide all tackle and bait."
                          value={captainData.customInstructions}
                          onChange={(e) =>
                            handleInputChange(
                              "customInstructions",
                              e.target.value
                            )
                          }
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          SMS Notifications
                        </Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="smsOptIn"
                            checked={captainData.smsOptIn}
                            onChange={(e) =>
                              handleInputChange("smsOptIn", e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <Label
                            htmlFor="smsOptIn"
                            className="text-base cursor-pointer"
                          >
                            Send me SMS notifications when customers call
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600">
                          You&apos;ll receive text messages when customers call
                          your business number
                        </p>
                      </div>
                    </div>

                    <div className="pt-6">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                        disabled={
                          !captainData.captainName ||
                          !captainData.businessName ||
                          !captainData.phoneNumber ||
                          !captainData.email ||
                          !captainData.location
                        }
                      >
                        Continue to Carrier Detection
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Carrier Detection */}
              {currentStep === 2 && (
                <Card className="mb-6 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          Carrier Detection
                        </CardTitle>
                        <CardDescription className="text-lg">
                          We&apos;ll detect your phone carrier to ensure
                          compatibility
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-800 text-sm mb-2">
                        <strong>Your Phone:</strong>{" "}
                        {formatPhoneNumber(captainData.phoneNumber)}
                      </p>
                      <p className="text-blue-800 text-sm mb-2">
                        <strong>Forwarding Method:</strong> Conditional
                        forwarding when no answer
                      </p>
                      <p className="text-blue-600 text-sm mb-3">
                        We&apos;ll check your carrier to ensure call forwarding
                        is supported and provide the correct dialing code.
                      </p>
                    </div>

                    {carrierInfo ? (
                      carrierInfo.success ? (
                        <div
                          className={`p-4 rounded-lg border ${
                            carrierInfo.callForwarding?.supported
                              ? "bg-green-50 border-green-200"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle
                              className={`w-5 h-5 ${
                                carrierInfo.callForwarding?.supported
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            />
                            <span
                              className={`font-semibold ${
                                carrierInfo.callForwarding?.supported
                                  ? "text-green-800"
                                  : "text-yellow-800"
                              }`}
                            >
                              Carrier Detected:{" "}
                              {carrierInfo?.carrier?.name || "Unknown"}
                            </span>
                            {carrierInfo.isMock && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Demo Mode
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm ${
                              carrierInfo.callForwarding?.supported
                                ? "text-green-700"
                                : "text-yellow-700"
                            }`}
                          >
                            {carrierInfo.callForwarding?.supported
                              ? "Perfect! Call forwarding is supported for your carrier."
                              : "Call forwarding may not be supported for this carrier type."}
                          </p>

                          {carrierInfo.callForwarding?.supported ? (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <p className="text-sm text-green-700">
                                ✅ Call forwarding is supported for your
                                carrier. We&apos;ll provide the exact dialing
                                code after you get your business number.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-yellow-800 text-sm">
                                ⚠️ <strong>Note:</strong> Your carrier may not
                                support call forwarding. You can still proceed,
                                but you may need to contact your carrier for
                                setup assistance.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Manual carrier selection when automatic detection fails
                        <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <span className="font-semibold text-yellow-800">
                              Carrier Detection Failed
                            </span>
                          </div>
                          <p className="text-yellow-700 text-sm mb-4">
                            We couldn&apos;t automatically detect your carrier.
                            Please select your carrier from the list below:
                          </p>
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                            <p className="text-blue-800 text-sm">
                              💡 <strong>Not sure which to pick?</strong> If
                              you&apos;re on Cricket, Mint, Boost, or other
                              smaller carriers, select the main carrier they
                              use: <strong>Cricket → AT&T</strong>,{" "}
                              <strong>Mint → T-Mobile</strong>,
                              <strong>Boost → T-Mobile</strong>,{" "}
                              <strong>Visible → Verizon</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-2 italic text-center">
                              💡 Dial exactly as shown above (no spaces or
                              dashes)
                            </p>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">
                              Select Your Carrier
                            </Label>
                            <Select
                              value={manualCarrierSelection}
                              onValueChange={handleManualCarrierSelection}
                            >
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Choose your carrier..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(
                                  carrierInfo.availableCarriers ||
                                  supportedCarriers
                                ).map((carrier) => {
                                  // Add helpful descriptions for common MVNOs
                                  const carrierDescriptions: Record<
                                    string,
                                    string
                                  > = {
                                    "AT&T":
                                      "AT&T (also works for Cricket, Consumer Cellular, Red Pocket, H2O Wireless)",
                                    "T-Mobile":
                                      "T-Mobile (also works for Mint, Metro, Boost, Virgin Mobile, Google Fi)",
                                    Verizon:
                                      "Verizon (also works for Visible, Straight Talk, TracFone, Total Wireless)",
                                    "US Cellular": "US Cellular",
                                  };

                                  return (
                                    <SelectItem key={carrier} value={carrier}>
                                      <div>
                                        <div className="font-medium">
                                          {carrier}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {carrierDescriptions[carrier] ||
                                            carrier}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )
                    ) : (
                      <Button
                        onClick={handleCarrierLookup}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                        disabled={loading}
                      >
                        {loading ? "Detecting..." : "Detect My Carrier"}
                      </Button>
                    )}

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleNumberSearch}
                        disabled={
                          !carrierInfo ||
                          (carrierInfo.success === false &&
                            !manualCarrierSelection) ||
                          loading
                        }
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loading
                          ? "Getting Your Number..."
                          : "Get My Business Number"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Complete Setup */}
              {currentStep === 3 && purchaseResult && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>🎉 Setup Complete!</CardTitle>
                    <CardDescription>
                      Your AI assistant is ready to handle customer calls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">
                        ✅ Your Business Number:
                      </h3>
                      <p className="font-mono text-lg">
                        {formatPhoneNumber(purchaseResult.purchase.phoneNumber)}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-purple-800">
                            Call Forwarding Instructions
                          </h3>
                          <p className="text-purple-600">
                            Forward calls from your existing number
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-gray-700">
                            To forward calls from your existing number (
                            {formatPhoneNumber(captainData.phoneNumber)}) to
                            your new business number, dial the following code
                            from your phone:
                          </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            No Answer Forwarding (Automatic):
                          </p>
                          <div className="bg-white p-3 rounded border">
                            <p className="font-mono text-lg text-blue-700">
                              {(() => {
                                // Always use no-answer conditional forwarding
                                const baseCode = getForwardingCode(
                                  "noAnswer",
                                  carrierInfo
                                );
                                const formattedCode = formatForwardingCode(
                                  baseCode,
                                  purchaseResult.purchase.phoneNumber
                                );
                                return (
                                  formattedCode ||
                                  `${baseCode}${purchaseResult.purchase.phoneNumber
                                    .replace(/\D/g, "")
                                    .replace(/^1/, "")}`
                                );
                              })()}
                            </p>
                            <p className="text-xs text-gray-500 mt-2 italic text-center">
                              💡 Dial exactly as shown above (no spaces or
                              dashes)
                            </p>
                          </div>

                          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-center">
                            <p className="text-xs text-gray-600">
                              <strong>To disable:</strong> Dial{" "}
                              {carrierInfo?.callForwarding?.disableCode} when
                              you return to shore
                            </p>
                          </div>
                        </div>

                        {/* iOS Live Voicemail Warning */}
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                              <p className="text-sm text-orange-800">
                                <strong>iPhone Users:</strong> iOS 18 Live
                                Voicemail can block call forwarding. Turn it off
                                before using these codes.
                              </p>
                            </div>
                            <LiveVoicemailModal>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-700 border-orange-300 hover:bg-orange-100"
                              >
                                View Instructions
                              </Button>
                            </LiveVoicemailModal>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <strong>💡 How It Works:</strong> Customers call your
                          existing number (
                          {formatPhoneNumber(captainData.phoneNumber)}
                          ). When you don&apos;t answer, calls automatically
                          forward to your business number (
                          {formatPhoneNumber(
                            purchaseResult.purchase.phoneNumber
                          )}
                          ) which connects them to your AI assistant. Your
                          personal phone still rings normally when you&apos;re
                          available!
                        </p>
                      </div>

                      <ol className="list-decimal list-inside space-y-1 text-gray-800 mt-3 text-sm">
                        <li>
                          Pick up your phone (
                          {formatPhoneNumber(captainData.phoneNumber)})
                        </li>
                        <li>Dial the code above</li>
                        <li>Hang up when you hear the confirmation tone</li>
                      </ol>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Phone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-blue-800">
                            Ready to Test!
                          </h3>
                          <p className="text-blue-600">
                            Your AI assistant is live and ready
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <p className="text-gray-700 mb-2">
                          Once call forwarding is active, customers calling
                        </p>
                        <p className="text-2xl font-bold text-blue-800 font-mono mb-2">
                          {formatPhoneNumber(captainData.phoneNumber)}
                        </p>
                        <p className="text-gray-700">
                          will reach your AI assistant, even when you&apos;re on
                          the water!
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Link href="/dashboard" className="w-full">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                          View Dashboard
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </SubscriptionCheck>
    </ProtectedRoute>
  );
}
