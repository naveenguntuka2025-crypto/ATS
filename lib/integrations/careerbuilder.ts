import { createStubAdapter } from "./base-stub";

// CareerBuilder's data/API products are sold through a sales/partner
// process. Runs in stub mode until partner credentials are configured.
export const careerbuilderAdapter = createStubAdapter("CAREERBUILDER");
