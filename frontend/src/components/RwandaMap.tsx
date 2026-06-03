import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface DistrictData {
  name: string;
  cases: number;
  resolved: number;
  critical: number;
  lat: number;
  lng: number;
}

interface RwandaMapProps {
  districts: DistrictData[];
  height?: string;
  onDistrictClick?: (district: DistrictData) => void;
}

// Rwanda district coordinates
const districtCoordinates: Record<string, [number, number]> = {
  "Gasabo":     [-1.5167, 30.1167],
  "Kicukiro":   [-1.9833, 30.0833],
  "Nyarugenge": [-1.9441, 30.0594],
  "Bugesera":   [-2.1500, 30.2333],
  "Gatsibo":    [-1.5833, 30.4667],
  "Kayonza":    [-1.8833, 30.6167],
  "Kirehe":     [-2.2667, 30.6833],
  "Ngoma":      [-2.1500, 30.5000],
  "Nyagatare":  [-1.2833, 30.3167],
  "Rwamagana":  [-1.9500, 30.4333],
  "Burera":     [-1.4667, 29.8333],
  "Gakenke":    [-1.6833, 29.7833],
  "Gicumbi":    [-1.5667, 30.0500],
  "Musanze":    [-1.4978, 29.6347],
  "Rulindo":    [-1.7167, 30.0000],
  "Gisagara":   [-2.6167, 29.8333],
  "Huye":       [-2.5967, 29.7394],
  "Kamonyi":    [-2.0833, 29.8833],
  "Muhanga":    [-2.0833, 29.7500],
  "Nyamagabe":  [-2.4833, 29.4833],
  "Nyanza":     [-2.3500, 29.7500],
  "Nyaruguru":  [-2.7167, 29.5333],
  "Ruhango":    [-2.2333, 29.7833],
  "Karongi":    [-2.0667, 29.3667],
  "Ngororero":  [-1.8833, 29.5333],
  "Nyabihu":    [-1.6500, 29.5000],
  "Nyamasheke": [-2.3333, 29.1667],
  "Rubavu":     [-1.6803, 29.3397],
  "Rusizi":     [-2.4833, 28.9000],
  "Rutsiro":    [-1.9500, 29.4333],
};

function getCaseColor(cases: number): string {
  if (cases >= 40) return "#dc2626";
  if (cases >= 25) return "#ea580c";
  if (cases >= 15) return "#d97706";
  if (cases >= 8)  return "#65a30d";
  return "#16a34a";
}

function getCaseSize(cases: number): number {
  if (cases >= 40) return 22;
  if (cases >= 25) return 18;
  if (cases >= 15) return 15;
  if (cases >= 8)  return 12;
  return 10;
}

export function RwandaMap({ districts, height = "400px", onDistrictClick }: RwandaMapProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Rwanda
    const map = L.map(containerRef.current, {
      center: [-1.9403, 29.8739],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // OpenStreetMap tile layer — free, no API key needed
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add district markers
    districts.forEach(district => {
      const coords = districtCoordinates[district.name];
      if (!coords) return;

      const color = getCaseColor(district.cases);
      const size  = getCaseSize(district.cases);

      const marker = L.circleMarker(coords, {
        radius:      size,
        fillColor:   color,
        color:       "#ffffff",
        weight:      2,
        opacity:     1,
        fillOpacity: 0.85,
      }).addTo(map);

      const resolutionRate = district.cases > 0
        ? Math.round((district.resolved / district.cases) * 100)
        : 0;

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <p style="font-weight: 700; font-size: 14px; margin: 0 0 8px 0; color: #111;">${district.name} District</p>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 11px; color: #666;">Total Cases</span>
              <span style="font-size: 11px; font-weight: 600; color: ${color};">${district.cases}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 11px; color: #666;">Resolved</span>
              <span style="font-size: 11px; font-weight: 600; color: #16a34a;">${district.resolved}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 11px; color: #666;">Critical</span>
              <span style="font-size: 11px; font-weight: 600; color: #dc2626;">${district.critical}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 11px; color: #666;">Resolution Rate</span>
              <span style="font-size: 11px; font-weight: 600; color: #2563eb;">${resolutionRate}%</span>
            </div>
          </div>
        </div>
      `, { maxWidth: 220 });

      marker.on("click", () => {
        marker.openPopup();
        if (onDistrictClick) {
          onDistrictClick(district);
        }
      });

      // District name label
      L.tooltip({
        permanent:  true,
        direction:  "top",
        offset:     [0, -size - 4],
        className:  "district-label",
      })
        .setContent(`<span style="font-size: 9px; font-weight: 600; color: #374151;">${district.name}</span>`)
        .setLatLng(coords)
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ height, width: "100%", borderRadius: "12px", overflow: "hidden" }}
      />
      <style>{`
        .district-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .district-label::before {
          display: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
      `}</style>
    </div>
  );
}

// Sample data for all 30 districts
export const rwandaDistrictData: DistrictData[] = [
  { name: "Gasabo",     cases: 48, resolved: 32, critical: 8, lat: -1.5167, lng: 30.1167 },
  { name: "Kicukiro",   cases: 35, resolved: 24, critical: 5, lat: -1.9833, lng: 30.0833 },
  { name: "Nyarugenge", cases: 42, resolved: 28, critical: 7, lat: -1.9441, lng: 30.0594 },
  { name: "Bugesera",   cases: 28, resolved: 18, critical: 4, lat: -2.1500, lng: 30.2333 },
  { name: "Gatsibo",    cases: 18, resolved: 14, critical: 2, lat: -1.5833, lng: 30.4667 },
  { name: "Kayonza",    cases: 22, resolved: 15, critical: 3, lat: -1.8833, lng: 30.6167 },
  { name: "Kirehe",     cases: 15, resolved: 12, critical: 1, lat: -2.2667, lng: 30.6833 },
  { name: "Ngoma",      cases: 20, resolved: 14, critical: 2, lat: -2.1500, lng: 30.5000 },
  { name: "Nyagatare",  cases: 25, resolved: 16, critical: 3, lat: -1.2833, lng: 30.3167 },
  { name: "Rwamagana",  cases: 19, resolved: 13, critical: 2, lat: -1.9500, lng: 30.4333 },
  { name: "Burera",     cases: 12, resolved:  9, critical: 1, lat: -1.4667, lng: 29.8333 },
  { name: "Gakenke",    cases: 14, resolved: 10, critical: 1, lat: -1.6833, lng: 29.7833 },
  { name: "Gicumbi",    cases: 17, resolved: 11, critical: 2, lat: -1.5667, lng: 30.0500 },
  { name: "Musanze",    cases: 23, resolved: 16, critical: 3, lat: -1.4978, lng: 29.6347 },
  { name: "Rulindo",    cases: 11, resolved:  8, critical: 1, lat: -1.7167, lng: 30.0000 },
  { name: "Gisagara",   cases: 16, resolved: 11, critical: 2, lat: -2.6167, lng: 29.8333 },
  { name: "Huye",       cases: 21, resolved: 15, critical: 3, lat: -2.5967, lng: 29.7394 },
  { name: "Kamonyi",    cases: 13, resolved:  9, critical: 1, lat: -2.0833, lng: 29.8833 },
  { name: "Muhanga",    cases: 18, resolved: 12, critical: 2, lat: -2.0833, lng: 29.7500 },
  { name: "Nyamagabe",  cases: 10, resolved:  8, critical: 1, lat: -2.4833, lng: 29.4833 },
  { name: "Nyanza",     cases: 14, resolved: 10, critical: 1, lat: -2.3500, lng: 29.7500 },
  { name: "Nyaruguru",  cases:  9, resolved:  7, critical: 0, lat: -2.7167, lng: 29.5333 },
  { name: "Ruhango",    cases: 12, resolved:  9, critical: 1, lat: -2.2333, lng: 29.7833 },
  { name: "Karongi",    cases: 15, resolved: 10, critical: 2, lat: -2.0667, lng: 29.3667 },
  { name: "Ngororero",  cases: 11, resolved:  8, critical: 1, lat: -1.8833, lng: 29.5333 },
  { name: "Nyabihu",    cases: 13, resolved:  9, critical: 1, lat: -1.6500, lng: 29.5000 },
  { name: "Nyamasheke", cases: 10, resolved:  7, critical: 1, lat: -2.3333, lng: 29.1667 },
  { name: "Rubavu",     cases: 26, resolved: 17, critical: 4, lat: -1.6803, lng: 29.3397 },
  { name: "Rusizi",     cases: 20, resolved: 13, critical: 3, lat: -2.4833, lng: 28.9000 },
  { name: "Rutsiro",    cases:  8, resolved:  6, critical: 0, lat: -1.9500, lng: 29.4333 },
];
