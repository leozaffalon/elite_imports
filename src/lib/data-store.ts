import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MenuItem, Order } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const menuPath = path.join(dataDir, "menu.json");
const ordersPath = path.join(dataDir, "orders.json");

const initialMenu: MenuItem[] = [
  {
    id: "dodo-1",
    name: "Sauvage Elixir (Dior)",
    description: "Lavanda apimentada, madeiras secas e acorde amber para presença marcante.",
    price: 899,
    image: "/images/sauvage.svg",
    category: "Masculino",
    featured: true,
    available: true
  },
  {
    id: "dodo-2",
    name: "Bleu de Chanel", 
    description: "Citrus fresco com incenso e cedro, assinatura versatil para o dia todo.",
    price: 829,
    image: "/images/bleu.svg",
    category: "Masculino",
    featured: true,
    available: true
  },
  {
    id: "dodo-3",
    name: "La Vie Est Belle", 
    description: "Iris gourmand com baunilha e praliné, feminino e luminosa.",
    price: 749,
    image: "/images/lavie.svg",
    category: "Feminino",
    featured: true,
    available: true
  },
  {
    id: "dodo-4",
    name: "Good Girl", 
    description: "Jasmim, tuberosa e fava tonka para um floral oriental marcante.",
    price: 699,
    image: "/images/goodgirl.svg",
    category: "Feminino",
    featured: false,
    available: true
  },
  {
    id: "dodo-5",
    name: "Light Blue", 
    description: "Limão siciliano, maçã verde e almíscar limpo lembrando brisa mediterrânea.",
    price: 589,
    image: "/images/lightblue.svg",
    category: "Unissex",
    featured: false,
    available: true
  },
  {
    id: "dodo-6",
    name: "Oud Wood", 
    description: "Oud aveludado com cardamomo e baunilha, assinatura niche para noites.",
    price: 1190,
    image: "/images/oudwood.svg",
    category: "Unissex",
    featured: false,
    available: true
  },
  {
    id: "dodo-7",
    name: "Kit Essenciais Dodo", 
    description: "Cofre com 5 decants de 10ml selecionados pela curadoria Dodo Imports.",
    price: 520,
    image: "/images/kit.svg",
    category: "Colecoes",
    featured: false,
    available: true
  },
  {
    id: "dodo-8",
    name: "Discovery Unissex", 
    description: "Set degustação com 8 amostras best-sellers masculinos e femininos.",
    price: 310,
    image: "/images/discovery.svg",
    category: "Colecoes",
    featured: false,
    available: true
  }
];

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
  return readJsonFile<MenuItem[]>(menuPath, initialMenu);
}

export async function addMenuItem(input: Omit<MenuItem, "id">) {
  const menu = await getMenuItems();
  const newItem: MenuItem = {
    ...input,
    id: randomUUID()
  };

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
  const updated: MenuItem = {
    ...current,
    ...updates,
    id
  };

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
    id: `DODO-${Date.now()}`,
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
