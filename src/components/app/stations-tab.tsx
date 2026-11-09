"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Navigation, Search } from "lucide-react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

type Station = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  openNow: boolean | null;
  fuelTypes: string[];
};
type Origin = { lat: number; lng: number };

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
let optionsSet = false;

function fmtDistance(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export function StationsTab() {
  const { t, lang } = useI18n();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error" | "no_key">(MAPS_KEY ? "loading" : "no_key");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[] | null>(null);
  const [place, setPlace] = useState("");
  const [origin, setOrigin] = useState<Origin | null>(null);

  // Tải bản đồ (không xin quyền vị trí ở bước này).
  useEffect(() => {
    if (!MAPS_KEY) return;
    let cancelled = false;
    if (!optionsSet) {
      setOptions({ key: MAPS_KEY, v: "weekly" });
      optionsSet = true;
    }
    importLibrary("maps")
      .then(({ Map }) => {
        if (cancelled || !mapEl.current) return;
        mapRef.current = new Map(mapEl.current, {
          center: { lat: 16.0544, lng: 108.2022 },
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        setMapState("ready");
      })
      .catch(() => !cancelled && setMapState("error"));
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  // Vẽ marker khi có kết quả.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapState !== "ready") return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (!origin) return;
    const bounds = new google.maps.LatLngBounds();
    markersRef.current.push(
      new google.maps.Marker({
        map,
        position: origin,
        title: t("you"),
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      }),
    );
    bounds.extend(origin);
    for (const s of stations ?? []) {
      markersRef.current.push(new google.maps.Marker({ map, position: { lat: s.lat, lng: s.lng }, title: s.name }));
      bounds.extend({ lat: s.lat, lng: s.lng });
    }
    if ((stations ?? []).length) map.fitBounds(bounds, 48);
    else {
      map.setCenter(origin);
      map.setZoom(14);
    }
  }, [stations, origin, mapState, t]);

  const fetchStations = useCallback(
    async (o: Origin) => {
      setOrigin(o);
      setStations(null);
      try {
        const res = await fetch(`/api/stations?lat=${o.lat}&lng=${o.lng}&lang=${lang}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error === "not_configured" ? t("notConfigured") : t("stationsError"));
          setStations([]);
          return;
        }
        setStations(data.stations);
      } catch {
        setMessage(t("stationsError"));
        setStations([]);
      }
    },
    [lang, t],
  );

  function findNearby() {
    setMessage(null);
    if (!("geolocation" in navigator)) {
      setMessage(t("locationUnsupported"));
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetchStations({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBusy(false);
      },
      (e) => {
        setMessage(e.code === e.PERMISSION_DENIED ? t("locationDenied") : t("locationUnavailable"));
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function searchPlace(ev: React.FormEvent) {
    ev.preventDefault();
    if (place.trim().length < 2) return;
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(place.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error === "no_results" ? t("placeNotFound") : data.error === "not_configured" ? t("notConfigured") : t("stationsError"));
      } else {
        await fetchStations({ lat: data.lat, lng: data.lng });
      }
    } catch {
      setMessage(t("stationsError"));
    } finally {
      setBusy(false);
    }
  }

  const searching = busy || (origin !== null && stations === null);

  return (
    <div className="space-y-4">
      <div className="relative h-[42dvh] min-h-64 overflow-hidden rounded-xl border bg-muted">
        <div ref={mapEl} className="size-full" />
        {mapState === "loading" && <Skeleton className="absolute inset-0 rounded-none" />}
        {(mapState === "error" || mapState === "no_key") && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
            <span className="flex flex-col items-center gap-2">
              <MapPin className="size-6" />
              {mapState === "no_key" ? t("notConfigured") : t("mapUnavailable")}
            </span>
          </div>
        )}
      </div>

      <Button size="lg" className="h-12 w-full text-base" onClick={findNearby} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <LocateFixed />}
        {busy ? t("searching") : t("findNearby")}
      </Button>

      <form onSubmit={searchPlace} className="space-y-1.5">
        <Label htmlFor="place">{t("manualPlace")}</Label>
        <div className="flex gap-2">
          <Input
            id="place"
            className="h-11 text-base"
            value={place}
            placeholder={t("manualPlaceHolder")}
            onChange={(e) => setPlace(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="h-11 px-4" disabled={busy || place.trim().length < 2}>
            <Search /> <span className="sr-only sm:not-sr-only">{t("search")}</span>
          </Button>
        </div>
      </form>

      {message && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {origin && (
        <section aria-labelledby="nearby-title" className="space-y-3">
          <h2 id="nearby-title" className="text-lg font-semibold">
            {t("nearbyList")}
          </h2>
          {searching && stations === null ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : stations && stations.length === 0 && !message ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("noStations")}</p>
          ) : (
            <ul className="space-y-3">
              {(stations ?? []).map((s) => (
                <li key={s.id}>
                  <Card size="sm">
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">{s.name}</p>
                        <Badge variant="secondary">{fmtDistance(s.distance)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{s.address}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {s.openNow !== null && (
                          <Badge variant={s.openNow ? "default" : "outline"}>{s.openNow ? t("openNow") : t("closedNow")}</Badge>
                        )}
                        {s.fuelTypes.length > 0 && (
                          <span className="text-muted-foreground">
                            {t("fuelTypes")}: {s.fuelTypes.join(", ")}
                          </span>
                        )}
                        <a
                          className="ml-auto inline-flex h-10 items-center gap-1 rounded-lg px-2 font-medium text-primary underline-offset-4 hover:underline"
                          href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&destination_place_id=${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="size-4" /> {t("openInMaps")}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
