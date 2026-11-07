import Anthropic from "npm:@anthropic-ai/sdk@1.6.0";

const MODEL = "claude-opus-5-5";
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["raw", "name", "zone"],
        properties: {
          raw: { type: "string", description: "Text řádku z účtenky, nebo krátký popis toho, co je na fotce vidět." },
          name: { type: "string", description: "Obecný český název potraviny malými písmeny." },
          zone: { type: "string", enum: ["lednice", "mrazak", "spiz"] },
        },
      },
    },
  },
};

const SYSTEM = `Pomáháš české domácnosti vést přehled o tom, co mají doma. Dostaneš fotky účtenek z nákupu, nákupních tašek, lednice, mrazáku nebo spíže a sepíšeš z nich potraviny.

Pravidla:
- name je obecný název potraviny, jak by ho napsal člověk do seznamu: malými písmeny, česky, bez značky, gramáže a procent tuku („mléko“, „máslo“, „kuřecí stehna“, „smetana ke šlehání“).
- Když je položka stejná jako něco ze seznamu známých surovin, použij přesně ten známý název.
- zone: lednice pro chlazené, mrazak pro mražené, spiz pro trvanlivé a pečivo.
- raw: u účtenky přesný text řádku, jinak krátký popis toho, co vidíš.
- Vynech nepotraviny (drogerie, tašky, zálohy), slevy a mezisoučty. Stejnou položku uveď jen jednou.
- Když na fotkách žádné potraviny nejsou, vrať prázdný seznam.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "missing_api_key" }, 500);

  let body: { images?: { media_type?: string; data?: string }[]; known?: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const images = (body.images ?? []).slice(0, MAX_IMAGES);
  if (!images.length) return json({ error: "no_images" }, 400);
  for (const img of images) {
    if (!img.data || !MEDIA_TYPES.includes(img.media_type as MediaType)) return json({ error: "invalid_image" }, 400);
    if ((img.data.length * 3) / 4 > MAX_IMAGE_BYTES) return json({ error: "image_too_large" }, 413);
  }
  const known = (body.known ?? []).filter((s) => typeof s === "string").slice(0, 600);

  const client = new Anthropic({ apiKey: key });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            ...images.map((img) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: img.media_type as MediaType, data: img.data! },
            })),
            { type: "text", text: `Známé suroviny domácnosti: ${known.length ? known.join(", ") : "zatím žádné"}.\n\nSepiš potraviny z fotek.` },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") return json({ error: "refused" }, 422);
    if (response.stop_reason === "max_tokens") return json({ error: "too_many_items" }, 422);
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return json({ error: "empty_response" }, 502);
    const parsed = JSON.parse(text.text) as { items: { raw: string; name: string; zone: string }[] };
    return json({ items: parsed.items });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "rate_limited" }, 429);
    if (e instanceof Anthropic.APIError) {
      console.error("anthropic", e.status, e.message);
      return json({ error: "upstream_error" }, 502);
    }
    console.error(e);
    return json({ error: "internal_error" }, 500);
  }
});
