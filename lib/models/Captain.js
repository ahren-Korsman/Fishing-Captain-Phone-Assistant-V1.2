import mongoose from "mongoose";

const captainSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    description: "NextAuth user ID",
  },
  captainName: {
    type: String,
    required: true,
    trim: true,
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  vapiAssistantId: {
    type: String,
    default: null,
  },
  customInstructions: {
    type: String,
    default: "",
  },
  // Business Details
  location: {
    type: String,
    required: true,
    trim: true,
  },
  seasonalInfo: {
    type: String,
    default: "",
    description: "Info about peak seasons, fish species, best months",
  },
  tripTypes: {
    type: [String],
    default: ["inshore", "offshore"],
    description: "Types of trips offered",
  },
  boatInfo: {
    type: String,
    default: "",
    description: "Boat size, capacity, amenities",
  },
  pricingInfo: {
    type: String,
    default: "",
    description: "Basic pricing structure or ranges",
  },
  // Communication Preferences
  smsOptIn: {
    type: Boolean,
    default: true,
    description: "Whether captain wants to receive SMS notifications",
  },
  // Twilio Integration
  twilioNumber: {
    phoneNumber: {
      type: String,
      default: null,
    },
    sid: {
      type: String,
      default: null,
    },
    purchasedAt: {
      type: Date,
      default: null,
    },
    webhookUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
    capabilities: {
      voice: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      mms: { type: Boolean, default: false },
      fax: { type: Boolean, default: false },
    },
    vapiPhoneNumberId: {
      type: String,
      default: null,
      description: "VAPI phone number ID for direct integration",
    },
    vapiPhoneNumber: {
      type: String,
      default: null,
      description: "VAPI phone number (actual number for dialing)",
    },
    assistantId: {
      type: String,
      default: null,
      description: "VAPI assistant ID assigned to this phone number",
    },
    vapiIntegrationStatus: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
      description: "Status of VAPI integration",
    },
  },
  serviceEnabled: {
    type: Boolean,
    default: true,
  },
  subscriptionActive: {
    type: Boolean,
    default: false,
    description: "Whether the captain has an active subscription",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
captainSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Captain =
  mongoose.models.Captain || mongoose.model("Captain", captainSchema);

export default Captain;
