import { connectDB } from "@/lib/db";
import redisCache from "@/lib/redis";
import Order from "@/models/Order";
import Product from "@/models/Product";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_nexvia_2026";

export async function POST(req) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    const { items, couponCode } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = couponCode === "NEXVIA10" ? subtotal * 0.1 : 0;
    const totalAmount = Number((subtotal - discount).toFixed(2));

    // Calculate multi-vendor split payouts (10% platform commission)
    const vendorSplits = {};
    for (const item of items) {
      const itemTotal = item.price * item.quantity;
      const platformFee = Number((itemTotal * 0.1).toFixed(2));
      const vendorPayout = Number((itemTotal - platformFee).toFixed(2));

      const vId = item.vendorId?._id || item.vendorId || "platform";
      if (!vendorSplits[vId]) {
        vendorSplits[vId] = { vendorPayout: 0, platformCommission: 0 };
      }
      vendorSplits[vId].vendorPayout += vendorPayout;
      vendorSplits[vId].platformCommission += platformFee;

      if (item._id) {
        await Product.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
      }
    }

    const order = await Order.create({
      customerId: decoded.userId,
      items: items.map((i) => ({
        productId: i._id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        vendorId: i.vendorId?._id || i.vendorId,
      })),
      totalAmount,
      status: "placed",
      paymentId: `pi_stripe_split_${Date.now()}`,
    });

    // Clear Redis cart cache upon checkout
    await redisCache.del(`cart:${decoded.userId}`);

    return NextResponse.json({
      message: "Order placed & split payments processed",
      order,
      splitBreakdown: vendorSplits,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}