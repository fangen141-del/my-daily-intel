import { defineModule } from "@aihot/contracts/modules";

export default defineModule({
  name: "personal-intel",
  pages: [
    { path: "focus", file: "routes/focus.tsx" },
    { path: "focus/manage", file: "routes/manage.tsx" },
  ],
});
