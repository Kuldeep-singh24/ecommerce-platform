import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_nexvia_2026";

// GET: Search, filter, and sort products
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "newest";

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "All") {
      query.category = category;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };

    const products = await Product.find(query)
      .populate("vendorId", "name storeName")
      .sort(sortOption);

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Vendor creates a new product (RBAC protected)
export async function POST(req) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "vendor" && decoded.role !== "admin") {
      return NextResponse.json({ error: "Only vendors can add products" }, { status: 403 });
    }

    const { title, description, price, category, stock, imageUrl } = await req.json();
    const product = await Product.create({
      title,
      description,
      price: Number(price),
      category,
      stock: Number(stock) || 10,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
      vendorId: decoded.userId,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}