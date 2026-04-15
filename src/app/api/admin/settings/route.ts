import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar configuracoes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as {
      homeImage?: string;
      homeImages?: string[];
    };

    const sanitizedHomeImages = Array.isArray(body.homeImages)
      ? [...new Set(body.homeImages.filter((item): item is string => typeof item === "string").map((item) => item.trim()))]
          .filter((item) => item.length > 0)
          .slice(0, 5)
      : [];
    const sanitizedSingle = typeof body.homeImage === "string" ? body.homeImage.trim() : "";

    const mergedHomeImages = [...new Set([...sanitizedHomeImages, sanitizedSingle].filter((item) => item.length > 0))].slice(0, 5);

    if (mergedHomeImages.length === 0) {
      return NextResponse.json({ error: "Informe ao menos uma imagem valida para a home." }, { status: 400 });
    }

    const settings = await updateSiteSettings({
      homeImage: mergedHomeImages[0],
      homeImages: mergedHomeImages
    });
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar configuracoes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
