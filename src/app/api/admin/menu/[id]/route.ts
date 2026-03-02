import { NextResponse } from "next/server";
import { deleteMenuItem, updateMenuItem } from "@/lib/data-store";
import { requireAdminSession } from "@/lib/auth";
import { MenuCategory } from "@/lib/types";

const allowedCategories = new Set<MenuCategory>(["Masculino", "Feminino", "Unissex", "Colecoes"]);

type Context = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, context: Context) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    category?: MenuCategory;
    featured?: boolean;
    available?: boolean;
  };

  if (body.category && !allowedCategories.has(body.category)) {
    return NextResponse.json({ error: "Categoria invalida" }, { status: 400 });
  }

  const updated = await updateMenuItem(context.params.id, body);

  if (!updated) {
    return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: Context) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const deleted = await deleteMenuItem(context.params.id);

  if (!deleted) {
    return NextResponse.json({ error: "Item nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
