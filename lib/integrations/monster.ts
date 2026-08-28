import { createStubAdapter } from "./base-stub";

// Monster's API access is provisioned through a commercial partner
// agreement, not open self-serve signup. Runs in stub mode until partner
// credentials are configured.
export const monsterAdapter = createStubAdapter("MONSTER");
