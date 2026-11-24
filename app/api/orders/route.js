import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_nexvia_2026";

export async function GET(req) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);

    let orders = [];
    if (decoded.role === "admin") {
      orders = await Order.find().populate("customerId", "name email").sort({ createdAt: -1 });
    } else if (decoded.role === "vendor") {
      orders = await Order.find({ "items.vendorId": decoded.userId }).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ customerId: decoded.userId }).sort({ createdAt: -1 });
    }

    // Platform Analytics
    const allOrders = await Order.find();
    const totalRevenue = allOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const platformCommission = Number((totalRevenue * 0.1).toFixed(2));
    const vendorCount = await User.countDocuments({ role: "vendor" });
    const productCount = await Product.countDocuments();

    return NextResponse.json({
      orders,
      analytics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        platformCommission,
        totalOrders: allOrders.length,
        vendorCount,
        productCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update order lifecycle status
export async function PATCH(req) {
  try {
    await connectDB();
    const { orderId, status } = await req.json();
    const updated = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    return NextResponse.json({ order: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}