import { defineModule } from "@aihot/contracts/modules";

export default defineModule({
  name: "personal-intel",
  pages: [
    { path: "focus", file: "web/routes/focus.tsx" },
    { path: "focus/:id", file: "web/routes/detail.tsx" },
    { path: "focus/manage", file: "web/routes/manage.tsx" },
    { path: "focus/debug/:id", file: "web/routes/debug.tsx" },
  ],
  apiPaths: [/^\/api\/personal-intel\/story-map$/],
});
