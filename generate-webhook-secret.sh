#!/bin/bash

echo "🔐 Generate VAPI Webhook Secret"
echo "==============================="
echo ""

# Generate a random webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 32)

echo "✅ Generated webhook secret:"
echo "   $WEBHOOK_SECRET"
echo ""

echo "📝 Add this to your .env.local file:"
echo "   VAPI_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo ""

echo "🔗 Also add this SAME secret in your VAPI dashboard:"
echo "   • Go to https://dashboard.vapi.ai"
echo "   • Navigate to Settings → Webhooks"
echo "   • Set webhook URL: https://your-ngrok-url.ngrok.io/api/vapi/webhook"
echo "   • Set webhook secret: $WEBHOOK_SECRET"
echo ""

echo "⚠️  IMPORTANT:"
echo "   • Use the SAME secret in both places (.env.local AND VAPI dashboard)"
echo "   • Keep this secret secure - don't commit it to version control"
echo "   • The secret is used to verify webhooks are actually from VAPI"
echo ""

# Optionally update .env.local if it exists
if [ -f ".env.local" ]; then
    echo "🤔 Would you like me to automatically add this to your .env.local file? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Check if VAPI_WEBHOOK_SECRET already exists
        if grep -q "VAPI_WEBHOOK_SECRET" .env.local; then
            echo "⚠️  VAPI_WEBHOOK_SECRET already exists in .env.local"
            echo "   Please update it manually with: $WEBHOOK_SECRET"
        else
            echo "VAPI_WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env.local
            echo "✅ Added webhook secret to .env.local"
        fi
    fi
else
    echo "❌ .env.local file not found. Run ./setup-env.sh first."
fi
