import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number to XXX-XXX-XXXX format for display purposes
 * @param phoneNumber - Phone number in any format (e.g., +1234567890, 1234567890, etc.)
 * @returns Formatted phone number as XXX-XXX-XXXX or original if invalid
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");
  
  // Handle different input formats
  let cleanNumber = digits;
  
  // If it starts with 1 and has 11 digits, remove the 1 (US country code)
  if (digits.length === 11 && digits.startsWith("1")) {
    cleanNumber = digits.substring(1);
  }
  
  // Only format if we have exactly 10 digits (US phone number)
  if (cleanNumber.length === 10) {
    return `${cleanNumber.substring(0, 3)}-${cleanNumber.substring(3, 6)}-${cleanNumber.substring(6)}`;
  }
  
  // For other number lengths, provide basic formatting for readability
  if (digits.length === 11 && !digits.startsWith("1")) {
    // Format 11-digit non-US numbers (like UK: 07596826004 -> 075-9682-6004)
    return `${digits.substring(0, 3)}-${digits.substring(3, 7)}-${digits.substring(7)}`;
  }
  
  if (digits.length >= 7) {
    // For other lengths, provide basic grouping for readability
    if (digits.length === 7) {
      return `${digits.substring(0, 3)}-${digits.substring(3)}`;
    } else if (digits.length === 8) {
      return `${digits.substring(0, 4)}-${digits.substring(4)}`;
    } else if (digits.length === 9) {
      return `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
  }
  
  // If it doesn't match any expected format, return original
  return phoneNumber;
}

/**
 * Formats a phone number for forwarding codes with dashes for readability
 * @param phoneNumber - Phone number in any format
 * @param carrierCode - The carrier forwarding code to determine format needed
 * @returns Formatted phone number for forwarding codes with dashes
 */
export function formatPhoneNumberForForwarding(phoneNumber: string, carrierCode?: string): string {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");
  
  // Handle different input formats
  let cleanNumber = digits;
  
  // If it starts with 1 and has 11 digits, remove the 1 (US country code)
  if (digits.length === 11 && digits.startsWith("1")) {
    cleanNumber = digits.substring(1);
  }
  
  // Check if carrier requires 11-digit format (with "1" prefix)
  const requiresElevenDigits = carrierCode && (
    carrierCode.includes("**21*") || // T-Mobile unconditional
    carrierCode.includes("**61*") || // T-Mobile no answer
    carrierCode.includes("**62*") || // T-Mobile unreachable
    carrierCode.includes("**67*")    // T-Mobile busy
  );
  
  let formattedNumber;
  if (requiresElevenDigits && cleanNumber.length === 10) {
    // Add "1" prefix for carriers that require it
    formattedNumber = `1${cleanNumber}`;
  } else if (cleanNumber.length === 10) {
    // Return 10-digit format for other carriers
    formattedNumber = cleanNumber;
  } else {
    // If it doesn't match expected format, return original
    return phoneNumber;
  }
  
  // Add dashes for readability (same as display format)
  if (formattedNumber.length === 10) {
    return `${formattedNumber.substring(0, 3)}-${formattedNumber.substring(3, 6)}-${formattedNumber.substring(6)}`;
  } else if (formattedNumber.length === 11) {
    return `${formattedNumber.substring(0, 1)}-${formattedNumber.substring(1, 4)}-${formattedNumber.substring(4, 7)}-${formattedNumber.substring(7)}`;
  }
  
  return formattedNumber;
}