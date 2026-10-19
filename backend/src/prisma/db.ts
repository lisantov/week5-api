import postgres from "@prisma/orm-postgres/runtime";

import "temporal-polyfill/global";

import service from "../../service.ts";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

function loadComposerDatabase() {
  try {
    return service.load().database.client;
  } catch {
    return undefined;
  }
}

export const db =
  loadComposerDatabase() ??
  (process.env.DATABASE_URL
    ? postgres<Contract>({ contractJson, url: process.env.DATABASE_URL })
    : postgres<Contract>({ contractJson }));

function isAlreadyConnectedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "DRIVER.ALREADY_CONNECTED"
  );
}

let connection: Promise<void> | undefined;

export function connectDatabase(): Promise<void> {
  connection ??= db
    .connect()
    .then(() => undefined)
    .catch((error: unknown) => {
      // The ORM connects lazily on the first query. If a query runs before this
      // explicit connect() call, the driver reports DRIVER.ALREADY_CONNECTED —
      // the client is already (being) connected, which is exactly what we want.
      if (isAlreadyConnectedError(error)) return;
      connection = undefined;
      throw error;
    });
  return connection;
}
