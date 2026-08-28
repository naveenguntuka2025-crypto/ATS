import { createStubAdapter } from "./base-stub";

// ZipRecruiter offers a job-distribution API for ATS partners but it's a
// partner program, not open self-serve. Runs in stub mode until partner
// credentials are configured.
export const ziprecruiterAdapter = createStubAdapter("ZIPRECRUITER");
