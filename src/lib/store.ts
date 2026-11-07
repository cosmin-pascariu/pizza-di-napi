import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { MENU_SEED } from "./menu-seed";
import type { MenuItem, Order, OrderStatus } from "./types";

/**
 * Tiny JSON-file store. Good enough for a hackathon demo running on a single
 * instance; swap for SQLite/Postgres later without touching the API routes.
 */
interface Db {
  menu: MenuItem[];
  orders: Order[];
}

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(raw) as Db;
  } catch {
    return { menu: structuredClone(MENU_SEED), orders: [] };
  }
}

async function writeDb(db: Db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_FILE);
}

/** Serialises read-modify-write cycles so concurrent requests don't clobber each other. */
function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

export async function getMenu(): Promise<MenuItem[]> {
  // Older databases predate photos and nutrition info: fill missing fields from the seed.
  return (await readDb()).menu.map((m) => {
    const seed = MENU_SEED.find((s) => s.id === m.id);
    return {
      ...m,
      image: m.image ?? seed?.image,
      flour: m.flour ?? seed?.flour,
      kcal: m.kcal ?? seed?.kcal,
      portion: m.portion ?? seed?.portion,
      allergens: m.allergens ?? seed?.allergens,
    };
  });
}

export async function listOrders(): Promise<Order[]> {
  const { orders } = await readDb();
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return (await readDb()).orders.find((o) => o.id === id);
}

export function createOrder(
  data: Omit<Order, "id" | "createdAt" | "updatedAt">,
): Promise<Order> {
  return mutate((db) => {
    const now = new Date().toISOString();
    const order: Order = {
      ...data,
      // 128-bit random id: the tracking link can be shared but never guessed.
      id: randomBytes(16).toString("base64url"),
      createdAt: now,
      updatedAt: now,
    };
    db.orders.push(order);
    return order;
  });
}

export function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "paypalOrderId" | "paypalCaptureId" | "refund">>,
): Promise<Order | undefined> {
  return mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return undefined;
    Object.assign(order, patch, { updatedAt: new Date().toISOString() });
    return order;
  });
}

export function setOrderStatus(id: string, status: OrderStatus) {
  return updateOrder(id, { status });
}

export function updateMenuItem(
  id: string,
  patch: Partial<Pick<MenuItem, "name" | "description" | "price" | "available" | "tags">>,
): Promise<MenuItem | undefined> {
  return mutate((db) => {
    const item = db.menu.find((m) => m.id === id);
    if (!item) return undefined;
    Object.assign(item, patch);
    return item;
  });
}

export function addMenuItem(item: MenuItem): Promise<MenuItem | { error: string }> {
  return mutate((db) => {
    if (db.menu.some((m) => m.id === item.id)) return { error: `Item ${item.id} already exists` };
    db.menu.push(item);
    return item;
  });
}
