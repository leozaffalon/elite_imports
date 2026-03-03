import { NextResponse } from "next/server";
import { getMenuItems } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getMenuItems();
  return NextResponse.json(items);
}
