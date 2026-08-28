import { createStubAdapter } from "./base-stub";

// LinkedIn Talent Solutions APIs require a partner agreement (LinkedIn
// Talent Hub / Recruiter System Connect program) — no open self-serve API.
// Runs in stub mode until partner credentials are configured.
export const linkedinAdapter = createStubAdapter("LINKEDIN");
