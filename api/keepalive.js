// Supabase free tier pauses projects after 7 days without activity; a daily query keeps it awake.
export async function GET() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "missing env" }, { status: 500 });
  const res = await fetch(`${url}/rest/v1/households?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return Response.json({ ok: res.ok, status: res.status }, { status: res.ok ? 200 : 502 });
}
