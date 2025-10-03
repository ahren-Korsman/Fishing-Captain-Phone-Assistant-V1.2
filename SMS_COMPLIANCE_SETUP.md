# Environment Variables Template

# Add these to your .env.local file

# Existing variables (already configured)

NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=your_mongodb_connection_string
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# NEW: SMS Compliance (add after Twilio A2P 10DLC approval)

# Single SMS Campaign Number - All SMS notifications sent from this number

TWILIO_SMS_CAMPAIGN_NUMBER=+1234567890

# Messaging Service SID (optional - for additional compliance features)

TWILIO_MESSAGING_SERVICE_SID=

# Instructions:

# 1. Apply for Twilio A2P 10DLC compliance

# 2. Purchase ONE phone number for SMS campaigns

# 3. Add the phone number to TWILIO_SMS_CAMPAIGN_NUMBER above

# 4. (Optional) Create Messaging Service and add TWILIO_MESSAGING_SERVICE_SID

# 5. Deploy - All SMS notifications will be sent from the single campaign number
