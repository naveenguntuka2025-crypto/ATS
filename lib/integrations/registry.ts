import type { JobBoardProvider } from "@/db/schema";
import type { JobBoardAdapter } from "./types";
import { diceAdapter } from "./dice";
import { linkedinAdapter } from "./linkedin";
import { monsterAdapter } from "./monster";
import { indeedAdapter } from "./indeed";
import { careerbuilderAdapter } from "./careerbuilder";
import { ziprecruiterAdapter } from "./ziprecruiter";

export const jobBoardAdapters: Record<JobBoardProvider, JobBoardAdapter> = {
  DICE: diceAdapter,
  LINKEDIN: linkedinAdapter,
  MONSTER: monsterAdapter,
  INDEED: indeedAdapter,
  CAREERBUILDER: careerbuilderAdapter,
  ZIPRECRUITER: ziprecruiterAdapter,
};

export function getJobBoardAdapter(provider: JobBoardProvider): JobBoardAdapter {
  return jobBoardAdapters[provider];
}
