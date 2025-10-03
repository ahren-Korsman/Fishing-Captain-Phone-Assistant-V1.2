# Twilio Carrier Detection Integration

This document explains how the Twilio Lookup API is integrated into the Fishing Captain AI Assistant for carrier detection with enhanced fishing captain guidance.

## Overview

The carrier detection system uses Twilio's Lookup API to identify the mobile carrier for US phone numbers, providing accurate call forwarding codes for each carrier with specific guidance for fishing captains going offshore.

## Features

- ✅ **Real-time carrier detection** using Twilio Lookup API
- ✅ **MVNO mapping** - correctly identifies host networks for MVNOs
- ✅ **Call forwarding codes** - provides carrier-specific forwarding instructions
- ✅ **Fishing captain guidance** - specialized recommendations for offshore fishing
- ✅ **Development fallback** - uses mock data when Twilio is unavailable
- ✅ **Error handling** - graceful fallback and error reporting

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Install Dependencies

```bash
npm install twilio
```

### 3. API Endpoint

The carrier lookup API is available at:

```
POST /api/twilio/carrier-lookup
```

## Carrier Support

### Major Carriers

- **Verizon** - `*72[number]` (activate), `*73` (disable)

  - ⚠️ **IMPORTANT**: Does NOT support unreachable forwarding
  - 💡 **Recommendation**: Use "Forward All Calls" when going offshore
  - 🔄 **Alternative**: Consider switching to AT&T or T-Mobile

- **AT&T** - `*21*[number]#` (activate), `##21#` (disable)

  - ✅ **EXCELLENT**: Supports unreachable forwarding (`*62*[number]#`)
  - 🌊 **PERFECT** for offshore fishing with no service

- **T-Mobile** - `**21*1[number]#` (activate), `##21#` (disable)

  - ✅ **EXCELLENT**: Supports unreachable forwarding (`**62*1[number]#`)
  - 🌊 **PERFECT** for offshore fishing with no service

- **US Cellular** - `*72[number]` (activate), `*73` (disable)
  - ✅ **GOOD**: Supports unreachable forwarding (`*92[number]`)
  - 🌊 **GOOD** for offshore fishing with no service

### MVNO Mapping

The system automatically maps MVNOs to their host networks:

| MVNO          | Host Network | Forwarding Code   | Offshore Support |
| ------------- | ------------ | ----------------- | ---------------- |
| Cricket       | AT&T         | `*21*[number]#`   | ✅ Excellent     |
| Metro         | T-Mobile     | `**21*1[number]#` | ✅ Excellent     |
| Visible       | Verizon      | `*72[number]`     | ⚠️ Limited       |
| Mint          | T-Mobile     | `**21*1[number]#` | ✅ Excellent     |
| Boost         | T-Mobile     | `**21*1[number]#` | ✅ Excellent     |
| Straight Talk | Verizon      | `*72[number]`     | ⚠️ Limited       |

## Fishing Captain Guidance

### Offshore Fishing Recommendations

The system provides specialized guidance for fishing captains:

#### **Verizon Users**

- **Recommended**: Forward All Calls (`*72`)
- **Explanation**: Since Verizon doesn't support unreachable forwarding, use unconditional forwarding when going offshore
- **Alternative**: Consider switching to AT&T or T-Mobile for better offshore coverage

#### **AT&T Users**

- **Recommended**: Forward When Unreachable (`*62*`)
- **Explanation**: AT&T's unreachable forwarding is ideal for offshore fishing when you have no service
- **Alternative**: You can also use "Forward All Calls" for maximum coverage

#### **T-Mobile Users**

- **Recommended**: Forward When Unreachable (`**62*1`)
- **Explanation**: T-Mobile's unreachable forwarding is ideal for offshore fishing when you have no service
- **Alternative**: You can also use "Forward All Calls" for maximum coverage

#### **US Cellular Users**

- **Recommended**: Forward When Unreachable (`*92`)
- **Explanation**: US Cellular's unreachable forwarding works well for offshore fishing when you have no service
- **Alternative**: You can also use "Forward All Calls" for maximum coverage

## API Response Format

```json
{
  "success": true,
  "phoneNumber": "+15551234567",
  "carrier": {
    "name": "T-Mobile",
    "type": "mobile",
    "country": "US"
  },
  "callForwarding": {
    "supported": true,
    "code": "**21*",
    "description": "T-Mobile Unconditional Call Forwarding",
    "steps": [
      "Pick up your phone and listen for dial tone",
      "Dial **21*1 followed by the forwarding number",
      "Press # to activate",
      "Listen for confirmation",
      "Hang up"
    ],
    "disableCode": "##21#",
    "notes": [
      "Requires dialing full 11-digit number (with leading 1)",
      "Double asterisk format (**)",
      "##004# resets all forwarding settings to default",
      "✅ EXCELLENT: T-Mobile supports unreachable forwarding (**62*1)",
      "🌊 PERFECT for offshore fishing with no service"
    ],
    "conditionalCodes": {
      "busy": "**67*1",
      "noAnswer": "**61*1",
      "unreachable": "**62*1"
    },
    "fishingCaptainGuidance": {
      "recommended": "unreachable",
      "explanation": "T-Mobile's unreachable forwarding (**62*1) is ideal for offshore fishing when you have no service",
      "alternative": "You can also use 'Forward All Calls' (**21*1) for maximum coverage"
    }
  },
  "message": "Detected T-Mobile carrier. Call forwarding supported.",
  "isMock": false
}
```

## Usage Examples

### Basic Carrier Lookup

```javascript
const response = await fetch("/api/twilio/carrier-lookup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phoneNumber: "+15551234567" }),
});

const data = await response.json();
console.log(data.callForwarding.fishingCaptainGuidance);
```

### Onboarding Integration

The carrier lookup is integrated into the onboarding flow:

1. **Step 1**: User enters phone number
2. **Step 2**: Carrier detection and automatic forwarding setup
3. **Step 3**: System detects carrier and shows:
   - Available forwarding codes
   - Fishing captain guidance
   - Carrier-specific recommendations
4. **Step 4**: User purchases Twilio number
5. **Step 5**: System provides exact forwarding codes with carrier-specific formatting

## Error Handling

### Development Mode

- Falls back to mock data when Twilio API is unavailable
- Shows "Demo Mode" indicator in UI
- Uses realistic carrier data for testing

### Production Mode

- Returns proper error messages for API failures
- Logs detailed error information
- Provides troubleshooting guidance

## Testing

### Test Script

Use the provided test script:

```bash
node scripts/test-twilio-carrier.js
```

### Manual Testing

```bash
curl -X POST http://localhost:3001/api/twilio/carrier-lookup \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567"}'
```

## Troubleshooting

### Common Issues

1. **Twilio API Key Issues**

   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
   - Check Twilio account status and billing

2. **Phone Number Format**

   - Ensure phone numbers are in E.164 format (+1XXXXXXXXXX)
   - Handle both 10-digit and 11-digit US numbers

3. **Carrier Detection Failures**
   - Some numbers may not be in Twilio's database
   - Fallback to mock data in development mode

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed carrier lookup information and fallback to mock data when needed.

## Future Enhancements

- [ ] International carrier support
- [ ] Real-time carrier updates
- [ ] Advanced MVNO detection
- [ ] Carrier-specific feature detection
- [ ] Integration with carrier APIs for real-time status
