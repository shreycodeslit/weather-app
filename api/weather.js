// Server-side proxy for OpenWeather. Runs as a Vercel Edge Function, so the
// API key lives in OPENWEATHER_API_KEY and never reaches the browser.
export const config = { runtime: 'edge' };

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...extra } });

export default async function handler(req) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return json({ message: 'The server is missing OPENWEATHER_API_KEY.' }, 500);

  const params = new URL(req.url).searchParams;
  const q = (params.get('q') || '').trim().slice(0, 80);
  const lat = Number(params.get('lat')), lon = Number(params.get('lon'));
  const upstream = new URL('https://api.openweathermap.org/data/2.5/weather');
  if (q) upstream.searchParams.set('q', q);
  else if (params.get('lat') && params.get('lon') && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    upstream.searchParams.set('lat', String(lat));
    upstream.searchParams.set('lon', String(lon));
  } else return json({ message: 'Send a city (q) or coordinates (lat, lon).' }, 400);
  upstream.searchParams.set('units', 'metric');
  upstream.searchParams.set('appid', key);

  const res = await fetch(upstream);
  const data = await res.json().catch(() => ({}));
  // Same body and status as OpenWeather, so the front end works unchanged; cache briefly at the edge
  return json(data, res.status, { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' });
}
