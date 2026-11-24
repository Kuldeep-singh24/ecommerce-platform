import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: String,
        price: Number,
        quantity: Number,
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["placed", "packed", "shipped", "delivered"],
      default: "placed",
    },
    paymentId: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);