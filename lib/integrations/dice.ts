import { createStubAdapter } from "./base-stub";

// Dice (DHI Group) does not offer an open self-serve API. Live integration
// (candidate/resume feed import, job posting push) requires becoming an
// approved Dice technology/data partner. Runs in stub mode until then —
// see lib/integrations/README.md for how to wire in real calls once you
// have partner credentials.
export const diceAdapter = createStubAdapter("DICE");
