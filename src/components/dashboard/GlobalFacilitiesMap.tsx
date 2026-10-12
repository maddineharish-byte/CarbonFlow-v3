import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Building2,
  Server,
  Truck,
  Flame,
  Zap,
  ShieldCheck,
  ExternalLink,
  Navigation,
  Compass,
  Layers,
  CheckCircle2,
  ArrowRight,
  Radio,
  SlidersHorizontal,
  Globe2,
  Factory
} from 'lucide-react';
import { maplibregl, initMapLibreWorker } from '../../utils/maplibre';

export interface FacilitySite {
  id: string;
  name: string;
  category: 'HEADQUARTERS' | 'DATA_CENTER' | 'LOGISTICS' | 'MANUFACTURING' | 'REGIONAL_OFFICE';
  city: string;
  country: string;
  address: string;
  position: { lat: number; lng: number };
  primaryScope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  annualEmissionsTco2e: number;
  renewablePct: number;
  activityDetail: string;
  auditStatus: 'VERIFIED' | 'VALIDATED' | 'IN_ASSURANCE';
  headcount: number;
}

export const ENTERPRISE_FACILITIES: FacilitySite[] = [
  {
    id: 'fac-001',
    name: 'Global Innovation Headquarters',
    category: 'HEADQUARTERS',
    city: 'San Francisco, CA',
    country: 'United States',
    address: '500 Howard St, San Francisco, CA 94105',
    position: { lat: 37.7891, lng: -122.3982 },
    primaryScope: 'SCOPE_2',
    annualEmissionsTco2e: 369.99,
    renewablePct: 88.5,
    activityDetail: 'CleanPowerSF 100% SuperGreen Interval Metering & Hydronic HVAC',
    auditStatus: 'VERIFIED',
    headcount: 850
  },
  {
    id: 'fac-002',
    name: 'Silicon Valley Cloud Computing Center',
    category: 'DATA_CENTER',
    city: 'Sunnyvale, CA',
    country: 'United States',
    address: '1050 Mathilda Ave, Sunnyvale, CA 94089',
    position: { lat: 37.3912, lng: -122.0322 },
    primaryScope: 'SCOPE_2',
    annualEmissionsTco2e: 184.20,
    renewablePct: 94.0,
    activityDetail: 'High-density tier IV compute nodes with onsite solar microgrid',
    auditStatus: 'VERIFIED',
    headcount: 120
  },
  {
    id: 'fac-003',
    name: 'Midwest Regional Operations Center',
    category: 'REGIONAL_OFFICE',
    city: 'Chicago, IL',
    country: 'United States',
    address: '200 S Wacker Dr, Chicago, IL 60606',
    position: { lat: 41.8796, lng: -87.6368 },
    primaryScope: 'SCOPE_1',
    annualEmissionsTco2e: 140.85,
    renewablePct: 62.0,
    activityDetail: 'Stationary natural gas hydronic boilers and commercial fleet',
    auditStatus: 'VALIDATED',
    headcount: 340
  },
  {
    id: 'fac-004',
    name: 'European Logistics & Distribution Hub',
    category: 'LOGISTICS',
    city: 'Frankfurt',
    country: 'Germany',
    address: 'Flughafenstraße, 60549 Frankfurt am Main, Germany',
    position: { lat: 50.0379, lng: 8.5622 },
    primaryScope: 'SCOPE_3',
    annualEmissionsTco2e: 128.40,
    renewablePct: 75.0,
    activityDetail: 'Freight consolidation, cross-border EV delivery fleet & logistics',
    auditStatus: 'IN_ASSURANCE',
    headcount: 210
  },
  {
    id: 'fac-005',
    name: 'Asia-Pacific Data Center & Engineering Hub',
    category: 'DATA_CENTER',
    city: 'Singapore',
    country: 'Singapore',
    address: '1 Fusionopolis Way, Connexis, Singapore 138632',
    position: { lat: 1.2988, lng: 103.7876 },
    primaryScope: 'SCOPE_2',
    annualEmissionsTco2e: 215.60,
    renewablePct: 71.0,
    activityDetail: 'Direct district cooling connection with renewable energy purchase agreements (PPA)',
    auditStatus: 'VERIFIED',
    headcount: 180
  },
  {
    id: 'fac-006',
    name: 'Austin R&D Advanced Materials Facility',
    category: 'MANUFACTURING',
    city: 'Austin, TX',
    country: 'United States',
    address: '11501 Domain Dr, Austin, TX 78758',
    position: { lat: 30.4014, lng: -97.7259 },
    primaryScope: 'SCOPE_1',
    annualEmissionsTco2e: 198.70,
    renewablePct: 80.5,
    activityDetail: 'Additive manufacturing labs, industrial heat pumps, ISO 14001 certified',
    auditStatus: 'VERIFIED',
    headcount: 290
  },
  {
    id: 'fac-007',
    name: 'London Corporate Sustainability Center',
    category: 'REGIONAL_OFFICE',
    city: 'London',
    country: 'United Kingdom',
    address: '100 Bishopsgate, London EC2N 4AG, United Kingdom',
    position: { lat: 51.5161, lng: -0.0818 },
    primaryScope: 'SCOPE_3',
    annualEmissionsTco2e: 76.50,
    renewablePct: 82.0,
    activityDetail: 'BREEAM Outstanding corporate offices with zero gas grid dependence',
    auditStatus: 'VERIFIED',
    headcount: 260
  }
];

interface GlobalFacilitiesMapProps {
  apiKey?: string;
  onNavigateToTravel?: () => void;
  onNavigateToLedger?: () => void;
}

export function GlobalFacilitiesMap({
  onNavigateToTravel,
  onNavigateToLedger
}: GlobalFacilitiesMapProps) {
  const [selectedSite, setSelectedSite] = useState<FacilitySite | null>(ENTERPRISE_FACILITIES[0]);
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');
  const [activeStyle, setActiveStyle] = useState<'liberty' | 'positron' | 'bright'>('liberty');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const filteredSites = ENTERPRISE_FACILITIES.filter(s => {
    if (scopeFilter === 'ALL') return true;
    return s.primaryScope === scopeFilter;
  });

  // Initialize MapLibre GL with OpenFreeMap vector tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    initMapLibreWorker();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://tiles.openfreemap.org/styles/${activeStyle}`,
      center: [-122.3982, 37.7891],
      zoom: 3.5,
      pitch: 20,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    mapInstanceRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when filteredSites or selectedSite changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredSites.forEach(site => {
      const isSelected = selectedSite?.id === site.id;
      const isScope1 = site.primaryScope === 'SCOPE_1';
      const isScope2 = site.primaryScope === 'SCOPE_2';

      const el = document.createElement('div');
      el.className = 'cursor-pointer flex flex-col items-center group';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${isSelected ? '<span class="absolute -inset-1.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>' : ''}
          <div class="relative flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-md border-2 border-white transition-transform ${
            isSelected ? 'scale-115 ring-2 ring-emerald-500' : 'hover:scale-110'
          } ${
            isScope1
              ? 'bg-amber-600'
              : isScope2
              ? 'bg-blue-600'
              : 'bg-emerald-800'
          }">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
        <span class="mt-1 text-[9px] font-bold text-slate-800 bg-white/95 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap border border-slate-200">
          ${site.city}
        </span>
      `;

      el.addEventListener('click', () => {
        setSelectedSite(site);
        map.flyTo({
          center: [site.position.lng, site.position.lat],
          zoom: 11,
          duration: 1200
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.position.lng, site.position.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [filteredSites, selectedSite]);

  const handleSelectPreset = (preset: 'WORLD' | 'NA' | 'EU' | 'APAC') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (preset === 'WORLD') {
      map.flyTo({ center: [10.0, 25.0], zoom: 1.8, duration: 1200 });
    } else if (preset === 'NA') {
      map.flyTo({ center: [-98.35, 39.5], zoom: 3.8, duration: 1200 });
    } else if (preset === 'EU') {
      map.flyTo({ center: [4.3, 50.8], zoom: 4.5, duration: 1200 });
    } else if (preset === 'APAC') {
      map.flyTo({ center: [103.8, 1.3], zoom: 5.5, duration: 1200 });
    }
  };

  const handleSwitchStyle = (style: 'liberty' | 'positron' | 'bright') => {
    setActiveStyle(style);
    const map = mapInstanceRef.current;
    if (map) {
      map.setStyle(`https://tiles.openfreemap.org/styles/${style}`);
    }
  };

  const totalMonitoredEmissions = ENTERPRISE_FACILITIES.reduce((acc, s) => acc + s.annualEmissionsTco2e, 0);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header bar */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <Globe2 className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Enterprise Geospatial Intelligence & Facilities Map
            </h2>
            <span className="rounded-full bg-emerald-100 text-emerald-950 px-2 py-0.5 text-[10px] font-mono font-semibold border border-emerald-200">
              OpenFreeMap Vector Tiles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global facilities footprint, Scope 1-3 operational boundaries, and real-time live GPS mobility integration powered by open-source MapLibre GL.
          </p>
        </div>

        {/* Preset & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Style switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => handleSwitchStyle('liberty')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                activeStyle === 'liberty' ? 'bg-white text-emerald-950 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Liberty
            </button>
            <button
              onClick={() => handleSwitchStyle('positron')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                activeStyle === 'positron' ? 'bg-white text-emerald-950 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Positron
            </button>
          </div>

          {/* View Presets */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => handleSelectPreset('WORLD')}
              className="px-2.5 py-1 rounded-md text-slate-700 hover:text-slate-900 font-medium"
            >
              World
            </button>
            <button
              onClick={() => handleSelectPreset('NA')}
              className="px-2.5 py-1 rounded-md text-slate-700 hover:text-slate-900 font-medium"
            >
              North America
            </button>
            <button
              onClick={() => handleSelectPreset('EU')}
              className="px-2.5 py-1 rounded-md text-slate-700 hover:text-slate-900 font-medium"
            >
              Europe
            </button>
            <button
              onClick={() => handleSelectPreset('APAC')}
              className="px-2.5 py-1 rounded-md text-slate-700 hover:text-slate-900 font-medium"
            >
              APAC
            </button>
          </div>

          {/* Scope Filter */}
          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="ALL">All Emission Scopes</option>
            <option value="SCOPE_1">Scope 1 (Direct Fuels & Heating)</option>
            <option value="SCOPE_2">Scope 2 (Electricity & Data Centers)</option>
            <option value="SCOPE_3">Scope 3 (Logistics & Supply Chain)</option>
          </select>

          {onNavigateToTravel && (
            <button
              onClick={onNavigateToTravel}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs transition"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Live GPS Tracker
            </button>
          )}
        </div>
      </div>

      {/* Map + Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Left 2 Cols: OpenFreeMap Vector Canvas */}
        <div className="lg:col-span-2 h-96 relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Quick Stats Overlay Pill on Map */}
          <div className="absolute top-3 left-3 rounded-xl bg-white/95 px-3 py-2 shadow-sm border border-slate-200 text-xs backdrop-blur-xs flex items-center gap-3 z-10">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Monitored</div>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {totalMonitoredEmissions.toFixed(1)} <span className="text-[10px] text-slate-500">tCO2e</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Locations</div>
              <div className="font-mono font-bold text-emerald-800 text-sm">
                {filteredSites.length} sites
              </div>
            </div>
          </div>

          {/* OpenFreeMap Attribution Badge */}
          <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-0.5 text-[9px] font-mono text-slate-600 border border-slate-200 shadow-xs z-10 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>OpenFreeMap • MapLibre GL JS</span>
            <span>•</span>
            <span>© OpenStreetMap</span>
          </div>
        </div>

        {/* Right Col: Facility Inspection Drawer */}
        <div className="p-6 flex flex-col justify-between bg-slate-50/40">
          {selectedSite ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
                    selectedSite.primaryScope === 'SCOPE_1'
                      ? 'bg-amber-100 text-amber-900'
                      : selectedSite.primaryScope === 'SCOPE_2'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-emerald-100 text-emerald-950'
                  }`}>
                    {selectedSite.primaryScope}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedSite.name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{selectedSite.address}</span>
                  </div>
                </div>
              </div>

              {/* Emissions & Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Annual Footprint</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {selectedSite.annualEmissionsTco2e.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">tCO2e</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Clean Energy %</div>
                  <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                    {selectedSite.renewablePct}%
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Audit Assurance</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                    {selectedSite.auditStatus}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Onsite Headcount</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {selectedSite.headcount}
                  </div>
                </div>
              </div>

              {/* Telemetry detail */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 text-xs text-slate-600">
                <div className="font-semibold text-slate-900 text-[11px]">Primary Telemetry & Metering:</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  {selectedSite.activityDetail}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                {onNavigateToTravel && (
                  <button
                    type="button"
                    onClick={onNavigateToTravel}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition shadow-xs"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Track GPS Commute to {selectedSite.city}
                  </button>
                )}

                {onNavigateToLedger && (
                  <button
                    type="button"
                    onClick={onNavigateToLedger}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Flame className="h-3.5 w-3.5 text-orange-600" />
                    Inspect Facility Ledger Records
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-slate-400 p-8 text-xs">
              Select a facility pin on the map to inspect location-based emissions and compute travel routes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
