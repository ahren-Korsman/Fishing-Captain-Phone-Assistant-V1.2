"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/protected-route";
import { getWebhookUrl, getServerUrl } from "@/lib/utils/urls";
import { formatPhoneNumber } from "@/lib/utils";

// Type definitions for API responses
interface Assistant {
  id: string;
  name: string;
  captainName?: string;
  businessName?: string;
  status?: string;
}

interface TestResults {
  assistantsCount: number;
  assistants: Assistant[];
}

interface Captain {
  captainName: string;
  businessName: string;
  phoneNumber: string;
  email: string;
}

interface CaptainData {
  captain: Captain;
}

interface Tool {
  id: string;
  type?: string;
  function?: {
    name: string;
  };
  server?: {
    url: string;
  };
}

interface ToolsData {
  count?: number;
  tools?: Tool[];
  tool?: Tool;
}

interface AssistantData {
  assistant: Assistant;
  vapiAssistant?: Assistant;
}

export default function VAPITestPage() {
  const [assistantData, setAssistantData] = useState<AssistantData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [captainData, setCaptainData] = useState<CaptainData | null>(null);
  const [toolsData, setToolsData] = useState<ToolsData | null>(null);

  const testVAPIConnection = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test-vapi");
      const data = await response.json();

      if (response.ok) {
        setTestResults(data);
      } else {
        setError(data.error || "Failed to connect to VAPI");
      }
    } catch (err) {
      setError(
        "Network error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const registerTestCaptain = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/captains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captainName: "Captain Charlie",
          businessName: "Gulf Coast Charters",
          phoneNumber: "+1234567890",
          email: "captain.charlie@gulfcoastcharters.com",
          location: "Gulf Coast, Alabama",
          seasonalInfo:
            "Peak season April-October. Red snapper, grouper, and amberjack are hot in summer. Fall brings great king mackerel fishing.",
          tripTypes: ["inshore", "offshore", "deep-sea"],
          boatInfo:
            "32ft center console, up to 6 passengers, fully equipped with GPS, fishfinder, and safety gear",
          pricingInfo:
            "Half day trips start at $800, full day $1200. Group discounts available for 4+ people.",
          smsOptIn: true,
          customInstructions:
            "Always mention our group discounts and that we provide all tackle and bait.",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCaptainData(data);
      } else {
        setError(data.error || "Failed to register captain");
      }
    } catch (err) {
      setError(
        "Network error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const testVAPITools = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vapi/tools");
      const data = await response.json();

      if (response.ok) {
        setToolsData(data);
      } else {
        setError(data.error || "Failed to fetch tools");
      }
    } catch (err) {
      setError(
        "Network error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const createTestTool = async (toolType = "customer_info") => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vapi/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          toolType: toolType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToolsData(data);
      } else {
        setError(data.error || "Failed to create tool");
      }
    } catch (err) {
      setError(
        "Network error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const createAllTools = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vapi/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_all",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToolsData(data);
      } else {
        setError(data.error || "Failed to create tools");
      }
    } catch (err) {
      setError(
        "Network error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const createTestAssistant = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vapi/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captainName: "Captain Charlie",
          businessName: "Gulf Coast Charters",
          phoneNumber: "+1234567890",
          customInstructions:
            "Always mention our group discounts and that we provide all tackle and bait.",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAssistantData(data);
      } else {
        setError(data.error || "Failed to create assistant");
      }
    } catch (err) {
      setError(
        "Network error: " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              VAPI Integration Test
            </h1>
            <p className="text-lg text-gray-600">
              Test your VAPI setup and create fishing captain assistants
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Captain Registration */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                1. Register Test Captain
              </h2>
              <p className="text-gray-600 mb-4">
                Register a captain in the database for dynamic assistant
                creation.
              </p>

              <button
                onClick={registerTestCaptain}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Register Test Captain"}
              </button>

              {captainData && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-semibold text-green-800">
                    ✅ Captain Registered!
                  </h3>
                  <div className="text-green-700 text-sm mt-2">
                    <p>
                      <strong>Name:</strong> {captainData.captain.captainName}
                    </p>
                    <p>
                      <strong>Business:</strong>{" "}
                      {captainData.captain.businessName}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {formatPhoneNumber(captainData.captain.phoneNumber)}
                    </p>
                    <p>
                      <strong>Email:</strong> {captainData.captain.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* VAPI Connection Test */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                2. Test VAPI Connection
              </h2>
              <p className="text-gray-600 mb-4">
                Verify that your VAPI API key is working correctly.
              </p>

              <button
                onClick={testVAPIConnection}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Testing..." : "Test VAPI Connection"}
              </button>

              {testResults && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-semibold text-green-800">
                    ✅ Connection Successful!
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    Found {testResults.assistantsCount} assistants in your
                    account
                  </p>
                  {testResults.assistants &&
                    testResults.assistants.length > 0 && (
                      <div className="mt-2">
                        <p className="text-green-700 text-sm font-medium">
                          Recent assistants:
                        </p>
                        <ul className="text-green-600 text-sm mt-1">
                          {testResults.assistants.map(
                            (assistant: Assistant, index: number) => (
                              <li key={index}>• {assistant.name}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-semibold text-red-800">
                    ❌ Connection Failed
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}
            </div>

            {/* Tools Test */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">3. Test VAPI Tools</h2>
              <p className="text-gray-600 mb-4">
                Test creating and managing VAPI tools programmatically.
              </p>

              <div className="space-y-2">
                <button
                  onClick={testVAPITools}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : "List Tools"}
                </button>

                <button
                  onClick={createAllTools}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create All Tools"}
                </button>

                <div className="grid grid-cols-1 gap-1">
                  <button
                    onClick={() => createTestTool("customer_info")}
                    disabled={loading}
                    className="w-full bg-yellow-600 text-white py-1 px-2 rounded text-xs hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Customer Info
                  </button>
                  <button
                    onClick={() => createTestTool("callback_scheduling")}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Callback Tool
                  </button>
                  <button
                    onClick={() => createTestTool("transfer_call")}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-1 px-2 rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Transfer Tool
                  </button>
                </div>
              </div>

              {toolsData && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                  <h3 className="font-semibold text-orange-800">
                    ✅ Tools {toolsData.tools ? "Retrieved" : "Created"}!
                  </h3>
                  <div className="text-orange-700 text-sm mt-2">
                    <p>
                      <strong>Count:</strong>{" "}
                      {toolsData.count ||
                        (toolsData.tools ? toolsData.tools.length : 1)}
                    </p>
                    {toolsData.tool && (
                      <div className="text-orange-600 text-xs mt-2">
                        <p>
                          <strong>Tool Name:</strong>{" "}
                          {toolsData.tool.function?.name || toolsData.tool.type}
                        </p>
                        <p>
                          <strong>Tool ID:</strong> {toolsData.tool.id}
                        </p>
                        {toolsData.tool.server?.url && (
                          <p>
                            <strong>Server URL:</strong>{" "}
                            {toolsData.tool.server.url}
                          </p>
                        )}
                      </div>
                    )}
                    {toolsData.tools && toolsData.tools.length > 0 && (
                      <div className="text-orange-600 text-xs mt-2 space-y-1">
                        {toolsData.tools
                          .slice(0, 3)
                          .map((tool: Tool, index: number) => (
                            <div
                              key={index}
                              className="border-l-2 border-orange-300 pl-2"
                            >
                              <p>
                                <strong>
                                  {tool.function?.name || tool.type}
                                </strong>{" "}
                                ({tool.id})
                              </p>
                              {tool.server?.url && (
                                <p className="text-gray-600">
                                  Server: {tool.server.url}
                                </p>
                              )}
                            </div>
                          ))}
                        {toolsData.tools.length > 3 && (
                          <p className="text-gray-600">
                            ...and {toolsData.tools.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Assistant Creation Test */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                4. Create Test Assistant
              </h2>
              <p className="text-gray-600 mb-4">
                Create a fishing captain assistant with function calling
                capabilities.
              </p>

              <button
                onClick={createTestAssistant}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Test Assistant"}
              </button>

              {assistantData && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-semibold text-green-800">
                    ✅ Assistant Created!
                  </h3>
                  <div className="text-green-700 text-sm mt-2">
                    <p>
                      <strong>Name:</strong> {assistantData.assistant.name}
                    </p>
                    <p>
                      <strong>Captain:</strong>{" "}
                      {assistantData.assistant.captainName}
                    </p>
                    <p>
                      <strong>Business:</strong>{" "}
                      {assistantData.assistant.businessName}
                    </p>
                    <p>
                      <strong>Status:</strong> {assistantData.assistant.status}
                    </p>
                  </div>
                  {assistantData.vapiAssistant && (
                    <div className="mt-2">
                      <p className="text-green-600 text-xs">
                        VAPI Assistant ID: {assistantData.vapiAssistant.id}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">
              Next Steps
            </h2>
            <div className="text-blue-700 text-sm space-y-2">
              <p>
                1. <strong>Set up your environment:</strong> Run{" "}
                <code className="bg-blue-100 px-1 rounded">./setup-env.sh</code>{" "}
                and add your VAPI API key
              </p>
              <p>
                2. <strong>Configure VAPI URLs:</strong> Set these URLs in your
                VAPI dashboard:
              </p>
              <div className="ml-4 space-y-1">
                <div>
                  <span className="text-blue-800 font-medium">
                    Webhook URL:
                  </span>{" "}
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    {getWebhookUrl()}
                  </code>
                </div>
                <div>
                  <span className="text-blue-800 font-medium">Server URL:</span>{" "}
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    {getServerUrl()}
                  </code>
                </div>
              </div>
              <p>
                3. <strong>Test the flow:</strong> Create an assistant and make
                a test call through VAPI
              </p>
              <p>
                4. <strong>Check webhooks:</strong> Monitor your webhook
                endpoint for call events and customer data
              </p>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Available API Endpoints
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-4">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono">
                  POST
                </span>
                <code>/api/captains</code>
                <span className="text-gray-600">Register fishing captain</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                  GET
                </span>
                <code>/api/test-vapi</code>
                <span className="text-gray-600">Test VAPI connection</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                  POST
                </span>
                <code>/api/vapi/assistant</code>
                <span className="text-gray-600">
                  Create fishing captain assistant
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-mono">
                  POST
                </span>
                <code>/api/vapi/call-handler</code>
                <span className="text-gray-600">Dynamic call handler</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono">
                  POST
                </span>
                <code>/api/vapi/webhook</code>
                <span className="text-gray-600">VAPI webhook handler</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                  GET
                </span>
                <code>/api/test-vapi</code>
                <span className="text-gray-600">Test VAPI integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
