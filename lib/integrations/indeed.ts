import { createStubAdapter } from "./base-stub";

// Indeed's employer APIs (Apply/Sponsored Jobs) require an approved partner
// integration — no open self-serve resume-database API. Runs in stub mode
// until partner credentials are configured.
export const indeedAdapter = createStubAdapter("INDEED");
