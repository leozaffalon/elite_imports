import { NextResponse } from "next/server";
import { deleteMenuItem, updateMenuItem } from "@/lib/data-store";
import { requireAdminSession } from "@/lib/auth";
import { MenuCategory } from "@/lib/types";

const allowedCategories = new Set<MenuCategory>(["Masculino", "Feminino", "Unissex", "Kits"]);
export const dynamic = "force-dynamic";

type Context = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, context: Context) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      images?: string[];
      category?: MenuCategory;
      featured?: boolean;
      available?: boolean;
    };

    if (body.category && !allowedCategories.has(body.category)) {
      return NextResponse.json({ error: "Categoria invalida" }, { status: 400 });
    }

    const sanitizedImages = Array.isArray(body.images)
      ? body.images.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : undefined;

    if (sanitizedImages && sanitizedImages.length < 3) {
      return NextResponse.json(
        { error: "Um produto deve manter no minimo 3 imagens." },
        { status: 400 }
      );
    }

    const updates = { ...body } as typeof body;
    if (sanitizedImages) {
      updates.images = sanitizedImages;
      updates.image = body.image ?? sanitizedImages[0];
    } else {
      delete updates.images;
    }

    if (!updates.image) {
      delete updates.image;
    }

    const updated = await updateMenuItem(context.params.id, {
      ...updates
    });

    if (!updated) {
      return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const deleted = await deleteMenuItem(context.params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao remover item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
