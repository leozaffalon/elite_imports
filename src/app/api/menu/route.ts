import { NextResponse } from "next/server";
import { getMenuItems } from "@/lib/data-store";

export async function GET() {
  const items = await getMenuItems();
  return NextResponse.json(items);
}
