import { StorageAdapter, UploadResult } from "./types";
import { db } from "@/db/client";
import { storageIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";

// Real Zoho WorkDrive integration — unlike Dice/LinkedIn/etc., Zoho WorkDrive
// has an open, self-serve API. You don't need a partner agreement, just a
// Zoho API Console app:
//
//   1. Go to https://api-console.zoho.com -> Add Client -> "Self Client"
//      (simplest for a server-to-server integration like this one).
//   2. Generate a grant token with scope: WorkDrive.files.ALL
//   3. Exchange it once for a refresh token (see Zoho's OAuth docs) — the
//      refresh token is what you store in the app's Integrations settings,
//      it doesn't expire.
//   4. In the ATS app: Admin -> Integrations -> Zoho WorkDrive, enter the
//      Client ID, Client Secret, Refresh Token, and the WorkDrive folder ID
//      to upload into (open the folder in WorkDrive, the ID is in the URL).
//
// NOTE: verify endpoint paths/params against the current Zoho WorkDrive API
// reference (https://www.zoho.com/workdrive/api/v1/) before going live —
// Zoho does version and adjust these from time to time.

type ZohoCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  rootFolderId: string;
  accountsBaseUrl?: string; // e.g. https://accounts.zoho.com (region-specific: .eu, .in, .com.cn, ...)
  apiBaseUrl?: string; // e.g. https://www.zohoapis.com (region-specific)
};

async function loadCredentials(): Promise<ZohoCredentials | null> {
  const [row] = await db
    .select()
    .from(storageIntegrations)
    .where(eq(storageIntegrations.provider, "ZOHO_WORKDRIVE"))
    .limit(1);
  if (!row || !row.enabled || !row.credentials) return null;
  try {
    const creds = JSON.parse(row.credentials) as ZohoCredentials;
    if (!creds.clientId || !creds.clientSecret || !creds.refreshToken || !creds.rootFolderId) return null;
    return creds;
  } catch {
    return null;
  }
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(creds: ZohoCredentials): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const base = creds.accountsBaseUrl || "https://accounts.zoho.com";
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: creds.refreshToken,
  });

  const res = await fetch(`${base}/oauth/v2/token?${params.toString()}`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Zoho OAuth token refresh failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Zoho OAuth token refresh returned no access_token: ${JSON.stringify(data)}`);
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 55 * 60 * 1000),
  };
  return cachedToken.accessToken;
}

export class ZohoWorkDriveAdapter implements StorageAdapter {
  readonly provider = "ZOHO_WORKDRIVE" as const;

  async isConfigured() {
    return (await loadCredentials()) !== null;
  }

  async uploadFile({ fileName, buffer, folderHint }: { fileName: string; mimeType: string; buffer: Buffer; folderHint: string }): Promise<UploadResult> {
    const creds = await loadCredentials();
    if (!creds) {
      throw new Error(
        "Zoho WorkDrive is not configured yet. Add credentials under Admin -> Integrations, or documents will be stored locally instead."
      );
    }

    const accessToken = await getAccessToken(creds);
    const apiBase = creds.apiBaseUrl || "https://www.zohoapis.com";

    const form = new FormData();
    form.append("parent_id", creds.rootFolderId);
    form.append("content", new Blob([new Uint8Array(buffer)]), fileName);

    const res = await fetch(`${apiBase}/workdrive/api/v1/upload`, {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Zoho WorkDrive upload failed (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    // Response shape per Zoho WorkDrive upload API: data.data[0].attributes.resource_id
    const fileId: string | undefined = data?.data?.[0]?.attributes?.resource_id ?? data?.data?.[0]?.id;
    if (!fileId) {
      throw new Error(`Zoho WorkDrive upload succeeded but no file id was returned: ${JSON.stringify(data)}`);
    }

    return {
      externalFileId: fileId,
      externalFolderId: creds.rootFolderId,
      url: `https://workdrive.zoho.com/file/${fileId}`,
      sizeBytes: buffer.length,
    };
  }

  async getDownloadUrl(externalFileId: string): Promise<string> {
    const creds = await loadCredentials();
    if (!creds) throw new Error("Zoho WorkDrive is not configured.");
    // WorkDrive's permalink view URL — for a direct download-bytes flow,
    // proxy through /workdrive/api/v1/download/{id} with a valid access
    // token server-side instead of exposing the token to the browser.
    return `https://workdrive.zoho.com/file/${externalFileId}`;
  }

  async deleteFile(externalFileId: string): Promise<void> {
    const creds = await loadCredentials();
    if (!creds) return;
    const accessToken = await getAccessToken(creds);
    const apiBase = creds.apiBaseUrl || "https://www.zohoapis.com";
    await fetch(`${apiBase}/workdrive/api/v1/files/${externalFileId}`, {
      method: "DELETE",
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    });
  }
}
