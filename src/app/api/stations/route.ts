import { NextResponse } from "next/server";


type Place = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  currentOpeningHours?: { openNow?: boolean };
  regularOpeningHours?: { openNow?: boolean };
  fuelOptions?: { fuelPrices?: { type?: string }[] };
};

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "invalid_location" }, { status: 400 });
  }
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours.openNow,places.fuelOptions",
      },
      body: JSON.stringify({
        includedTypes: ["gas_station"],
        maxResultCount: 10,
        rankPreference: "DISTANCE",
        languageCode: sp.get("lang") === "en" ? "en" : "vi",
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("Places error", res.status, await res.text());
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }
    const data = (await res.json()) as { places?: Place[] };
    const stations = (data.places ?? [])
      .filter((p) => p.location)
      .map((p) => ({
        id: p.id,
        name: p.displayName?.text ?? "",
        address: p.formattedAddress ?? "",
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        distance: Math.round(distanceMeters(lat, lng, p.location!.latitude, p.location!.longitude)),
        openNow: p.currentOpeningHours?.openNow ?? null,
        // Chỉ có khi nguồn cung cấp; không suy đoán.
        fuelTypes: (p.fuelOptions?.fuelPrices ?? []).map((f) => f.type).filter(Boolean) as string[],
      }))
      .sort((a, b) => a.distance - b.distance);
    return NextResponse.json({ stations });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
