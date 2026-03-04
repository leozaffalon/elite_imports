import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasPublicMenuUrl: Boolean(process.env.BLOB_PUBLIC_MENU_URL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    runtime: "nodejs"
  });
}
