import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls } from "@/components/ui/map";
import { useEffect, useRef, useState } from "react";

const distributionPoints = [
  { lng: 110.662, lat: -7.932, name: "PP An-Nur", alamat: "Ds Karangmojo, Kec. Karangmojo", galon: 6 },
  { lng: 110.601, lat: -7.963, name: "PP Fajrussa'adah", alamat: "Ds Kepek, Kec. Wonosari", galon: 8 },
  { lng: 110.670, lat: -7.925, name: "PP KI Ageng Wonokusumo", alamat: "Ds Jatiayu, Kec. Karangmojo", galon: 6 },
  { lng: 110.498, lat: -7.974, name: "PP Al-Kholifah", alamat: "Ds Mulusan, Kec. Paliyan", galon: 5 },
  { lng: 110.722, lat: -7.928, name: "PP Al-Murtadlo", alamat: "Ds Genjahan, Kec. Ponjong", galon: 10 },
  { lng: 110.548, lat: -7.958, name: "PP Al-Hikmah Gubuk Rubuh", alamat: "Ds Getas, Kec. Playen", galon: 8 },
  { lng: 110.540, lat: -7.952, name: "PP Ar-Ruhamaa'", alamat: "Playen II, Kec. Playen", galon: 10 },
  { lng: 110.608, lat: -7.955, name: "Pondok Nurul Jamil Al-Jumar", alamat: "Ds Duwet, Kec. Wonosari", galon: 6 },
  { lng: 110.535, lat: -7.945, name: "PP Nurulhadi 2", alamat: "Dsn. Ngleri Wetan, Kec. Playen", galon: 2 },
  { lng: 110.630, lat: -7.892, name: "PP Ash-Shiddiq 2", alamat: "Ds Jurangjero, Kec. Ngawen", galon: 8 },
  { lng: 110.432, lat: -8.018, name: "PP Hidayatul Mubtadiin Kunci", alamat: "Mendak, Girisekar, Kec. Panggang", galon: 5 },
  { lng: 110.595, lat: -7.970, name: "PP & Islamic Center Yasma Mulia", alamat: "Baleharjo, Kec. Wonosari", galon: 4 },
  { lng: 110.505, lat: -7.980, name: "PP Roudlotuth Tholabah", alamat: "Ds Karangasem, Kec. Paliyan", galon: 2 },
  { lng: 110.555, lat: -7.960, name: "PP Kun Solihan", alamat: "Ds Glidag, Kec. Playen", galon: 6 },
  { lng: 110.543, lat: -7.950, name: "Yayasan Panti Asuhan Islam", alamat: "Tumpak, Ngawu, Playen", galon: 14 },
  { lng: 110.670, lat: -7.985, name: "PP Thoriqul Mukminin", alamat: "Ds Semanu, Kec. Semanu", galon: 20 },
  { lng: 110.612, lat: -7.958, name: "PP Baitul Jannah Darussalam", alamat: "Butuh, Pulutan, Wonosari", galon: 6 },
  { lng: 110.590, lat: -7.950, name: "PP Assalafiyah Darussalam", alamat: "Ds Siraman, Kec. Wonosari", galon: 5 },
  { lng: 110.525, lat: -7.965, name: "PP Muhammadiyah Al-Mujahidin", alamat: "Ds Bandung, Kec. Playen", galon: 10 },
];

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

function hideSkeleton() {
  var skel = document.getElementById('map-skeleton');
  if (skel) skel.style.display = 'none';
}

export default function IndonesiaMapComponent() {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide skeleton as soon as React mounts — map container exists
    hideSkeleton();
    if (containerRef.current) {
      containerRef.current.style.opacity = '1';
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%", width: "100%",
        borderRadius: "var(--r-lg)", overflow: "hidden",
        opacity: 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <Map
        theme={theme}
        center={[110.58, -7.955]}
        zoom={11}
        minZoom={9}
        maxZoom={16}
      >
        <MapControls position="bottom-right" showZoom />
        {distributionPoints.map((p, i) => (
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
