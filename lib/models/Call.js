import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
      required: true,
      index: true,
    },
    assistantId: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "failed", "cancelled"],
      default: "in-progress",
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
    },
    cost: {
      type: Number, // in cents
    },
    transcript: {
      type: String,
    },
    customerData: {
      customerName: String,
      phoneNumber: String,
      email: String,
      preferredDates: [String],
      partySize: Number,
      tripType: {
        type: String,
        enum: ["inshore", "offshore", "deep-sea", "not-sure"],
      },
      experience: {
        type: String,
        enum: ["beginner", "intermediate", "experienced", "not-specified"],
      },
      specialRequests: String,
      budget: String,
      callbackRequested: Boolean,
      urgency: {
        type: String,
        enum: ["low", "medium", "high"],
      },
    },
    metadata: {
      callerId: String,
      recordingUrl: String,
      qualityScore: Number,
      language: String,
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
callSchema.index({ captainId: 1, startedAt: -1 });
callSchema.index({ customerPhone: 1 });
callSchema.index({ status: 1 });

const Call = mongoose.models.Call || mongoose.model("Call", callSchema);

export default Call;
