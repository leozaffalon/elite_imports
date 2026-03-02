import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MenuItem, Order } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const menuPath = path.join(dataDir, "menu.json");
const ordersPath = path.join(dataDir, "orders.json");

const initialMenu: MenuItem[] = [
  {
    id: "elite-1",
    name: "Sauvage Elixir (Dior)",
    description: "Notas de canela, lavanda e acorde amadeirado intenso com assinatura sofisticada.",
    price: 899,
    image: "/images/official/sauvage.png",
    images: ["/images/official/sauvage.png"],
    category: "Masculino",
    featured: true,
    available: true
  },
  {
    id: "elite-2",
    name: "Bleu de Chanel",
    description: "Cítrico amadeirado elegante, com incenso e cedro para uso diário e noturno.",
    price: 829,
    image: "/images/official/bleu.png",
    images: ["/images/official/bleu.png"],
    category: "Masculino",
    featured: true,
    available: true
  },
  {
    id: "elite-3",
    name: "La Vie Est Belle",
    description: "Perfume floral gourmand com íris, baunilha e pralinê de alta fixação.",
    price: 749,
    image: "/images/official/lavie.png",
    images: ["/images/official/lavie.png"],
    category: "Feminino",
    featured: true,
    available: true
  },
  {
    id: "elite-4",
    name: "Good Girl",
    description: "Floral oriental com jasmim e fava tonka, marcante e glamouroso.",
    price: 699,
    image: "/images/official/goodgirl.png",
    images: ["/images/official/goodgirl.png"],
    category: "Feminino",
    featured: false,
    available: true
  },
  {
    id: "elite-5",
    name: "Light Blue",
    description: "Fresco e cítrico, com limão siciliano e maçã verde em perfil mediterrâneo.",
    price: 589,
    image: "/images/official/lightblue.png",
    images: ["/images/official/lightblue.png"],
    category: "Unissex",
    featured: false,
    available: true
  },
  {
    id: "elite-6",
    name: "Oud Wood",
    description: "Blend de oud com cardamomo e baunilha seca, sofisticado e exclusivo.",
    price: 1190,
    image: "/images/official/oudwood.png",
    images: ["/images/official/oudwood.png"],
    category: "Unissex",
    featured: false,
    available: true
  },
  {
    id: "elite-7",
    name: "Kit Elite Signature",
    description: "Kit com miniaturas selecionadas para conhecer os best-sellers da loja.",
    price: 520,
    image: "/images/official/kit.png",
    images: ["/images/official/kit.png"],
    category: "Kits",
    featured: false,
    available: true
  },
  {
    id: "elite-8",
    name: "Discovery Set Unissex",
    description: "Seleção de miniaturas premium para testar fragrâncias importadas variadas.",
    price: 310,
    image: "/images/official/discovery.png",
    images: ["/images/official/discovery.png"],
    category: "Kits",
    featured: false,
    available: true
  }
];

const defaultImage = "/images/official/hero.png";

function normalizeCategory(category: unknown): MenuItem["category"] {
  const input = String(category ?? "").trim().toLowerCase();
  const mapping: Record<string, MenuItem["category"]> = {
    homme: "Masculino",
    masculino: "Masculino",
    men: "Masculino",
    femme: "Feminino",
    feminino: "Feminino",
    women: "Feminino",
    unisexe: "Unissex",
    unissex: "Unissex",
    unisex: "Unissex",
    coffrets: "Kits",
    kits: "Kits",
    kit: "Kits"
  };

  return mapping[input] ?? "Unissex";
}

function normalizeImages(images: unknown, image: unknown) {
  const fromArray = Array.isArray(images) ? images.filter((item): item is string => typeof item === "string") : [];
  const primary = typeof image === "string" && image ? image : fromArray[0];
  const normalized = [...new Set([...fromArray, primary].filter(Boolean))];

  if (normalized.length === 0) {
    return [defaultImage];
  }

  return normalized;
}

function normalizeMenuItem(item: Partial<MenuItem> & { id?: string }): MenuItem {
  const images = normalizeImages(item.images, item.image);

  return {
    id: item.id ?? randomUUID(),
    name: String(item.name ?? "").trim(),
    description: String(item.description ?? "").trim(),
    price: Number(item.price ?? 0),
    image: images[0] ?? defaultImage,
    images,
    category: normalizeCategory(item.category),
    featured: Boolean(item.featured),
    available: item.available ?? true
  };
}

async function ensureDataFiles() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(menuPath, "utf-8");
  } catch {
    await writeFile(menuPath, JSON.stringify(initialMenu, null, 2));
  }

  try {
    await readFile(ordersPath, "utf-8");
  } catch {
    await writeFile(ordersPath, JSON.stringify([], null, 2));
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataFiles();
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await ensureDataFiles();
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function getMenuItems() {
  const menu = await readJsonFile<MenuItem[]>(menuPath, initialMenu);
  return menu.map((item) => normalizeMenuItem(item));
}

export async function addMenuItem(input: Omit<MenuItem, "id">) {
  const menu = await getMenuItems();
  const newItem = normalizeMenuItem({
    ...input,
    id: randomUUID()
  });

  menu.push(newItem);
  await writeJsonFile(menuPath, menu);
  return newItem;
}

export async function updateMenuItem(id: string, updates: Partial<Omit<MenuItem, "id">>) {
  const menu = await getMenuItems();
  const index = menu.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = menu[index];
  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  ) as Partial<Omit<MenuItem, "id">>;

  const updated = normalizeMenuItem({
    ...current,
    ...sanitizedUpdates,
    id
  });

  menu[index] = updated;
  await writeJsonFile(menuPath, menu);
  return updated;
}

export async function deleteMenuItem(id: string) {
  const menu = await getMenuItems();
  const nextMenu = menu.filter((item) => item.id !== id);

  if (nextMenu.length === menu.length) {
    return false;
  }

  await writeJsonFile(menuPath, nextMenu);
  return true;
}

export async function createOrder(payload: Omit<Order, "id" | "createdAt" | "status">) {
  const orders = await readJsonFile<Order[]>(ordersPath, []);
  const order: Order = {
    ...payload,
    id: `EA-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "Recebido"
  };

  orders.unshift(order);
  await writeJsonFile(ordersPath, orders);
  return order;
}

export async function getOrders() {
  return readJsonFile<Order[]>(ordersPath, []);
}
