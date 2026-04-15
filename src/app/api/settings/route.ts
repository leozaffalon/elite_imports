import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar configuracoes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
