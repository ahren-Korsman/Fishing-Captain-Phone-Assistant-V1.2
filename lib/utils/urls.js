/**
 * URL utility functions for consistent URL generation
 */

/**
 * Get the base URL for the application
 * @returns {string} Base URL (with protocol and domain)
 */
export function getBaseUrl() {
  // In client-side components, use NEXT_PUBLIC_BASE_URL
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  }

  // In server-side code, use NEXT_PUBLIC_BASE_URL
  return process.env.NEXT_PUBLIC_BASE_URL;
}

/**
 * Get the webhook URL for VAPI configuration
 * @returns {string} Complete webhook URL
 */
export function getWebhookUrl() {
  return `${getBaseUrl()}/api/vapi/webhook`;
}

/**
 * Get the server URL for VAPI phone number configuration
 * @returns {string} Complete server URL for dynamic assistant creation
 */
export function getServerUrl() {
  return `${getBaseUrl()}/api/vapi/call-handler`;
}

/**
 * Get a complete API URL
 * @param {string} path - API path (e.g., '/api/test-vapi')
 * @returns {string} Complete API URL
 */
export function getApiUrl(path) {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Environment-specific URL helpers
 */
export const urls = {
  // VAPI endpoints
  webhook: () => getWebhookUrl(),
  server: () => getServerUrl(),

  // Test endpoints
  testVapi: () => getApiUrl("/api/test-vapi"),
  testWebhook: () => getApiUrl("/api/test-webhook"),

  // Main endpoints
  assistant: () => getApiUrl("/api/vapi/assistant"),
  captains: () => getApiUrl("/api/captains"),
  tools: () => getApiUrl("/api/vapi/tools"),
};

const defaultExport = {
  getBaseUrl,
  getWebhookUrl,
  getServerUrl,
  getApiUrl,
  urls,
};

export default defaultExport;
