import { defineWebModule } from "../../apps/web/app/modules";
import { IconHeart } from "../../apps/web/app/components/icons";
import HomeFocus from "./HomeFocus";

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
