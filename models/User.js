import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    storeName: { type: String, default: "" }, // For vendors
    commissionRate: { type: Number, default: 0.1 }, // 10% platform commission
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);