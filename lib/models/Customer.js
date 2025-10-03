import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
    },
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
    callbackRequested: {
      type: Boolean,
      default: false,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    totalCalls: {
      type: Number,
      default: 1,
    },
    lastCallDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "booked", "completed", "lost"],
      default: "new",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique customers per captain
customerSchema.index({ captainId: 1, phoneNumber: 1 }, { unique: true });
customerSchema.index({ captainId: 1, lastCallDate: -1 });
customerSchema.index({ captainId: 1, status: 1 });

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;
