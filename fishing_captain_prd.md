# Fishing Captain AI Assistant - Product Requirements Document (VAPI Integration)

## 1. Product Overview

**Product:** SaaS platform that provides AI phone assistants for fishing charter captains using VAPI  
**Problem:** Captains lose customers when unreachable on the water  
**Solution:** AI assistant handles calls via conditional call forwarding, books callbacks using VAPI's optimized voice infrastructure

**Tech Stack:**

- **Frontend:** Next.js 15+ (App Router)
- **Backend:** Next.js API Routes + MongoDB
- **Voice AI:** VAPI (handles OpenAI, speech processing, WebSockets)
- **Phone:** Twilio Voice + VAPI integration
- **Payments:** Stripe
- **Hosting:** Vercel (pure serverless - no WebSocket server needed!)

## 2. Architecture Simplification with VAPI

### **After (Simple):**

```
Customer → Twilio → VAPI (handles all voice processing) → Your Webhook → MongoDB
                    ↑                                     ↓
              VAPI handles complexity              You get clean JSON data
```

## 3. User Stories & Features

### 3.1 Core User Journey

**As a fishing captain, I want to:**

- Never miss a customer call while on the water
- Have a professional AI assistant handle inquiries with **no lag**
- Get instant notifications with structured customer details
- Easily toggle the service on/off from my dashboard

### 3.2 Feature Requirements

#### **Landing Page & Marketing**

- Hero section with VAPI-powered demo call
- Pricing tiers (Basic $39, Pro $69, Fleet $159)
- Live call quality demonstration
- "Call lag-free AI assistant" value proposition
- Customer testimonials focusing on call quality

#### **Authentication & Onboarding**

- auth.js google sign in/ sign up
- Payment processing via Stripe
- Streamlined onboarding (reduced from 5 steps to 4):
  1. Business information & phone number entry
  2. Service configuration (trips, pricing, policies)
  3. Assistant personalization (personality, greetings)
  4. Phone number assignment and test call verification

#### **Dashboard Features**

- **Call History:** All AI-handled calls with transcripts
- **Structured Lead Data:** Clean customer information extracted by VAPI functions
- **Call Quality Metrics:** Response times, call completion rates
- **Assistant Management:** Configure VAPI assistant personality per captain
- **Settings:** Toggle service, update SMS preferences
- **Billing:** Usage tracking (per-minute billing display)

#### **VAPI AI Assistant Capabilities**

- **Sub-300ms response time** (human-like conversation)
- **Function calling** to extract structured data:
  - Customer name, phone number
  - Preferred dates for fishing trips
  - Party size, trip preferences
  - Special requests or notes
- **Interrupt handling** (stops talking when customer speaks)
- **Professional fishing industry knowledge**
- **Customizable personality per captain**

## 4. Technical Architecture Overview

### 4.1 Database Schema (MongoDB)

**Users Collection:**

- Basic user information, authentication
- Twilio phone number assignments
- VAPI assistant IDs and configuration
- Subscription and billing details
- Custom assistant personality settings

**Calls Collection:**

- Populated automatically by VAPI webhooks
- Structured customer data from VAPI function calls
- Call transcripts and performance metrics
- Call outcomes and follow-up status

**Callbacks Collection:**

- Scheduled follow-up appointments
- Customer contact information
- Integration with calendar systems

### 4.2 API Routes Structure

**Authentication Routes:**

**Twilio Integration:**

- Voice webhook (points to VAPI, no WebSocket needed)
- Phone number purchasing and management
- Carrier detection for forwarding setup

**VAPI Integration:**

- Assistant creation and configuration
- Webhook handling for call events and data
- Assistant personality customization

**Dashboard APIs:**

- Call history retrieval with filtering
- Analytics and performance metrics
- User settings and preferences

**Onboarding Flow:**

- Carrier detection and forwarding instructions
- VAPI assistant setup and testing
- Integration verification

## 5. Implementation Phases (Dramatically Reduced Timeline!)

### **Phase 1: Core Setup with VAPI (Days 1-3)**

- Next.js app setup on Vercel
- MongoDB connection and basic collections
- VAPI account setup and API integration
- Basic assistant creation flow
- Simple TwiML handler pointing to VAPI
- **Deliverable:** Working AI assistant that can take calls

### **Phase 2: User Management & Onboarding (Days 4-6)**

- User authentication and signup
- Stripe integration for subscriptions
- Twilio number purchasing
- Assistant configuration interface
- VAPI webhook processing
- **Deliverable:** Complete user onboarding with personalized AI

### **Phase 3: Dashboard & Notifications (Days 7-9)**

- Call history dashboard with structured data
- SMS/email notifications to captains
- Call quality metrics and analytics
- Assistant personality customization
- **Deliverable:** Full-featured dashboard with notifications

### **Phase 4: Polish & Launch (Days 10-12)**

- Landing page and marketing site
- Payment processing and billing
- Error handling and monitoring
- Performance optimization
- Beta user testing and feedback
- **Deliverable:** Production-ready SaaS platform

## 6. Key Benefits of VAPI Integration

### **Development Speed:**

- **75% less code** to write and maintain
- **No WebSocket infrastructure** to build or debug
- **Built-in optimizations** for call quality and latency
- **Pre-built function calling** for data extraction

### **Call Quality:**

- **Sub-300ms response times** (vs 2+ seconds with DIY)
- **Natural conversation flow** with interrupt handling
- **Professional voice quality** optimized for phone calls
- **Automatic error recovery** and connection management

### **Scalability:**

- **Infinite scale** handled by VAPI infrastructure
- **No server management** required
- **Built-in monitoring** and analytics
- **Automatic failover** and redundancy

### **Cost Efficiency:**

- **Predictable per-minute pricing** vs infrastructure costs
- **No hosting costs** for voice processing
- **Faster time to market** reduces development costs
- **Lower maintenance overhead** long-term

## 11. Next Steps

1. **Set up VAPI account** and explore assistant configuration options
2. **Build basic Next.js structure** with authentication and database
3. **Implement VAPI integration** for assistant creation and management
4. **Create simple onboarding flow** with test call verification
5. **Beta test with 3-5 fishing captains** to validate call quality
6. **Build dashboard** with call history and analytics
7. **Implement billing** and subscription management
8. **Launch marketing site** and begin customer acquisition

---

**Estimated Development Time:** 12 days for full MVP (vs 8-12 weeks DIY)  
**Team Size:** 1 developer (manageable solo project)  
**Monthly Operational Cost:** <$200 (VAPI usage + hosting + tools)  
**Time to First Revenue:** 2-3 weeks instead of 2-3 months
