import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash("password123", 10);

    const vendor1 = await User.findOneAndUpdate(
      { email: "vendor1@nexvia.com" },
      {
        name: "Apex Electronics",
        email: "vendor1@nexvia.com",
        password: hashedPassword,
        role: "vendor",
        storeName: "Apex Tech Store",
      },
      { upsert: true, new: true }
    );

    const vendor2 = await User.findOneAndUpdate(
      { email: "vendor2@nexvia.com" },
      {
        name: "Urban Style Co",
        email: "vendor2@nexvia.com",
        password: hashedPassword,
        role: "vendor",
        storeName: "Urban Lifestyle",
      },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: "admin@nexvia.com" },
      {
        name: "Platform Admin",
        email: "admin@nexvia.com",
        password: hashedPassword,
        role: "admin",
      },
      { upsert: true, new: true }
    );

    const existingCount = await Product.countDocuments();
    if (existingCount === 0) {
      await Product.insertMany([
        {
          title: "Pro Wireless Noise-Cancelling Headphones",
          description: "40-hour battery life, active noise cancellation, studio sound.",
          price: 199.99,
          category: "Electronics",
          stock: 25,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
          vendorId: vendor1._id,
        },
        {
          title: "Mechanical RGB Gaming Keyboard",
          description: "Hot-swappable tactile switches with aluminum chassis.",
          price: 129.5,
          category: "Electronics",
          stock: 40,
          imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500",
          vendorId: vendor1._id,
        },
        {
          title: "Minimalist Chronograph Watch",
          description: "Sapphire crystal glass with genuine leather strap.",
          price: 149.0,
          category: "Fashion",
          stock: 18,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
          vendorId: vendor2._id,
        },
        {
          title: "Ergonomic Smart Desk Lamp",
          description: "Adjustable color temperature with wireless charging base.",
          price: 69.99,
          category: "Home",
          stock: 30,
          imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
          vendorId: vendor2._id,
        },
      ]);
    }

    return NextResponse.json({ message: "Seeded demo vendors, admin, and products!" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}