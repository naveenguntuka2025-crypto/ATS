import { StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./local";
import { ZohoWorkDriveAdapter } from "./zoho-workdrive";
import { db } from "@/db/client";
import { storageIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";

const local = new LocalStorageAdapter();
const zoho = new ZohoWorkDriveAdapter();

/** Returns the active storage adapter — Zoho WorkDrive if enabled & configured, else local disk. */
export async function getActiveStorageAdapter(): Promise<StorageAdapter> {
  const [row] = await db
    .select()
    .from(storageIntegrations)
    .where(eq(storageIntegrations.provider, "ZOHO_WORKDRIVE"))
    .limit(1);

  if (row?.enabled && (await zoho.isConfigured())) {
    return zoho;
  }
  return local;
}
