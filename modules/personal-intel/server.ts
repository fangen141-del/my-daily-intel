import { defineServerModule } from "@aihot/backend/modules";
import { sql } from "@aihot/backend/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default defineServerModule({
  name: "personal-intel",
  http(app) {
    app.get("/api/personal-intel/story-map", async (req, reply) => {
      const raw = String((req.query as { factIds?: string }).factIds ?? "");
      const factIds = [...new Set(raw.split(",").map(x => x.trim()).filter(x => UUID.test(x)))].slice(0, 100);
      if (!factIds.length) return reply.header("Cache-Control","no-store").send({ mappings: [] });

      const rows = await sql<{ fact_id: string; story_id: string | null; story_title: string | null }[]>`
        SELECT f.public_id::text AS fact_id,
               st.public_id::text AS story_id,
               st.title AS story_title
        FROM facts f
        LEFT JOIN stories st ON st.id = f.story_id AND st.merged_into IS NULL
        WHERE f.public_id::text = ANY(${factIds}::text[])
      `;
      const by = new Map(rows.map(r => [r.fact_id, r]));
      return reply.header("Cache-Control","private, max-age=60").send({
        mappings: factIds.map(factId => {
          const r = by.get(factId);
          return {
            factId,
            story: r?.story_id ? { publicId: r.story_id, title: r.story_title ?? "事件" } : null,
          };
        }),
      });
    });
  },
});
