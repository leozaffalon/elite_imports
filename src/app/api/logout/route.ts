import { NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: getCookieName(),
    value: "",
    maxAge: 0,
    path: "/"
  });

  return response;
}
