// The modules this site runs (modules/<name>/, see docs/architecture.md).
import type { ModuleDeclaration } from "@aihot/contracts/modules";
import personalIntel from "../../modules/personal-intel/module";

export const MODULES: readonly ModuleDeclaration[] = [personalIntel];
