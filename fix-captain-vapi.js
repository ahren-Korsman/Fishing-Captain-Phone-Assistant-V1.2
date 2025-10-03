import mongoose from "mongoose";
import Captain from "./lib/models/Captain.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function updateCaptain() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const captain = await Captain.findById("68cdab0bca85570cb2656fb8");
    if (captain && captain.twilioNumber) {
      console.log("📞 Current captain data:", {
        captainName: captain.captainName,
        phoneNumber: captain.phoneNumber,
        twilioNumber: captain.twilioNumber.phoneNumber,
        vapiPhoneNumberId: captain.twilioNumber.vapiPhoneNumberId,
        vapiPhoneNumber: captain.twilioNumber.vapiPhoneNumber,
      });

      // Set the VAPI phone number to the same as Twilio number
      captain.twilioNumber.vapiPhoneNumber = "+19712876917";
      await captain.save();

      console.log(
        "✅ Captain updated with VAPI phone number:",
        captain.twilioNumber.vapiPhoneNumber
      );
    } else {
      console.log("❌ Captain not found");
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

updateCaptain();
