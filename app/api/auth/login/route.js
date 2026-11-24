import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_nexvia_2026";

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, storeName: user.storeName },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}