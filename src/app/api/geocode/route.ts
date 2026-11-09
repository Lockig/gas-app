import { NextResponse } from "next/server";


/** Tìm toạ độ từ địa chỉ nhập tay (Places Text Search). */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 200) return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({ textQuery: q, maxResultCount: 1, regionCode: "VN" }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("Geocode error", res.status, await res.text());
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }
    const data = (await res.json()) as {
      places?: { formattedAddress?: string; location?: { latitude: number; longitude: number } }[];
    };
    const p = data.places?.[0];
    if (!p?.location) return NextResponse.json({ error: "no_results" }, { status: 404 });
    return NextResponse.json({ lat: p.location.latitude, lng: p.location.longitude, address: p.formattedAddress ?? q });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
