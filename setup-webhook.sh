#!/bin/bash

echo "🚀 VAPI Webhook Setup for Localhost Development"
echo "================================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please run ./setup-env.sh first to create the environment file."
    exit 1
fi

echo "📋 Step-by-Step Webhook Setup:"
echo ""
echo "1. 🔑 Create your Webhook Secret:"
echo "   • Generate a random secret string (32+ characters)"
echo "   • You can use: openssl rand -hex 32"
echo "   • Or create one manually like: my-super-secret-webhook-key-2024"
echo "   • Add it to your .env.local file:"
echo "     VAPI_WEBHOOK_SECRET=your_custom_secret_here"
echo ""

echo "2. 🌐 Start ngrok tunnel (in a new terminal):"
echo "   ngrok http 3000"
echo "   • This will give you a public URL like: https://abc123.ngrok.io"
echo "   • Copy this URL for the next step"
echo ""

echo "3. 🔗 Configure VAPI URLs in Dashboard:"
echo "   📞 Webhook URL (for receiving call events):"
echo "     https://your-ngrok-url.ngrok.io/api/vapi/webhook"
echo "   📞 Server URL (for dynamic assistant creation):"
echo "     https://your-ngrok-url.ngrok.io/api/vapi/call-handler"
echo "   • Example: https://abc123.ngrok.io/api/vapi/webhook"
echo "   • IMPORTANT: Use the SAME secret in VAPI dashboard that you set in .env.local"
echo ""

echo "4. 🧪 Test your setup:"
echo "   • Start your Next.js app: npm run dev"
echo "   • Visit: http://localhost:3000/test-vapi"
echo "   • Create a test assistant"
echo "   • Make a test call through VAPI dashboard"
echo "   • Check your terminal for webhook events"
echo ""

echo "5. 📝 Environment Variables Checklist:"
echo "   Make sure your .env.local contains:"
echo "   ✓ VAPI_API_KEY=your_api_key"
echo "   ✓ VAPI_WEBHOOK_SECRET=your_custom_secret"
echo "   ✓ MONGODB_URI=your_mongodb_connection"
echo ""

echo "🔍 Current .env.local status:"
if grep -q "VAPI_API_KEY" .env.local; then
    echo "✓ VAPI_API_KEY is set"
else
    echo "❌ VAPI_API_KEY is missing"
fi

if grep -q "VAPI_WEBHOOK_SECRET" .env.local; then
    echo "✓ VAPI_WEBHOOK_SECRET is set"
else
    echo "❌ VAPI_WEBHOOK_SECRET is missing"
fi

if grep -q "MONGODB_URI" .env.local; then
    echo "✓ MONGODB_URI is set"
else
    echo "❌ MONGODB_URI is missing"
fi

echo ""
echo "💡 Pro Tips:"
echo "• Keep ngrok running while testing webhooks"
echo "• Check VAPI dashboard logs for webhook delivery status"
echo "• Use browser dev tools to monitor network requests"
echo "• Webhook events will appear in your Next.js terminal"
