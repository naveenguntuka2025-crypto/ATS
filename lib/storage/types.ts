export type UploadResult = {
  externalFileId: string | null;
  externalFolderId: string | null;
  url: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  readonly provider: "LOCAL" | "ZOHO_WORKDRIVE";
  /** Whether this adapter has everything it needs (credentials, config) to make real calls. */
  isConfigured(): Promise<boolean>;
  uploadFile(params: { fileName: string; mimeType: string; buffer: Buffer; folderHint: string }): Promise<UploadResult>;
  /** Returns a URL the browser can use to download/view the file. */
  getDownloadUrl(externalFileId: string): Promise<string>;
  deleteFile(externalFileId: string): Promise<void>;
}
