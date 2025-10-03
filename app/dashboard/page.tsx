"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import SubscriptionCheck from "@/components/auth/subscription-check";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Clock,
  User,
  Calendar,
  Filter,
  Search,
  MessageSquare,
  Bot,
  User as UserIcon,
  Settings,
  AlertTriangle,
  LogOut,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { LiveVoicemailModal } from "@/components/ui/live-voicemail-modal";
import { signOut } from "next-auth/react";
import { formatPhoneNumber } from "@/lib/utils";

interface Call {
  _id: string;
  callId: string;
  captainId: {
    captainName: string;
    businessName: string;
  };
  customerPhone: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  cost?: number;
  transcript?: string;
  customerData?: {
    customerName?: string;
    phoneNumber?: string;
    email?: string;
    preferredDates?: string[];
    partySize?: number;
    tripType?: string;
    experience?: string;
    specialRequests?: string;
    callbackRequested?: boolean;
    urgency?: string;
  };
}

interface Customer {
  _id: string;
  captainId: {
    captainName: string;
    businessName: string;
  };
  customerName: string;
  phoneNumber: string;
  email?: string;
  totalCalls: number;
  lastCallDate: string;
  status: string;
  tripType?: string;
  partySize?: number;
  callbackRequested: boolean;
  urgency: string;
}

export default function DashboardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "calls" | "customers" | "forwarding" | "settings"
  >("calls");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [carrierInfo, setCarrierInfo] = useState<{
    success: boolean;
    carrier: { name: string };
    callForwarding: { code: string; disableCode: string };
  } | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<{
    purchase: { phoneNumber: string };
  } | null>(null);
  const [smsPreferences, setSmsPreferences] = useState<{
    smsOptIn: boolean;
    captainName: string;
  } | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [captainInfoLoaded, setCaptainInfoLoaded] = useState(false);
  const [smsPreferencesLoaded, setSmsPreferencesLoaded] = useState(false);

  const fetchCaptainInfo = useCallback(async () => {
    try {
      // Get session to get user ID
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (session?.user as any)?.id;
      if (!userId) {
        console.error("No user session found");
        return;
      }

      // Fetch captain information filtered by user ID
      const response = await fetch(`/api/captains?userId=${userId}`);
      const data = await response.json();
      if (data.success && data.captains.length > 0) {
        const captain = data.captains[0]; // Get the captain for current user

        // Fetch carrier information
        const carrierResponse = await fetch("/api/twilio/carrier-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: captain.phoneNumber }),
        });
        const carrierData = await carrierResponse.json();
        if (carrierData.success) {
          setCarrierInfo(carrierData);
        }

        // Set purchase result if captain has a Twilio number
        if (captain.twilioNumber) {
          setPurchaseResult({
            purchase: {
              phoneNumber: captain.twilioNumber.phoneNumber,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching captain info:", error);
    }
  }, []);

  const fetchSmsPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/captains/sms-preferences");
      const data = await response.json();
      if (data.success) {
        setSmsPreferences({
          smsOptIn: data.smsOptIn,
          captainName: data.captainName,
        });
      }
    } catch (error) {
      console.error("Error fetching SMS preferences:", error);
    }
  }, []);

  const updateSmsPreferences = async (smsOptIn: boolean) => {
    setSmsLoading(true);
    try {
      const response = await fetch("/api/captains/sms-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsOptIn }),
      });

      const data = await response.json();
      if (data.success) {
        setSmsPreferences((prev) =>
          prev
            ? { ...prev, smsOptIn: data.smsOptIn }
            : {
                smsOptIn: data.smsOptIn,
                captainName: data.captainName,
              }
        );
        console.log(
          `SMS notifications ${data.smsOptIn ? "enabled" : "disabled"} for ${
            data.captainName
          }`
        );

        // Refresh SMS preferences to ensure UI is in sync
        if (!smsPreferencesLoaded) {
          fetchSmsPreferences();
        }
      } else {
        console.error("Failed to update SMS preferences:", data.error);
      }
    } catch (error) {
      console.error("Error updating SMS preferences:", error);
    } finally {
      setSmsLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get session to get user ID
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (session?.user as any)?.id;
      if (!userId) {
        console.error("No user session found");
        setLoading(false);
        return;
      }

      // Get captain ID for current user
      const captainResponse = await fetch(`/api/captains?userId=${userId}`);
      const captainData = await captainResponse.json();

      if (!captainData.success || captainData.captains.length === 0) {
        console.error("No captain found for user");
        setLoading(false);
        return;
      }

      const captainId = captainData.captains[0].id;

      if (activeTab === "calls") {
        const response = await fetch(
          `/api/calls?page=${currentPage}&limit=20&status=${
            statusFilter === "all" ? "" : statusFilter
          }&captainId=${captainId}`
        );
        const data = await response.json();
        if (data.success) {
          setCalls(data.calls);
          setTotalPages(data.pagination.pages);
        }
      } else {
        const response = await fetch(
          `/api/customers?page=${currentPage}&limit=20&status=${
            statusFilter === "all" ? "" : statusFilter
          }&search=${searchTerm}&captainId=${captainId}`
        );
        const data = await response.json();
        if (data.success) {
          setCustomers(data.customers);
          setTotalPages(data.pagination.pages);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, statusFilter, searchTerm]);

  // Main data fetching - only when tab-specific data changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Captain info (carrier lookup) - only when visiting forwarding tab
  useEffect(() => {
    if (activeTab === "forwarding" && !captainInfoLoaded) {
      fetchCaptainInfo();
      setCaptainInfoLoaded(true);
    }
  }, [activeTab, captainInfoLoaded, fetchCaptainInfo]);

  // SMS preferences - only when visiting settings tab
  useEffect(() => {
    if (activeTab === "settings" && !smsPreferencesLoaded) {
      fetchSmsPreferences();
      setSmsPreferencesLoaded(true);
    }
  }, [activeTab, smsPreferencesLoaded, fetchSmsPreferences]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "booked":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleTranscript = (callId: string) => {
    setExpandedCallId(expandedCallId === callId ? null : callId);
  };

  // Parse transcript into individual messages
  const parseTranscript = (transcript: string) => {
    if (!transcript) return [];

    const lines = transcript.split("\n").filter((line) => line.trim());
    const messages: Array<{
      speaker: "Assistant" | "Customer";
      content: string;
    }> = [];

    let currentSpeaker: "Assistant" | "Customer" | null = null;
    let currentContent = "";

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("Assistant:")) {
        // Save previous message if exists
        if (
          currentSpeaker &&
          currentContent &&
          currentContent.trim() !== "undefined"
        ) {
          messages.push({
            speaker: currentSpeaker,
            content: currentContent.trim(),
          });
        }

        // Start new assistant message
        currentSpeaker = "Assistant";
        currentContent = trimmedLine.replace("Assistant:", "").trim();
      } else if (trimmedLine.startsWith("Customer:")) {
        // Save previous message if exists
        if (
          currentSpeaker &&
          currentContent &&
          currentContent.trim() !== "undefined"
        ) {
          messages.push({
            speaker: currentSpeaker,
            content: currentContent.trim(),
          });
        }

        // Start new customer message
        currentSpeaker = "Customer";
        currentContent = trimmedLine.replace("Customer:", "").trim();
      } else if (currentSpeaker && trimmedLine) {
        // Continue current message
        currentContent += " " + trimmedLine;
      }
    });

    // Add the last message (only if it's not "undefined")
    if (
      currentSpeaker &&
      currentContent &&
      currentContent.trim() !== "undefined"
    ) {
      messages.push({
        speaker: currentSpeaker,
        content: currentContent.trim(),
      });
    }

    return messages;
  };

  // Transcript display component
  const TranscriptDisplay = ({ transcript }: { transcript: string }) => {
    const messages = parseTranscript(transcript);

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              message.speaker === "Assistant" ? "justify-start" : "justify-end"
            }`}
          >
            {message.speaker === "Assistant" && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            )}

            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.speaker === "Assistant"
                  ? "bg-blue-100 text-blue-900"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="mb-1">
                <span
                  className={`text-xs font-medium ${
                    message.speaker === "Assistant"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {message.speaker === "Assistant" ? "Assistant" : "Customer"}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>

            {message.speaker === "Customer" && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <SubscriptionCheck>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      CaptainAI
                    </span>
                  </Link>
                  <div className="ml-8 flex space-x-8">
                    <Link
                      href="/dashboard"
                      className="text-blue-600 border-b-2 border-blue-600 px-1 pt-1 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Monitor your AI assistant calls and customer interactions
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("calls")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "calls"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Phone className="w-4 h-4 inline mr-2" />
                    Call History
                  </button>
                  <button
                    onClick={() => setActiveTab("customers")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "customers"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Customers
                  </button>
                  <button
                    onClick={() => setActiveTab("forwarding")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "forwarding"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Call Forwarding
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "settings"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 inline mr-2" />
                    Settings
                  </button>
                </nav>
              </div>
            </div>

            {/* Filters */}
            {activeTab !== "forwarding" && activeTab !== "settings" && (
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {activeTab === "calls" ? (
                      <>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={fetchData} variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === "forwarding" ? (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-blue-800">
                      Call Forwarding Codes
                    </h2>
                    <p className="text-blue-600">
                      Quick reference for activating and deactivating call
                      forwarding
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Activation Code */}
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      Activate Call Forwarding
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        When going offshore:
                      </p>
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-lg font-mono font-bold text-gray-800">
                          {carrierInfo?.callForwarding?.code || "*72"} +{" "}
                          {formatPhoneNumber(
                            purchaseResult?.purchase?.phoneNumber || ""
                          ) || "YOUR_NUMBER"}
                        </p>
                      </div>
                      <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                        <li>Pick up your phone</li>
                        <li>Dial the code above</li>
                        <li>Hang up when you hear confirmation</li>
                      </ol>
                      {carrierInfo?.carrier?.name && (
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>Carrier:</strong> {carrierInfo.carrier.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Deactivation Code */}
                  <div className="bg-white p-4 rounded-lg border border-red-100">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-red-600 text-sm">⚠</span>
                      </div>
                      Deactivate Call Forwarding
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        When returning to shore:
                      </p>
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="text-lg font-mono font-bold text-red-800">
                          {carrierInfo?.callForwarding?.disableCode || "*73"}
                        </p>
                      </div>
                      <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                        <li>Pick up your phone</li>
                        <li>
                          Dial{" "}
                          {carrierInfo?.callForwarding?.disableCode || "*73"}
                        </li>
                        <li>Hang up when you hear confirmation</li>
                      </ol>
                      {carrierInfo?.carrier?.name && (
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>Carrier:</strong> {carrierInfo.carrier.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* iOS Live Voicemail Warning */}
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        <strong>iPhone Users:</strong> iOS 18 Live Voicemail can
                        block call forwarding. Turn it off before using these
                        codes.
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

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> These codes work for most carriers.
                    If you have a different carrier, check your carrier&apos;s
                    specific codes in your phone settings or contact support.
                  </p>
                </div>
              </div>
            ) : activeTab === "settings" ? (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-green-800">
                      SMS Notifications
                    </h2>
                    <p className="text-green-600">
                      Manage your SMS notification preferences
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Customer Inquiry Notifications
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Receive SMS alerts when customers call your AI assistant
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-500">
                        {smsPreferences?.smsOptIn ? (
                          <span className="text-green-600 font-medium">
                            Enabled
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Disabled
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() =>
                          updateSmsPreferences(!smsPreferences?.smsOptIn)
                        }
                        disabled={smsLoading}
                        variant={
                          smsPreferences?.smsOptIn ? "destructive" : "default"
                        }
                        size="sm"
                      >
                        {smsLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : smsPreferences?.smsOptIn ? (
                          "Disable"
                        ) : (
                          "Enable"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      What you&apos;ll receive:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Customer name and phone number</li>
                      <li>• Trip type and party size</li>
                      <li>• Budget and urgency level</li>
                      <li>• Preferred dates (if provided)</li>
                      <li>• Special requests and callback status</li>
                      <li>• SMS sent from your campaign number</li>
                    </ul>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Important Notes:</p>
                        <ul className="space-y-1">
                          <li>
                            • SMS notifications are sent from the campaign
                            number to your personal phone
                          </li>
                          <li>
                            • Standard SMS rates may apply depending on your
                            carrier
                          </li>
                          <li>• You can disable notifications at any time</li>
                          <li>
                            • Notifications are only sent when customers provide
                            their information
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Unsubscribe Section */}
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Account Management
                    </h4>
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">
                        To unsubscribe from all services and cancel your
                        account, please email:
                      </p>
                      <p className="font-medium text-blue-600">
                        <a
                          href="mailto:ahren@korsman.com?subject=Unsubscribe Request - Fishing Captain AI"
                          className="hover:text-blue-800 underline"
                        >
                          ahren@korsman.com
                        </a>
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Please include your account email address and phone
                        number in your request. We&apos;ll process your
                        cancellation manually and confirm via email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "calls" ? (
              <div className="space-y-4">
                {calls.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No calls found
                      </h3>
                      <p className="text-gray-500">
                        Calls will appear here once customers start calling your
                        AI assistant.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  calls.map((call) => (
                    <Card
                      key={call._id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {call.customerData?.customerName ||
                                  "Unknown Customer"}
                              </h3>
                              <Badge className={getStatusColor(call.status)}>
                                {call.status}
                              </Badge>
                              {call.customerData?.callbackRequested && (
                                <Badge
                                  variant="outline"
                                  className="text-orange-600 border-orange-600"
                                >
                                  Callback Requested
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                {formatPhoneNumber(call.customerPhone)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="w-4 h-4 mr-2" />
                                {formatDate(call.startedAt)}
                              </div>
                              {call.duration && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {formatDuration(call.duration)}
                                </div>
                              )}
                            </div>

                            {call.customerData && (
                              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Customer Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {call.customerData.partySize && (
                                    <div>
                                      Party Size: {call.customerData.partySize}
                                    </div>
                                  )}
                                  {call.customerData.tripType && (
                                    <div>
                                      Trip Type: {call.customerData.tripType}
                                    </div>
                                  )}
                                  {call.customerData.experience && (
                                    <div>
                                      Experience: {call.customerData.experience}
                                    </div>
                                  )}
                                  {call.customerData.urgency && (
                                    <div>
                                      Urgency:{" "}
                                      <Badge
                                        className={getUrgencyColor(
                                          call.customerData.urgency
                                        )}
                                      >
                                        {call.customerData.urgency}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                {call.customerData.preferredDates &&
                                  call.customerData.preferredDates.length >
                                    0 && (
                                    <div className="mt-2 text-sm">
                                      Preferred Dates:{" "}
                                      {call.customerData.preferredDates.join(
                                        ", "
                                      )}
                                    </div>
                                  )}
                                {call.customerData.specialRequests && (
                                  <div className="mt-2 text-sm">
                                    Special Requests:{" "}
                                    {call.customerData.specialRequests}
                                  </div>
                                )}
                              </div>
                            )}

                            {call.transcript && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div
                                  className="flex items-center mb-3 cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors"
                                  onClick={() => toggleTranscript(call._id)}
                                >
                                  <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                                  <h4 className="font-medium text-blue-900">
                                    Call Transcript
                                  </h4>
                                  <div className="ml-auto">
                                    {expandedCallId === call._id ? (
                                      <span className="text-blue-600 text-sm">
                                        Click to collapse
                                      </span>
                                    ) : (
                                      <span className="text-blue-600 text-sm">
                                        Click to expand
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {expandedCallId === call._id ? (
                                  <TranscriptDisplay
                                    transcript={call.transcript}
                                  />
                                ) : (
                                  <div className="text-sm text-blue-800 line-clamp-3 opacity-80">
                                    {call.transcript.substring(0, 200)}...
                                  </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-blue-200">
                                  <div className="text-xs text-blue-600">
                                    {expandedCallId === call._id ? (
                                      <>
                                        Full conversation transcript -{" "}
                                        {
                                          parseTranscript(call.transcript)
                                            .length
                                        }{" "}
                                        messages
                                      </>
                                    ) : (
                                      <>
                                        Preview - {call.transcript.length}{" "}
                                        characters
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {customers.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No customers found
                      </h3>
                      <p className="text-gray-500">
                        Customer information will appear here once they call
                        your AI assistant.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  customers.map((customer) => (
                    <Card
                      key={customer._id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {customer.customerName}
                              </h3>
                              <Badge
                                className={getStatusColor(customer.status)}
                              >
                                {customer.status}
                              </Badge>
                              {customer.callbackRequested && (
                                <Badge
                                  variant="outline"
                                  className="text-orange-600 border-orange-600"
                                >
                                  Callback Requested
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                {formatPhoneNumber(customer.phoneNumber)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="w-4 h-4 mr-2" />
                                {formatDate(customer.lastCallDate)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <User className="w-4 h-4 mr-2" />
                                {customer.totalCalls} call
                                {customer.totalCalls !== 1 ? "s" : ""}
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Customer Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {customer.email && (
                                  <div>Email: {customer.email}</div>
                                )}
                                {customer.partySize && (
                                  <div>Party Size: {customer.partySize}</div>
                                )}
                                {customer.tripType && (
                                  <div>Trip Type: {customer.tripType}</div>
                                )}
                                <div>
                                  Urgency:{" "}
                                  <Badge
                                    className={getUrgencyColor(
                                      customer.urgency
                                    )}
                                  >
                                    {customer.urgency}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 py-2 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SubscriptionCheck>
    </ProtectedRoute>
  );
}
