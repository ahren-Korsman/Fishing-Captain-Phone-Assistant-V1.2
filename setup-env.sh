#!/bin/bash

# Create .env.local file with MongoDB connection string
echo "Creating .env.local file..."

cat > .env.local << EOF
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/fishing-captain-phone-assistant

# Alternative MongoDB Atlas connection (uncomment and replace with your Atlas connection string)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fishing-captain-phone-assistant?retryWrites=true&w=majority

# Base URL Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# For production: NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app

# VAPI Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret_here

# Twilio Configuration (if needed for direct integration)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure MongoDB is running locally on port 27017"
echo "2. Or update MONGODB_URI in .env.local with your MongoDB Atlas connection string"
echo "3. Test the VAPI integration by visiting: http://localhost:3000/api/test-vapi"
echo ""
echo "🚀 To start your development server: npm run dev"
