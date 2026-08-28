import { StorageAdapter, UploadResult } from "./types";
import { createId } from "@paralleldrive/cuid2";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

// Fully-functional local filesystem storage — the default/fallback adapter
// so uploads work out of the box with zero external setup. Files are written
// under public/uploads so Next.js serves them directly.

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export class LocalStorageAdapter implements StorageAdapter {
  readonly provider = "LOCAL" as const;

  async isConfigured() {
    return true;
  }

  async uploadFile({ fileName, buffer, folderHint }: { fileName: string; mimeType: string; buffer: Buffer; folderHint: string }): Promise<UploadResult> {
    const safeFolder = folderHint.replace(/[^a-zA-Z0-9_-]/g, "_");
    const dir = path.join(UPLOAD_ROOT, safeFolder);
    await mkdir(dir, { recursive: true });

    const fileId = createId();
    const ext = path.extname(fileName);
    const storedName = `${fileId}${ext}`;
    await writeFile(path.join(dir, storedName), buffer);

    const url = `/uploads/${safeFolder}/${storedName}`;
    return { externalFileId: `${safeFolder}/${storedName}`, externalFolderId: safeFolder, url, sizeBytes: buffer.length };
  }

  async getDownloadUrl(externalFileId: string) {
    return `/uploads/${externalFileId}`;
  }

  async deleteFile(externalFileId: string) {
    try {
      await unlink(path.join(UPLOAD_ROOT, externalFileId));
    } catch {
      // already gone — fine
    }
  }
}
