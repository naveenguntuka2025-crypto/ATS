"use server";

import { db } from "@/db/client";
import { documents, candidates } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getActiveStorageAdapter } from "@/lib/storage/registry";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

type EntityType = "CANDIDATE" | "REQUIREMENT" | "SUBMISSION";

export async function uploadDocumentAction(
  entityType: EntityType,
  entityId: string,
  path: string,
  formData: FormData
) {
  const user = await requireUser();

  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") || "OTHER");
  if (!file || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const adapter = await getActiveStorageAdapter();

  let result;
  try {
    result = await adapter.uploadFile({
      fileName: file.name,
      mimeType: file.type,
      buffer,
      folderHint: `${entityType.toLowerCase()}-${entityId}`,
    });
  } catch (err: any) {
    // If the configured adapter (e.g. Zoho, not yet set up) fails, don't lose
    // the upload — fall back to local storage and surface why in the log.
    console.error(`[documents] ${adapter.provider} upload failed, falling back to local:`, err?.message);
    const { LocalStorageAdapter } = await import("@/lib/storage/local");
    result = await new LocalStorageAdapter().uploadFile({
      fileName: file.name,
      mimeType: file.type,
      buffer,
      folderHint: `${entityType.toLowerCase()}-${entityId}`,
    });
  }

  await db.insert(documents).values({
    entityType,
    entityId,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: result.sizeBytes,
    category,
    storageProvider: adapter.provider,
    externalFileId: result.externalFileId,
    externalFolderId: result.externalFolderId,
    url: result.url,
    uploadedById: user.id,
  });

  if (entityType === "CANDIDATE" && category === "RESUME") {
    await db.update(candidates).set({ resumeUrl: result.url }).where(eq(candidates.id, entityId));
  }

  revalidatePath(path);
}

export async function deleteDocumentAction(documentId: string, path: string) {
  await requireUser();
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!doc) return;

  const adapter = await getActiveStorageAdapter();
  if (doc.externalFileId) {
    try {
      await adapter.deleteFile(doc.externalFileId);
    } catch (err) {
      console.error("[documents] delete failed at storage provider:", err);
    }
  }

  await db.delete(documents).where(eq(documents.id, documentId));
  revalidatePath(path);
}
