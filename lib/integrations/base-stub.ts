import { JobBoardAdapter, ExternalCandidate, PostResult } from "./types";
import { db } from "@/db/client";
import { jobBoardIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { JobBoardProvider } from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";

const SAMPLE_TITLES = ["Senior Java Developer", "React Frontend Engineer", "DevOps Engineer", "Data Engineer", "QA Automation Engineer"];
const SAMPLE_LOCATIONS = ["Remote", "Dallas, TX", "New York, NY", "Chicago, IL", "Austin, TX"];

/**
 * Shared stub implementation used by every job-board adapter until real
 * partner API credentials are configured for that provider (see
 * lib/integrations/README.md). Once `job_board_integrations.enabled` is true
 * AND credentials are present, `isConfigured()` returns true — at that point
 * you replace the simulated branches below with real fetch() calls in the
 * provider-specific file, using the same credentials.
 */
export function createStubAdapter(provider: JobBoardProvider): JobBoardAdapter {
  async function loadRow() {
    const [row] = await db.select().from(jobBoardIntegrations).where(eq(jobBoardIntegrations.provider, provider)).limit(1);
    return row || null;
  }

  return {
    provider,

    async isConfigured() {
      const row = await loadRow();
      return !!(row?.enabled && row?.credentials);
    },

    async postRequirement(requirement) {
      const configured = await this.isConfigured();
      const result: PostResult = {
        externalPostingId: `${provider.toLowerCase()}-stub-${createId()}`,
        postingUrl: undefined,
        raw: {
          stub: true,
          configured,
          note: configured
            ? `${provider}: credentials are present, but this adapter's postRequirement() still needs the real API call wired in (see lib/integrations/README.md).`
            : `${provider}: no partner API credentials configured — this is a simulated posting response for "${requirement.title}".`,
        },
      };
      return result;
    },

    async searchCandidates(query) {
      const configured = await this.isConfigured();
      const count = 3;
      const results: ExternalCandidate[] = Array.from({ length: count }).map((_, i) => {
        const id = `${provider.toLowerCase()}-${createId()}`;
        return {
          externalId: id,
          fullName: `Sample Candidate ${i + 1}`,
          title: SAMPLE_TITLES[(i + query.keywords.length) % SAMPLE_TITLES.length],
          location: query.location || SAMPLE_LOCATIONS[i % SAMPLE_LOCATIONS.length],
          skills: query.keywords.split(",").map((s) => s.trim()).filter(Boolean),
          resumeUrl: undefined,
          raw: {
            stub: true,
            configured,
            note: `Simulated ${provider} search result — replace with a real API call once partner credentials are configured.`,
          },
        };
      });
      return results;
    },

    async importCandidate(externalId) {
      const configured = await this.isConfigured();
      return {
        externalId,
        fullName: "Imported Candidate (stub)",
        title: SAMPLE_TITLES[0],
        location: SAMPLE_LOCATIONS[0],
        skills: [],
        resumeUrl: undefined,
        raw: {
          stub: true,
          configured,
          note: `Simulated ${provider} candidate import for ${externalId} — no resume/profile data available until real credentials are wired in.`,
        },
      };
    },
  };
}
