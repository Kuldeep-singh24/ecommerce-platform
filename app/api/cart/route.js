import redisCache from "@/lib/redis";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_nexvia_2026";

function getUserId(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cachedCart = await redisCache.get(`cart:${userId}`);
  return NextResponse.json({ items: cachedCart ? JSON.parse(cachedCart) : [] });
}

export async function POST(req) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await req.json();
  await redisCache.set(`cart:${userId}`, JSON.stringify(items));
  return NextResponse.json({ message: "Cart cached in Redis", items });
}