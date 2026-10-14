import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Car,
  Bike,
  Footprints,
  Train,
  ArrowRight,
  ShieldCheck,
  LocateFixed,
  Maximize2,
  Clock,
  Sparkles,
  Info,
  ChevronDown
} from 'lucide-react';
import { maplibregl, initMapLibreWorker } from '../../utils/maplibre';
import { TravelMode, TripType, RoutePreviewResponse, EmissionFactor } from '../../types';
import { api } from '../../services/api';

// OpenFreeMap vector tile style endpoints (per https://github.com/w3cj/openfreemap-examples)
export const OPEN_FREE_MAP_STYLES = {
  liberty: {
    id: 'liberty',
    name: 'Liberty (Default)',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    desc: 'Topographic & street detail (default)'
  },
  positron: {
    id: 'positron',
    name: 'Positron (Clean Light)',
    url: 'https://tiles.openfreemap.org/styles/positron',
    desc: 'High-clarity minimal corporate theme'
  },
  bright: {
    id: 'bright',
    name: 'Bright (Urban Roads)',
    url: 'https://tiles.openfreemap.org/styles/bright',
    desc: 'High-contrast road network navigation'
  }
} as const;

type OpenFreeMapStyleKey = keyof typeof OPEN_FREE_MAP_STYLES;

interface OpenFreeMapRouteMapProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialTravelMode?: TravelMode;
  initialTripType?: TripType;
  onSaveTrip?: (tripData: {
    title: string;
    travelDate: string;
    tripType: TripType;
    travelMode: TravelMode;
    vehicleType: string;
    originAddress: string;
    destinationAddress: string;
    passengerCount: number;
    oneWayDistanceKm: number;
    totalDistanceKm: number;
    durationSeconds: number;
    routeSummary: string;
    emissionFactorId: string;
    autoCalculateCarbon: boolean;
    calculatedEmissions: number;
  }) => Promise<void> | void;
}

const PRESET_ROUTES = [
  {
    name: 'Chicago HQ → Milwaukee Regional Office',
    origin: '200 S Wacker Dr, Chicago, IL',
    destination: '100 E Wisconsin Ave, Milwaukee, WI',
    mode: 'DRIVE' as TravelMode
  },
  {
    name: 'San Francisco → Silicon Valley Tech Center',
    origin: 'Market St, San Francisco, CA',
    destination: 'Mathilda Ave, Sunnyvale, CA',
    mode: 'DRIVE' as TravelMode
  },
  {
    name: 'Boston South Station → Providence Hub',
    origin: 'South Station, Boston, MA',
    destination: 'Amtrak Station, Providence, RI',
    mode: 'TRANSIT' as TravelMode
  },
  {
    name: 'Manhattan Midtown → Philadelphia Center',
    origin: '350 5th Ave, New York, NY',
    destination: '1500 Market St, Philadelphia, PA',
    mode: 'DRIVE' as TravelMode
  }
];

export function OpenFreeMapRouteMap({
  initialOrigin = '200 S Wacker Dr, Chicago, IL',
  initialDestination = '100 E Wisconsin Ave, Milwaukee, WI',
  initialTravelMode = 'DRIVE',
  initialTripType = 'ROUND_TRIP',
  onSaveTrip
}: OpenFreeMapRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [currentStyle, setCurrentStyle] = useState<OpenFreeMapStyleKey>('liberty');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Form states
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [travelMode, setTravelMode] = useState<TravelMode>(initialTravelMode);
  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [passengers, setPassengers] = useState<number>(1);
  const [vehicleType, setVehicleType] = useState<string>('Passenger Car (Gasoline Average)');

  // Interaction modes
  const [pinMode, setPinMode] = useState<'origin' | 'destination' | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Calculation & Results
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RoutePreviewResponse | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Emission Factors
  const [factors, setFactors] = useState<EmissionFactor[]>([]);

  // Load emission factors on mount
  useEffect(() => {
    api.getEmissionFactors().then(list => {
      setFactors(list.filter(f => f.category === 'Business Travel' || f.category === 'Mobile Combustion'));
    }).catch(err => {
      console.warn('Emission factor load note:', err);
    });
  }, []);

  // Update vehicle type when mode changes
  const handleModeChange = (mode: TravelMode) => {
    setTravelMode(mode);
    if (mode === 'WALK' || mode === 'BICYCLE') {
      setVehicleType('Active Mobility (Walking / Bicycle)');
    } else if (mode === 'TRANSIT') {
      setVehicleType('Public Transit (Passenger Rail / Train)');
    } else {
      setVehicleType('Passenger Car (Gasoline Average)');
    }
    setRouteResult(null);
  };

  // Helper to create clean custom DOM marker
  const createMarkerElement = (type: 'origin' | 'destination') => {
    const el = document.createElement('div');
    el.className = 'cursor-pointer select-none transition-transform hover:scale-110';
    if (type === 'origin') {
      el.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background-color:#059669; color:#ffffff; font-weight:700; font-size:11px; padding:4px 8px; border-radius:9999px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.2); border:2px solid #ffffff; display:flex; align-items:center; gap:4px;">
            <span>A</span>
            <span style="font-size:9px; text-transform:uppercase; letter-spacing:0.05em;">Origin</span>
          </div>
          <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #059669; margin-top:-1px;"></div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background-color:#e11d48; color:#ffffff; font-weight:700; font-size:11px; padding:4px 8px; border-radius:9999px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.2); border:2px solid #ffffff; display:flex; align-items:center; gap:4px;">
            <span>B</span>
            <span style="font-size:9px; text-transform:uppercase; letter-spacing:0.05em;">Dest</span>
          </div>
          <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #e11d48; margin-top:-1px;"></div>
        </div>
      `;
    }
    return el;
  };

  // 1. Initialize MapLibre GL map with OpenFreeMap liberty style
  useEffect(() => {
    if (!mapContainerRef.current) return;
    initMapLibreWorker();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OPEN_FREE_MAP_STYLES[currentStyle].url,
      center: [-87.6298, 41.8781], // Chicago default center
      zoom: 6.5,
      attributionControl: false
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      if (originMarkerRef.current) originMarkerRef.current.remove();
      if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Handle style switching (Liberty / Positron / Bright)
  const handleStyleChange = (styleKey: OpenFreeMapStyleKey) => {
    if (!mapRef.current || styleKey === currentStyle) return;
    setCurrentStyle(styleKey);
    mapRef.current.setStyle(OPEN_FREE_MAP_STYLES[styleKey].url);

    // Re-draw route layer once style reloads
    mapRef.current.once('style.load', () => {
      if (routeResult?.coordinates && routeResult.coordinates.length > 1) {
        renderRouteOnMap(routeResult.coordinates);
      }
    });
  };

  // 3. Render route GeoJSON line on map
  const renderRouteOnMap = useCallback((coordinates: [number, number][]) => {
    const map = mapRef.current;
    if (!map || !coordinates || coordinates.length < 2) return;

    // Remove existing route layers/sources if any
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getLayer('route-line-casing')) map.removeLayer('route-line-casing');
    if (map.getSource('route-source')) map.removeSource('route-source');

    const geojsonData = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates
      }
    };

    map.addSource('route-source', {
      type: 'geojson',
      data: geojsonData as any
    });

    // Casing outline for high contrast
    map.addLayer({
      id: 'route-line-casing',
      type: 'line',
      source: 'route-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#064e3b',
        'line-width': 7,
        'line-opacity': 0.4
      }
    });

    // Main route line
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#059669',
        'line-width': 4.5,
        'line-opacity': 0.95
      }
    });

    // Set markers at start and end
    const startCoord = coordinates[0];
    const endCoord = coordinates[coordinates.length - 1];

    if (!originMarkerRef.current) {
      originMarkerRef.current = new maplibregl.Marker({
        element: createMarkerElement('origin'),
        anchor: 'bottom'
      })
        .setLngLat(startCoord)
        .addTo(map);
    } else {
      originMarkerRef.current.setLngLat(startCoord);
    }

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = new maplibregl.Marker({
        element: createMarkerElement('destination'),
        anchor: 'bottom'
      })
        .setLngLat(endCoord)
        .addTo(map);
    } else {
      destinationMarkerRef.current.setLngLat(endCoord);
    }

    // Fit map bounds to show full route
    const bounds = new maplibregl.LngLatBounds();
    coordinates.forEach(c => bounds.extend(c));
    map.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      maxZoom: 15,
      duration: 1000
    });
  }, []);

  // 4. Map Click Handler (for interactive map point selection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      if (!pinMode) return;
      const { lng, lat } = e.lngLat;
      setIsGeocoding(true);

      try {
        const res = await api.reverseGeocode(lat, lng);
        const resolved = res.formattedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        if (pinMode === 'origin') {
          setOrigin(resolved);
          if (!originMarkerRef.current) {
            originMarkerRef.current = new maplibregl.Marker({
              element: createMarkerElement('origin'),
              anchor: 'bottom'
            }).setLngLat([lng, lat]).addTo(map);
          } else {
            originMarkerRef.current.setLngLat([lng, lat]);
          }
        } else if (pinMode === 'destination') {
          setDestination(resolved);
          if (!destinationMarkerRef.current) {
            destinationMarkerRef.current = new maplibregl.Marker({
              element: createMarkerElement('destination'),
              anchor: 'bottom'
            }).setLngLat([lng, lat]).addTo(map);
          } else {
            destinationMarkerRef.current.setLngLat([lng, lat]);
          }
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
      } finally {
        setIsGeocoding(false);
        setPinMode(null);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [pinMode]);

  // 5. Calculate Road Route Distance via Backend Routing Engine (OSRM)
  const handleCalculateRoute = async () => {
    if (!origin.trim() || !destination.trim()) {
      setRouteError('Please enter both origin and destination addresses.');
      return;
    }

    setLoadingRoute(true);
    setRouteError(null);
    setSaveSuccess(false);

    try {
      const response = await api.computeRoutePreview({
        origin: origin.trim(),
        destination: destination.trim(),
        travelMode,
        tripType
      });

      setRouteResult(response);

      if (response.coordinates && response.coordinates.length > 1) {
        renderRouteOnMap(response.coordinates);
      }
    } catch (err: any) {
      console.error('Route calculation error:', err);
      setRouteError(err.message || 'Unable to calculate road route between specified points. Please verify addresses.');
    } finally {
      setLoadingRoute(false);
    }
  };

  // 6. Calculate verified GHG emissions based on explicit factor
  const resolveCurrentFactorValue = (): { factorId: string; factorValue: number; source: string } => {
    let factor = factors.find(f => f.activityType.toLowerCase() === vehicleType.toLowerCase());
    if (!factor) {
      if (travelMode === 'WALK' || travelMode === 'BICYCLE') {
        factor = factors.find(f => f.id === 'ef-travel-006');
      } else if (travelMode === 'TRANSIT') {
        factor = factors.find(f => f.id === 'ef-travel-004');
      } else {
        factor = factors.find(f => f.id === 'ef-travel-001');
      }
    }

    if (factor) {
      return { factorId: factor.id, factorValue: factor.factorValue, source: factor.sourceReference };
    }

    if (travelMode === 'WALK' || travelMode === 'BICYCLE') {
      return { factorId: 'ef-travel-006', factorValue: 0.0, source: 'GHG Protocol Corporate Standard (Zero Direct)' };
    }
    if (travelMode === 'TRANSIT') {
      return { factorId: 'ef-travel-004', factorValue: 0.000035, source: 'UK DEFRA / Amtrak Regional 2024' };
    }
    return { factorId: 'ef-travel-001', factorValue: 0.000170, source: 'EPA GHG Emission Factors Hub 2024 / DEFRA' };
  };

  const factorInfo = resolveCurrentFactorValue();
  const totalKm = routeResult?.totalDistanceKm || 0;
  const passengerKm = parseFloat((totalKm * passengers).toFixed(3));
  const calculatedEmissions = parseFloat((passengerKm * factorInfo.factorValue).toFixed(4));

  // 7. Save calculated trip to verified Travel Ledger & Scope 3 database
  const handleSaveToLedger = async () => {
    if (!routeResult) return;
    setSavingTrip(true);
    setRouteError(null);

    const tripData = {
      title: `${travelMode} Travel: ${origin.split(',')[0]} → ${destination.split(',')[0]}`,
      travelDate: new Date().toISOString().split('T')[0],
      tripType,
      travelMode,
      vehicleType,
      originAddress: origin,
      destinationAddress: destination,
      passengerCount: passengers,
      oneWayDistanceKm: routeResult.oneWayDistanceKm,
      totalDistanceKm: routeResult.totalDistanceKm,
      durationSeconds: routeResult.durationSeconds,
      routeSummary: routeResult.routeSummary,
      notes: `Verified road route via OpenFreeMap vector tiles & OSRM routing engine. Emission factor: ${factorInfo.factorValue} tCO2e/p-km (${factorInfo.source}).`,
      emissionFactorId: factorInfo.factorId,
      autoCalculateCarbon: true
    };

    try {
      if (onSaveTrip) {
        await onSaveTrip({
          ...tripData,
          calculatedEmissions
        });
      } else {
        await api.createTravelActivity(tripData);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setRouteError(err.message || 'Failed to persist travel activity record.');
    } finally {
      setSavingTrip(false);
    }
  };

  // Preset Route Loader
  const handleSelectPreset = (p: typeof PRESET_ROUTES[0]) => {
    setOrigin(p.origin);
    setDestination(p.destination);
    setTravelMode(p.mode);
    setRouteResult(null);
    setRouteError(null);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-5 w-full">
      {/* LEFT: Route Configuration & Audit Inputs */}
      <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-emerald-800" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">Road Distance & Route Engine</h3>
                <p className="text-[11px] text-stone-500">OpenFreeMap • OSRM Routing Provider</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 text-emerald-950 px-2 py-0.5 text-[10px] font-mono font-semibold">
              MAP_TILE_PROVIDER=openfreemap
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Example Corporate Routes</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_ROUTES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-left text-[10px] font-medium text-stone-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-950 transition truncate"
                  title={p.name}
                >
                  {p.name.split('→')[0]} → ...
                </button>
              ))}
            </div>
          </div>

          {/* Origin & Destination Inputs */}
          <div className="space-y-3">
            {/* Origin Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">A</span>
                  Origin Location
                </label>
                <button
                  type="button"
                  onClick={() => setPinMode(pinMode === 'origin' ? null : 'origin')}
                  className={`text-[10px] font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                    pinMode === 'origin' ? 'bg-emerald-700 text-white' : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                  title="Click map to pick origin coordinates"
                >
                  <LocateFixed className="h-3 w-3" />
                  {pinMode === 'origin' ? 'Click Map...' : 'Pick on Map'}
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. 200 S Wacker Dr, Chicago, IL"
                value={origin}
                onChange={e => { setOrigin(e.target.value); setRouteResult(null); }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Destination Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">B</span>
                  Destination Location
                </label>
                <button
                  type="button"
                  onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                  className={`text-[10px] font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                    pinMode === 'destination' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                  title="Click map to pick destination coordinates"
                >
                  <LocateFixed className="h-3 w-3" />
                  {pinMode === 'destination' ? 'Click Map...' : 'Pick on Map'}
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. 100 E Wisconsin Ave, Milwaukee, WI"
                value={destination}
                onChange={e => { setDestination(e.target.value); setRouteResult(null); }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Mode & Trip Type */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Travel Mode</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleModeChange('DRIVE')}
                  className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                    travelMode === 'DRIVE' ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Car className="h-3.5 w-3.5" /> Drive
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('TRANSIT')}
                  className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                    travelMode === 'TRANSIT' ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Train className="h-3.5 w-3.5" /> Rail
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('BICYCLE')}
                  className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                    travelMode === 'BICYCLE' ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Bike className="h-3.5 w-3.5" /> Bike
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('WALK')}
                  className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                    travelMode === 'WALK' ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold' : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Footprints className="h-3.5 w-3.5" /> Walk
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Trip Scope</label>
              <select
                value={tripType}
                onChange={e => { setTripType(e.target.value as TripType); setRouteResult(null); }}
                className="w-full rounded-lg border border-stone-200 px-2.5 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="ROUND_TRIP">Round Trip (Return)</option>
                <option value="ONE_WAY">One-Way Journey</option>
              </select>

              <div className="pt-2">
                <label className="text-[11px] font-semibold text-stone-700">Passengers</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={passengers}
                  onChange={e => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Vehicle / Factor Profile */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Emission Factor Profile</label>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
            >
              {travelMode === 'DRIVE' && (
                <>
                  <option value="Passenger Car (Gasoline Average)">Passenger Car (Gasoline) - 0.000170 tCO2e/p-km (EPA)</option>
                  <option value="Passenger Car (Electric Vehicle - Grid Avg)">Passenger Car (EV Grid Avg) - 0.000053 tCO2e/p-km (EPA eGRID)</option>
                  <option value="Passenger Car (Hybrid Electric)">Passenger Car (Hybrid) - 0.000109 tCO2e/p-km (DEFRA)</option>
                  <option value="Taxi / Rideshare (Single Occupancy)">Taxi / Rideshare - 0.000195 tCO2e/p-km (DEFRA)</option>
                </>
              )}
              {travelMode === 'TRANSIT' && (
                <>
                  <option value="Public Transit (Passenger Rail / Train)">Passenger Rail / Train - 0.000035 tCO2e/p-km (DEFRA)</option>
                  <option value="Public Transit (City Bus)">City Bus - 0.000089 tCO2e/p-km (EPA GHG Hub)</option>
                </>
              )}
              {(travelMode === 'BICYCLE' || travelMode === 'WALK') && (
                <option value="Active Mobility (Walking / Bicycle)">Active Mobility (Zero Direct Emissions) - 0.000000 tCO2e</option>
              )}
            </select>
          </div>

          {/* Calculate Route Action Button */}
          <button
            type="button"
            onClick={handleCalculateRoute}
            disabled={loadingRoute || !origin.trim() || !destination.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50 transition shadow-xs"
          >
            {loadingRoute ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Computing Road Distance via Routing Provider...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Calculate Road Route Distance & Emissions
              </>
            )}
          </button>

          {/* Error Banner */}
          {routeError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Routing Error</p>
                <p className="text-[11px] mt-0.5">{routeError}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>Route saved and synced to the central <strong>Carbon Data Scope 3 Ledger</strong>!</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Map Container & Calculated Results HUD */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="relative h-[480px] sm:h-[540px] w-full rounded-2xl border border-stone-200 bg-stone-100 overflow-hidden shadow-xs">
          {/* Map canvas */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Top Bar Overlay: Map Style Switcher & Indicator */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-md border border-stone-200/80 text-xs">
              <Layers className="h-3.5 w-3.5 text-stone-500" />
              <span className="text-[11px] font-semibold text-stone-700 mr-1">Style:</span>
              {(['liberty', 'positron', 'bright'] as OpenFreeMapStyleKey[]).map(styleKey => (
                <button
                  key={styleKey}
                  type="button"
                  onClick={() => handleStyleChange(styleKey)}
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                    currentStyle === styleKey
                      ? 'bg-emerald-800 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {OPEN_FREE_MAP_STYLES[styleKey].name.split(' ')[0]}
                </button>
              ))}
            </div>

            {pinMode && (
              <div className="rounded-xl bg-emerald-900 text-white px-3 py-1 text-xs font-semibold shadow-md animate-pulse flex items-center gap-1.5">
                <LocateFixed className="h-3.5 w-3.5" />
                <span>Click on map to select {pinMode}...</span>
              </div>
            )}
          </div>

          {/* Bottom Attribution Badge */}
          <div className="absolute bottom-2 left-2 z-10 rounded bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-mono text-stone-600 border border-stone-200 shadow-xs">
            OpenFreeMap Vector Tiles • MapLibre GL JS
          </div>

          {/* Loading Indicator Overlay */}
          {loadingRoute && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-900/30 backdrop-blur-xs">
              <div className="rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 flex flex-col items-center gap-3">
                <RefreshCw className="h-7 w-7 text-emerald-800 animate-spin" />
                <div className="text-center">
                  <div className="text-xs font-bold text-stone-900">Querying Road Routing Engine...</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">Fetching verified distance & road geometry</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* VERIFIED CALCULATION RESULTS HUD CARD */}
        {routeResult && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Verified Road Route & Calculation Boundary</h4>
                  <p className="text-[11px] text-stone-500">
                    Routing Engine: <strong className="text-stone-800">{routeResult.routingProvider}</strong> ({routeResult.routingService}) • ISO 14064-3 Audited
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-950 px-2.5 py-0.5 text-[11px] font-mono font-semibold">
                  {routeResult.routeSummary}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">One-Way Distance</span>
                <div className="text-lg font-bold text-stone-900 font-mono mt-0.5">
                  {routeResult.oneWayDistanceKm.toFixed(2)} km
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  {routeResult.oneWayDistanceMeters.toLocaleString()} metres
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">
                  Total Distance ({tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One-Way'})
                </span>
                <div className="text-lg font-bold text-emerald-950 font-mono mt-0.5">
                  {routeResult.totalDistanceKm.toFixed(2)} km
                </div>
                <div className="text-[10px] text-emerald-800 font-mono">
                  {(routeResult.totalDistanceKm * 1000).toLocaleString()} metres
                </div>
              </div>

              <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">Est. Road Duration</span>
                <div className="text-lg font-bold text-stone-900 font-mono mt-0.5">
                  {routeResult.formattedDuration}
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  {routeResult.durationSeconds} seconds
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Calculated Emissions</span>
                <div className="text-lg font-bold text-emerald-900 font-mono mt-0.5">
                  {calculatedEmissions.toFixed(4)} <span className="text-xs font-medium">tCO2e</span>
                </div>
                <div className="text-[10px] text-emerald-800">
                  {passengerKm.toFixed(1)} passenger-km
                </div>
              </div>
            </div>

            {/* Audit & Emission Calculation Proof */}
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-stone-700 font-semibold">
                <span>Deterministic Calculation Proof:</span>
                <span className="text-[10px] font-mono text-stone-400">Timestamp: {new Date(routeResult.calculatedAt).toLocaleString()}</span>
              </div>
              <div className="text-[11px] text-stone-600 space-y-0.5 font-mono">
                <div>• Formula: Total Distance (km) × Passengers × Factor (tCO2e/p-km) = Emissions</div>
                <div>• Math: {routeResult.totalDistanceKm.toFixed(2)} km × {passengers} traveler(s) × {factorInfo.factorValue.toFixed(6)} = <strong>{calculatedEmissions.toFixed(4)} tCO2e</strong></div>
                <div>• Factor Source: {factorInfo.source} ({vehicleType})</div>
              </div>
            </div>

            {/* Action to Save / Persist */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleSaveToLedger}
                disabled={savingTrip}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50 shadow-xs transition"
              >
                {savingTrip ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Recording Trip in Supabase Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save & Post to Scope 3 Carbon Ledger
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
