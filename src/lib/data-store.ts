import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { get as getBlob, put as putBlob } from "@vercel/blob";
import { MenuItem, Order } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const menuPath = path.join(dataDir, "menu.json");
const ordersPath = path.join(dataDir, "orders.json");
const blobMenuPath = "catalog/menu.json";
const blobOrdersPath = "catalog/orders.json";
const mutationRetryDelayMs = 500;
const mutationMaxAttempts = 30;

const initialMenu: MenuItem[] = [];

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

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readMenuForMutation() {
  for (let attempt = 1; attempt <= mutationMaxAttempts; attempt += 1) {
    try {
      const menu = await readJsonFile<MenuItem[]>(menuPath, [], { strictBlobRead: true });
      return menu.map((item) => normalizeMenuItem(item));
    } catch {
      if (attempt === mutationMaxAttempts) {
        throw new Error("Falha ao ler dados persistidos no Blob.");
      }

      await wait(mutationRetryDelayMs);
    }
  }

  return [];
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

function isReadonlyWriteError(error: unknown) {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return code === "EROFS" || code === "EPERM" || code === "EACCES";
}

function getBlobPathForFile(filePath: string) {
  if (filePath === menuPath) return blobMenuPath;
  if (filePath === ordersPath) return blobOrdersPath;
  return null;
}

async function readBlobJson<T>(blobPath: string, token: string) {
  const result = await getBlob(blobPath, { access: "public", token });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const raw = await new Response(result.stream).text();
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as T;
}

async function writeBlobJson<T>(blobPath: string, data: T, token: string) {
  await putBlob(blobPath, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token
  });
}

async function readJsonFile<T>(
  filePath: string,
  fallback: T,
  options?: { strictBlobRead?: boolean }
): Promise<T> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const blobPath = getBlobPathForFile(filePath);
  const strictBlobRead = Boolean(options?.strictBlobRead);

  if (blobToken && blobPath) {
    try {
      const blobValue = await readBlobJson<T>(blobPath, blobToken);
      if (blobValue !== null) {
        return blobValue;
      }
      return fallback;
    } catch {
      if (strictBlobRead) {
        throw new Error("Falha ao ler dados persistidos no Blob.");
      }

      return fallback;
    }
  }

  await ensureDataFiles();
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as T;

    if (blobToken && blobPath) {
      await writeBlobJson(blobPath, parsed, blobToken).catch(() => {
        // Evita falhar a leitura caso o blob esteja temporariamente indisponivel.
      });
    }

    return parsed;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const blobPath = getBlobPathForFile(filePath);
  if (blobToken && blobPath) {
    await writeBlobJson(blobPath, data, blobToken);
    return;
  }

  try {
    await ensureDataFiles();
    await writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    if (isReadonlyWriteError(error)) {
      throw new Error(
        "Persistencia indisponivel neste ambiente. Configure BLOB_READ_WRITE_TOKEN para salvar o catalogo."
      );
    }

    throw error;
  }
}

export async function getMenuItems() {
  const menu = await readJsonFile<MenuItem[]>(menuPath, []);
  return menu.map((item) => normalizeMenuItem(item));
}

export async function addMenuItem(input: Omit<MenuItem, "id">) {
  const menu = await readMenuForMutation();
  const newItem = normalizeMenuItem({
    ...input,
    id: randomUUID()
  });

  menu.push(newItem);
  await writeJsonFile(menuPath, menu);
  return newItem;
}

export async function updateMenuItem(id: string, updates: Partial<Omit<MenuItem, "id">>) {
  const menu = await readMenuForMutation();
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
  for (let attempt = 1; attempt <= mutationMaxAttempts; attempt += 1) {
    const menu = await readMenuForMutation();
    const index = menu.findIndex((item) => item.id === id);

    if (index === -1) {
      if (attempt === mutationMaxAttempts) {
        return false;
      }

      await wait(mutationRetryDelayMs);
      continue;
    }

    menu.splice(index, 1);
    await writeJsonFile(menuPath, menu);

    const verification = await readMenuForMutation();

    if (!verification.some((item) => item.id === id)) {
      return true;
    }

    if (attempt < mutationMaxAttempts) {
      await wait(mutationRetryDelayMs);
    }
  }

  return false;
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
