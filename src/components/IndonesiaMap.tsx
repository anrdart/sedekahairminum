import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls } from "@/components/ui/map";
import { useEffect, useState } from "react";

interface Props {
  points: Array<{ lng: number; lat: number; name: string; alamat: string; galon: number }>;
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const update = () => {
      setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export default function IndonesiaMapComponent({ points }: Props) {
  const theme = useTheme();

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <Map
        theme={theme}
        center={[110.58, -7.955]}
        zoom={11}
        minZoom={9}
        maxZoom={16}
      >
        <MapControls position="bottom-right" showZoom />
        {points.map((p, i) => (
          <MapMarker key={i} longitude={p.lng} latitude={p.lat}>
            <MarkerContent>
              <div style={{
                width: Math.max(12, p.galon * 1.2),
                height: Math.max(12, p.galon * 1.2),
                borderRadius: "50%",
                background: "#5ee4f0",
                border: "2px solid rgba(255,255,255,0.85)",
                boxShadow: "0 0 10px rgba(94, 228, 240, 0.5)",
                cursor: "pointer",
              }} />
            </MarkerContent>
            <MarkerTooltip>
              <div style={{ textAlign: "left", maxWidth: 220 }}>
                <strong style={{ fontSize: 12 }}>{p.name}</strong>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{p.alamat}</div>
                <div style={{ fontSize: 11, marginTop: 4, color: "#5ee4f0" }}>{p.galon} galon/distribusi</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
