import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function () {
      // Password required only for email/password users, not OAuth users
      return this.provider === "credentials";
    },
  },
  name: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    enum: ["google", "credentials"],
    default: "credentials",
  },
  providerId: {
    type: String,
  },
  role: {
    type: String,
    enum: ["captain", "admin"],
    default: "captain",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Stripe subscription fields
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
  },
  subscription: {
    stripeSubscriptionId: String,
    status: {
      type: String,
      enum: [
        "active",
        "canceled",
        "past_due",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "paused",
        "none",
      ],
      default: "none",
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    priceId: String,
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  // Only hash password if it's modified and not from OAuth
  if (this.isModified("password") && this.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Update updatedAt field
UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by email
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by Stripe customer ID
UserSchema.statics.findByStripeCustomerId = function (stripeCustomerId) {
  return this.findOne({ stripeCustomerId });
};

// Static method to find user by Stripe subscription ID
UserSchema.statics.findByStripeSubscriptionId = function (
  stripeSubscriptionId
) {
  return this.findOne({
    "subscription.stripeSubscriptionId": stripeSubscriptionId,
  });
};

// Instance method to check if user has active subscription
UserSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscription.status === "active" ||
    this.subscription.status === "trialing"
  );
};

// Instance method to check if user is admin (admins bypass subscription check)
UserSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// Instance method to check if user can access the platform
UserSchema.methods.canAccessPlatform = function () {
  return this.isAdmin() || this.hasActiveSubscription();
};

// Instance method to update subscription data
UserSchema.methods.updateSubscription = function (subscriptionData) {
  this.subscription = {
    ...this.subscription,
    ...subscriptionData,
    lastUpdated: new Date(),
  };
  return this.save();
};

// Instance method to clear subscription data
UserSchema.methods.clearSubscription = function () {
  this.subscription = {
    status: "none",
    lastUpdated: new Date(),
  };
  return this.save();
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
