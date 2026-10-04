import { defineModule } from "@aihot/contracts/modules";

export default defineModule({
  name: "personal-intel",
  pages: [
    { path: "focus", file: "web/routes/focus.tsx" },
    { path: "focus/manage", file: "web/routes/manage.tsx" },
  ],
});
