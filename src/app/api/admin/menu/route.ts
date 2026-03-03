import { NextResponse } from "next/server";
import { addMenuItem, getMenuItems } from "@/lib/data-store";
import { requireAdminSession } from "@/lib/auth";
import { MenuCategory } from "@/lib/types";

const allowedCategories = new Set<MenuCategory>(["Masculino", "Feminino", "Unissex", "Kits"]);

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const items = await getMenuItems();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
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

  const sanitizedImages = Array.isArray(body.images)
    ? body.images.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const primaryImage = body.image || sanitizedImages[0];

  if (!body.name || !body.description || typeof body.price !== "number" || !primaryImage) {
    return NextResponse.json({ error: "Dados obrigatorios ausentes" }, { status: 400 });
  }

  if (!body.category || !allowedCategories.has(body.category)) {
    return NextResponse.json({ error: "Categoria invalida" }, { status: 400 });
  }

  if (sanitizedImages.length < 3) {
    return NextResponse.json(
      { error: "Cada novo produto deve ter no minimo 3 imagens." },
      { status: 400 }
    );
  }

  const item = await addMenuItem({
    name: body.name,
    description: body.description,
    price: body.price,
    image: primaryImage,
    images: sanitizedImages.length > 0 ? sanitizedImages : [primaryImage],
    category: body.category,
    featured: Boolean(body.featured),
    available: body.available ?? true
  });

  return NextResponse.json(item, { status: 201 });
}
