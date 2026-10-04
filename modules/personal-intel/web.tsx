import { defineWebModule } from "@aihot/web/modules";
import { IconHeart } from "@aihot/web/components/icons";
import HomeFocus from "./web/HomeFocus.tsx";

export default defineWebModule({
  name: "personal-intel",
  sidebar: {
    section: "内容",
    items: [{ to: "/focus", label: "我的关注", icon: IconHeart }],
  },
  tools: [
    { to: "/focus", label: "我的关注", icon: <IconHeart size={18} /> },
    { to: "/focus/manage", label: "管理我的关注", icon: <IconHeart size={18} /> },
  ],
  root: { Top: HomeFocus },
});
