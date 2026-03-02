import { NextResponse } from "next/server";
import { createOrder } from "@/lib/data-store";
import { CartItem, CustomerData } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    items?: CartItem[];
    customer?: CustomerData;
  };

  const items = body.items ?? [];
  const customer = body.customer;

  if (
    !customer ||
    !customer.name ||
    !customer.phone ||
    !customer.address
  ) {
    return NextResponse.json({ error: "Dados do cliente incompletos" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await createOrder({
    items,
    customer,
    total
  });

  return NextResponse.json({
    success: true,
    orderId: order.id,
    total: order.total,
    status: order.status
  });
}
