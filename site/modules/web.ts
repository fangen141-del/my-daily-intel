// What the site's modules add to the web pages (site/modules/index.ts).
import type { WebModule } from "@aihot/web/modules";
import personalIntel from "../../modules/personal-intel/web";

export const WEB_MODULES: readonly WebModule[] = [personalIntel];
