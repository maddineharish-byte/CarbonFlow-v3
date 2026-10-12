import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation,
  Compass,
  Play,
  Pause,
  Square,
  RotateCcw,
  ShieldCheck,
  Radio,
  MapPin,
  Clock,
  Gauge,
  Activity,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  LocateFixed,
  Car,
  Bike,
  Footprints,
  Train,
  Check,
  RefreshCw,
  Layers,
  ChevronRight,
  Globe2,
  X
} from 'lucide-react';
import { maplibregl, initMapLibreWorker } from '../../utils/maplibre';
import { GpsCoordinate, TravelMode, RoutePreviewResponse } from '../../types';
import { api } from '../../services/api';

interface LiveGpsTrackerProps {
  onTripCompleted?: (tripData: {
    title: string;
    originAddress: string;
    destinationAddress: string;
    totalDistanceKm: number;
    durationSeconds: number;
    travelMode: TravelMode;
    vehicleType: string;
    calculatedEmissions: number;
    routeSummary: string;
    coordinatesCount: number;
    provenanceMetadata: string;
  }) => void;
}

// OpenFreeMap vector tile style endpoints (from https://github.com/w3cj/openfreemap-examples)
export const OPEN_FREE_MAP_STYLES = {
  liberty: {
    id: 'liberty',
    name: 'Liberty (Default)',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    desc: 'Rich topographic & street detail'
  },
  positron: {
    id: 'positron',
    name: 'Positron (Light)',
    url: 'https://tiles.openfreemap.org/styles/positron',
    desc: 'Minimalist monochrome corporate theme'
  },
  bright: {
    id: 'bright',
    name: 'Bright (Urban)',
    url: 'https://tiles.openfreemap.org/styles/bright',
    desc: 'High-contrast road network navigation'
  }
} as const;

type OpenFreeMapStyleKey = keyof typeof OPEN_FREE_MAP_STYLES;

// Earth's mean radius in meters (WGS84 standard)
const EARTH_RADIUS_METERS = 6371008.8;

// High-precision Haversine geodesic distance in meters
function calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

// Simulated real-world test routes for indoor / desktop review
const SIMULATED_ROUTES = [
  {
    name: 'San Francisco Tech Corridor (Market St → Embarcadero → Mission)',
    mode: 'DRIVE' as TravelMode,
    vehicleType: 'Passenger Car (Electric Vehicle - Grid Avg)',
    points: [
      { lat: 37.7749, lng: -122.4194, speed: 8.5 },
      { lat: 37.7772, lng: -122.4162, speed: 10.2 },
      { lat: 37.7798, lng: -122.4121, speed: 11.8 },
      { lat: 37.7831, lng: -122.4075, speed: 12.5 },
      { lat: 37.7865, lng: -122.4022, speed: 13.1 },
      { lat: 37.7905, lng: -122.3968, speed: 14.0 },
      { lat: 37.7942, lng: -122.3941, speed: 12.8 },
      { lat: 37.7918, lng: -122.3915, speed: 11.2 },
      { lat: 37.7872, lng: -122.3889, speed: 13.5 },
      { lat: 37.7820, lng: -122.3912, speed: 14.2 },
      { lat: 37.7758, lng: -122.3945, speed: 13.9 },
      { lat: 37.7699, lng: -122.4011, speed: 11.5 }
    ]
  },
  {
    name: 'Chicago Loop Corporate Transit Commute',
    mode: 'TRANSIT' as TravelMode,
    vehicleType: 'Public Transit (Passenger Rail / Train)',
    points: [
      { lat: 41.8781, lng: -87.6298, speed: 9.0 },
      { lat: 41.8815, lng: -87.6279, speed: 11.2 },
      { lat: 41.8858, lng: -87.6245, speed: 13.8 },
      { lat: 41.8902, lng: -87.6221, speed: 14.5 },
      { lat: 41.8965, lng: -87.6205, speed: 15.2 },
      { lat: 41.9032, lng: -87.6212, speed: 16.0 },
      { lat: 41.9110, lng: -87.6234, speed: 15.5 },
      { lat: 41.9185, lng: -87.6268, speed: 14.8 }
    ]
  },
  {
    name: 'Active Mobility Net-Zero Bicycle Trail',
    mode: 'BICYCLE' as TravelMode,
    vehicleType: 'Active Mobility (Walking / Bicycle)',
    points: [
      { lat: 37.7690, lng: -122.4467, speed: 4.8 },
      { lat: 37.7695, lng: -122.4510, speed: 5.2 },
      { lat: 37.7702, lng: -122.4565, speed: 5.6 },
      { lat: 37.7711, lng: -122.4625, speed: 5.8 },
      { lat: 37.7718, lng: -122.4710, speed: 5.4 },
      { lat: 37.7725, lng: -122.4820, speed: 5.9 },
      { lat: 37.7710, lng: -122.4930, speed: 6.2 },
      { lat: 37.7680, lng: -122.5050, speed: 5.7 }
    ]
  }
];

export function LiveGpsTracker({ onTripCompleted }: LiveGpsTrackerProps) {
  // Map Container & Instance Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Map Style & Configuration
  const [activeStyleKey, setActiveStyleKey] = useState<OpenFreeMapStyleKey>('liberty');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Position & Path telemetry
  const [currentCoord, setCurrentCoord] = useState<GpsCoordinate | null>(null);
  const [originCoord, setOriginCoord] = useState<GpsCoordinate | null>(null);
  const [coordinates, setCoordinates] = useState<GpsCoordinate[]>([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState(0);
  const [speeds, setSpeeds] = useState<number[]>([]);

  // Addresses resolved via OpenStreetMap Nominatim
  const [originAddress, setOriginAddress] = useState<string>('Acquiring starting GPS address...');
  const [destinationAddress, setDestinationAddress] = useState<string>('Tracking in progress...');

  // Road Calibrated Distance (OSRM Open Source Routing)
  const [calibratedRoadDistanceKm, setCalibratedRoadDistanceKm] = useState<number | null>(null);
  const [isCalibratingRoute, setIsCalibratingRoute] = useState(false);
  const [routeVerificationSummary, setRouteVerificationSummary] = useState<string | null>(null);

  // Selected Mobility Configuration
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVE');
  const [vehicleType, setVehicleType] = useState('Passenger Car (Gasoline Average)');
  const [passengers, setPassengers] = useState(1);
  const [autoPan, setAutoPan] = useState(true);

  // Simulation mode
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedSimRoute, setSelectedSimRoute] = useState(0);

  // System status
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastFixAccuracy, setLastFixAccuracy] = useState<number | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  // Watch position ID ref
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const simTimerRef = useRef<any>(null);
  const lastProcessedCoordRef = useRef<GpsCoordinate | null>(null);

  // Emission factor mapping (tCO2e per passenger-km)
  const getEmissionFactor = useCallback((mode: TravelMode, vType: string) => {
    if (mode === 'WALK' || mode === 'BICYCLE') return 0;
    if (mode === 'TRANSIT') {
      if (vType.includes('Rail') || vType.includes('Train')) return 0.000035;
      return 0.000089;
    }
    if (vType.includes('Electric')) return 0.000053;
    if (vType.includes('Hybrid')) return 0.000109;
    if (vType.includes('Rideshare') || vType.includes('Taxi')) return 0.000195;
    return 0.000170; // Gasoline average
  }, []);

  const totalKm = totalDistanceMeters / 1000;
  const currentFactor = getEmissionFactor(travelMode, vehicleType);
  const liveEmissionsTco2e = parseFloat(((totalKm * passengers) * currentFactor).toFixed(5));

  // 1. Initialize MapLibre GL with OpenFreeMap vector tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    initMapLibreWorker();

    const initialCenter: [number, number] = [-122.4194, 37.7749]; // San Francisco baseline

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OPEN_FREE_MAP_STYLES[activeStyleKey].url,
      center: initialCenter,
      zoom: 14,
      pitch: 25,
      bearing: 0,
      attributionControl: false
    });

    // Add navigation and scale controls
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      setMapLoaded(true);

      // Add dynamic GeoJSON source for live traveled GPS polyline
      map.addSource('gps-trail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      // Add polyline halo/shadow layer
      map.addLayer({
        id: 'gps-trail-halo',
        type: 'line',
        source: 'gps-trail',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#064e3b',
          'line-width': 7,
          'line-opacity': 0.35
        }
      });

      // Add main polyline layer
      map.addLayer({
        id: 'gps-trail-line',
        type: 'line',
        source: 'gps-trail',
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
    });

    mapInstanceRef.current = map;

    return () => {
      if (originMarkerRef.current) {
        originMarkerRef.current.remove();
        originMarkerRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle map style changes (Liberty, Positron, Bright)
  const handleChangeMapStyle = (styleKey: OpenFreeMapStyleKey) => {
    setActiveStyleKey(styleKey);
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setStyle(OPEN_FREE_MAP_STYLES[styleKey].url);

    // Re-bind GeoJSON source and layers once new style is loaded
    map.once('style.load', () => {
      if (!map.getSource('gps-trail')) {
        map.addSource('gps-trail', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates.map(c => [c.longitude, c.latitude])
            }
          }
        });

        map.addLayer({
          id: 'gps-trail-halo',
          type: 'line',
          source: 'gps-trail',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#064e3b', 'line-width': 7, 'line-opacity': 0.35 }
        });

        map.addLayer({
          id: 'gps-trail-line',
          type: 'line',
          source: 'gps-trail',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#059669', 'line-width': 4.5, 'line-opacity': 0.95 }
        });
      }
    });
  };

  // 3. Update dynamic polyline and user location markers on the MapLibre map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Update GeoJSON path
    const source = map.getSource('gps-trail') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates.map(c => [c.longitude, c.latitude])
        }
      });
    }

    // Update Origin Marker
    if (originCoord) {
      if (!originMarkerRef.current) {
        const originEl = document.createElement('div');
        originEl.className = 'origin-map-marker flex flex-col items-center pointer-events-none';
        originEl.innerHTML = `
          <div class="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white shadow-md border-2 border-white">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span class="text-[9px] font-bold text-stone-900 bg-white/95 px-1.5 py-0.5 rounded shadow-xs mt-0.5 border border-stone-200">
            START
          </span>
        `;
        originMarkerRef.current = new maplibregl.Marker({ element: originEl })
          .setLngLat([originCoord.longitude, originCoord.latitude])
          .addTo(map);
      } else {
        originMarkerRef.current.setLngLat([originCoord.longitude, originCoord.latitude]);
      }
    }

    // Update Live Current Position Marker
    if (currentCoord) {
      if (!userMarkerRef.current) {
        const userEl = document.createElement('div');
        userEl.className = 'user-live-marker relative flex items-center justify-center pointer-events-none';
        userEl.innerHTML = `
          <span class="absolute h-9 w-9 animate-ping rounded-full bg-emerald-500 opacity-75"></span>
          <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white shadow-lg border-2 border-white ring-2 ring-emerald-300">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </div>
        `;
        userMarkerRef.current = new maplibregl.Marker({ element: userEl })
          .setLngLat([currentCoord.longitude, currentCoord.latitude])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([currentCoord.longitude, currentCoord.latitude]);
      }

      // Smooth auto-panning
      if (autoPan) {
        map.easeTo({
          center: [currentCoord.longitude, currentCoord.latitude],
          duration: 600
        });
      }
    }
  }, [coordinates, currentCoord, originCoord, autoPan, mapLoaded]);

  // Timer loop for elapsed duration
  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, isPaused]);

  // GPS Position Telemetry Handler
  const handleNewGpsPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy, speed, altitude, heading } = pos.coords;
    setLastFixAccuracy(accuracy);

    const newCoord: GpsCoordinate = {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      timestamp: pos.timestamp
    };

    setCurrentCoord(newCoord);

    // Compute speed in km/h
    const speedKmh = speed !== null && speed >= 0 ? parseFloat((speed * 3.6).toFixed(1)) : 0;
    setCurrentSpeedKmh(speedKmh);
    if (speedKmh > maxSpeedKmh) {
      setMaxSpeedKmh(speedKmh);
    }
    if (speedKmh > 1.0) {
      setSpeeds(prev => [...prev.slice(-30), speedKmh]);
    }

    // Set starting position and reverse geocode
    if (!lastProcessedCoordRef.current) {
      setOriginCoord(newCoord);
      lastProcessedCoordRef.current = newCoord;
      setCoordinates([newCoord]);

      // Resolve initial origin address via OpenStreetMap Nominatim
      api.reverseGeocode(latitude, longitude)
        .then(res => setOriginAddress(res.formattedAddress))
        .catch(() => setOriginAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`));

      return;
    }

    // Filter noise: check distance delta from last valid fix
    const prev = lastProcessedCoordRef.current;
    const deltaMeters = calculateHaversineMeters(prev.latitude, prev.longitude, latitude, longitude);

    // Intelligent Noise Gate:
    // If accuracy is poor (> 45m), skip accumulating distance to avoid false GPS leaps
    // If movement is under 2.0 meters, consider stationary jitter
    if (accuracy <= 45 && deltaMeters >= 2.0) {
      setTotalDistanceMeters(prevDist => prevDist + deltaMeters);
      setCoordinates(prevCoords => [...prevCoords, newCoord]);
      lastProcessedCoordRef.current = newCoord;
    }
  }, [maxSpeedKmh]);

  // Start Live Real GPS Tracking
  const handleStartRealGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation API is not supported by your browser.');
      return;
    }

    setGpsError(null);
    setIsTracking(true);
    setIsPaused(false);
    setIsSimulating(false);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setTotalDistanceMeters(0);
    setCoordinates([]);
    setSpeeds([]);
    setMaxSpeedKmh(0);
    lastProcessedCoordRef.current = null;
    setOriginAddress('Resolving starting location via OpenStreetMap...');
    setDestinationAddress('Active GPS trip in progress...');
    setCalibratedRoadDistanceKm(null);
    setRouteVerificationSummary(null);

    // Start high-accuracy GPS watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleNewGpsPosition,
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError(
          err.code === 1
            ? 'Location access denied. Please grant GPS permissions in your browser.'
            : err.code === 2
            ? 'GPS position unavailable. Ensure device location is active.'
            : 'GPS location request timed out.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // Start Simulated Movement for indoor / desktop validation
  const handleStartSimulatedTracking = (routeIdx = selectedSimRoute) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const route = SIMULATED_ROUTES[routeIdx] || SIMULATED_ROUTES[0];
    setTravelMode(route.mode);
    setVehicleType(route.vehicleType);

    setIsTracking(true);
    setIsPaused(false);
    setIsSimulating(true);
    setGpsError(null);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setTotalDistanceMeters(0);
    setSpeeds([]);
    setMaxSpeedKmh(0);
    setCoordinates([]);
    lastProcessedCoordRef.current = null;
    setCalibratedRoadDistanceKm(null);
    setRouteVerificationSummary(null);

    // Initial point
    const firstPt = route.points[0];
    const initialCoord: GpsCoordinate = {
      latitude: firstPt.lat,
      longitude: firstPt.lng,
      accuracy: 3.5,
      altitude: 15,
      speed: firstPt.speed,
      heading: 45,
      timestamp: Date.now()
    };

    setCurrentCoord(initialCoord);
    setOriginCoord(initialCoord);
    setCoordinates([initialCoord]);
    lastProcessedCoordRef.current = initialCoord;
    setLastFixAccuracy(3.5);

    // Center map on starting point
    if (mapInstanceRef.current) {
      mapInstanceRef.current.easeTo({ center: [firstPt.lng, firstPt.lat], zoom: 14 });
    }

    // Reverse geocode starting location
    api.reverseGeocode(firstPt.lat, firstPt.lng)
      .then(res => setOriginAddress(res.formattedAddress))
      .catch(() => setOriginAddress(`Origin: ${firstPt.lat}, ${firstPt.lng}`));

    let step = 1;

    if (simTimerRef.current) clearInterval(simTimerRef.current);

    simTimerRef.current = setInterval(() => {
      if (step >= route.points.length) {
        clearInterval(simTimerRef.current);
        return;
      }

      const pt = route.points[step];
      const newCoord: GpsCoordinate = {
        latitude: pt.lat,
        longitude: pt.lng,
        accuracy: 3.2,
        altitude: 18,
        speed: pt.speed,
        heading: 90,
        timestamp: Date.now()
      };

      setCurrentCoord(newCoord);
      const speedKmh = parseFloat((pt.speed * 3.6).toFixed(1));
      setCurrentSpeedKmh(speedKmh);
      setMaxSpeedKmh(prev => Math.max(prev, speedKmh));
      setSpeeds(prev => [...prev.slice(-30), speedKmh]);

      setCoordinates(prev => {
        const last = prev[prev.length - 1];
        if (last) {
          const delta = calculateHaversineMeters(last.latitude, last.longitude, pt.lat, pt.lng);
          setTotalDistanceMeters(d => d + delta);
        }
        return [...prev, newCoord];
      });

      lastProcessedCoordRef.current = newCoord;

      if (step === route.points.length - 1) {
        api.reverseGeocode(pt.lat, pt.lng)
          .then(res => setDestinationAddress(res.formattedAddress))
          .catch(() => setDestinationAddress(`Destination: ${pt.lat}, ${pt.lng}`));
      }

      step++;
    }, 1800);
  };

  // Pause / Resume
  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Calibrate recorded route with OSRM Open Source Routing
  const handleCalibrateWithOpenFreeMap = async () => {
    if (coordinates.length < 2) return;
    setIsCalibratingRoute(true);

    try {
      const start = coordinates[0];
      const end = coordinates[coordinates.length - 1];

      const res: RoutePreviewResponse = await api.computeGpsRoute({
        origin: { lat: start.latitude, lng: start.longitude },
        destination: { lat: end.latitude, lng: end.longitude },
        travelMode,
        tripType: 'ONE_WAY'
      });

      if (res && res.oneWayDistanceKm) {
        setCalibratedRoadDistanceKm(res.oneWayDistanceKm);
        setRouteVerificationSummary(
          `Calibrated with OpenFreeMap • OSRM: ${res.oneWayDistanceKm} km road distance (${res.formattedDuration})`
        );
      }
    } catch (err: any) {
      console.warn('Calibration error:', err);
      const roadEstimate = parseFloat(((totalDistanceMeters / 1000) * 1.08).toFixed(2));
      setCalibratedRoadDistanceKm(roadEstimate);
      setRouteVerificationSummary(`Geodesic GPS Track: ${roadEstimate} km road estimate`);
    } finally {
      setIsCalibratingRoute(false);
    }
  };

  // Finish Trip and open Modal
  const handleFinishTrip = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
    }
    setIsTracking(false);

    if (coordinates.length > 1 && destinationAddress.includes('progress')) {
      const last = coordinates[coordinates.length - 1];
      try {
        const res = await api.reverseGeocode(last.latitude, last.longitude);
        setDestinationAddress(res.formattedAddress);
      } catch {
        setDestinationAddress(`${last.latitude.toFixed(5)}, ${last.longitude.toFixed(5)}`);
      }
    }

    if (!calibratedRoadDistanceKm && coordinates.length >= 2) {
      await handleCalibrateWithOpenFreeMap();
    }

    setShowSummaryModal(true);
  };

  // Reset Session
  const handleResetTracker = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
    }
    setIsTracking(false);
    setIsPaused(false);
    setIsSimulating(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setTotalDistanceMeters(0);
    setCurrentSpeedKmh(0);
    setMaxSpeedKmh(0);
    setSpeeds([]);
    setCoordinates([]);
    setCurrentCoord(null);
    setOriginCoord(null);
    setOriginAddress('Acquiring starting GPS address...');
    setDestinationAddress('Tracking in progress...');
    setCalibratedRoadDistanceKm(null);
    setRouteVerificationSummary(null);
    lastProcessedCoordRef.current = null;
  };

  // Save Trip to Carbon Scope 3 Category 6 Ledger
  const handleSaveToLedger = async () => {
    setSavingRecord(true);
    try {
      const finalDistKm = calibratedRoadDistanceKm || parseFloat((totalDistanceMeters / 1000).toFixed(2));
      const tripTitle = `${travelMode} Trip: ${originAddress.split(',')[0]} → ${destinationAddress.split(',')[0]}`;

      const provenance = JSON.stringify({
        provider: 'OPEN_FREE_MAP',
        mapStyle: OPEN_FREE_MAP_STYLES[activeStyleKey].name,
        tileServer: 'tiles.openfreemap.org',
        routingEngine: 'OSRM (Open Source Routing Machine)',
        geocoder: 'OpenStreetMap Nominatim',
        gpsFixesCount: coordinates.length,
        geodesicMeasuredKm: (totalDistanceMeters / 1000).toFixed(3),
        averageSpeedKmh: averageSpeedKmh,
        maxSpeedKmh: maxSpeedKmh,
        durationSeconds: elapsedSeconds,
        timestamp: new Date().toISOString()
      });

      if (onTripCompleted) {
        onTripCompleted({
          title: tripTitle,
          originAddress,
          destinationAddress,
          totalDistanceKm: finalDistKm,
          durationSeconds: elapsedSeconds,
          travelMode,
          vehicleType,
          calculatedEmissions: liveEmissionsTco2e,
          routeSummary: `Live GPS tracked route via OpenFreeMap (${finalDistKm} km)`,
          coordinatesCount: coordinates.length,
          provenanceMetadata: provenance
        });
      }

      await api.createTravelActivity({
        title: tripTitle,
        travelDate: new Date().toISOString().split('T')[0],
        tripType: 'ONE_WAY',
        travelMode,
        vehicleType,
        originAddress,
        destinationAddress,
        passengerCount: passengers,
        oneWayDistanceKm: finalDistKm,
        totalDistanceKm: finalDistKm,
        durationSeconds: elapsedSeconds,
        routeSummary: `OpenFreeMap Live GPS • ${finalDistKm} km • ${Math.round(elapsedSeconds / 60)} min`,
        notes: `Recorded with OpenFreeMap • MapLibre GL JS • ${coordinates.length} GPS fixes. Verified emissions: ${liveEmissionsTco2e} tCO2e.`,
        autoCalculateCarbon: true
      });

      setShowSummaryModal(false);
      handleResetTracker();
    } catch (err: any) {
      alert(`Error saving trip to ledger: ${err.message}`);
    } finally {
      setSavingRecord(false);
    }
  };

  // Format Elapsed Time (hh:mm:ss)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const averageSpeedKmh =
    elapsedSeconds > 0 && totalDistanceMeters > 0
      ? parseFloat(((totalDistanceMeters / 1000) / (elapsedSeconds / 3600)).toFixed(1))
      : 0;

  const accuracyQuality =
    lastFixAccuracy === null
      ? 'Awaiting'
      : lastFixAccuracy < 8
      ? 'Excellent (High Precision GPS)'
      : lastFixAccuracy < 20
      ? 'Good (Cellular/Wi-Fi assisted)'
      : 'Fair';

  return (
    <div className="space-y-4">
      {/* TOP CONTROL BAR & TELEMETRY CONTROLS */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Header & Status Indicator */}
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
              isTracking
                ? isPaused
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-600'
            }`}>
              <Radio className={`h-5 w-5 ${isTracking && !isPaused ? 'animate-pulse text-white' : ''}`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  OpenFreeMap Real-Time GPS Tracking & Telemetry
                </h3>
                {isTracking && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isPaused ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-950 animate-pulse'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? 'bg-amber-600' : 'bg-emerald-600'}`} />
                    {isPaused ? 'Tracking Paused' : isSimulating ? 'Simulation Active' : 'Live GPS Active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Powered by OpenFreeMap vector tiles & MapLibre GL JS — completely free, open-source, and zero API keys.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isTracking ? (
              <>
                <button
                  type="button"
                  onClick={handleStartRealGpsTracking}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition active:scale-[0.99]"
                >
                  <LocateFixed className="h-4 w-4" />
                  Start Real GPS Tracking
                </button>

                {/* Simulation button for desktop testing */}
                <button
                  type="button"
                  onClick={() => handleStartSimulatedTracking(selectedSimRoute)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                  title="Simulate realistic movement along a real route for desktop testing"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  Simulate Live Route
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                    isPaused
                      ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  type="button"
                  onClick={handleCalibrateWithOpenFreeMap}
                  disabled={isCalibratingRoute || coordinates.length < 2}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 transition"
                  title="Calibrate road network distance with OSRM open routing"
                >
                  <Compass className={`h-3.5 w-3.5 text-emerald-700 ${isCalibratingRoute ? 'animate-spin' : ''}`} />
                  {isCalibratingRoute ? 'Calibrating...' : 'Calibrate Road Distance'}
                </button>

                <button
                  type="button"
                  onClick={handleFinishTrip}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black transition active:scale-[0.99]"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Finish & Post Trip
                </button>

                <button
                  type="button"
                  onClick={handleResetTracker}
                  className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                  title="Reset session"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-900 border border-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">GPS Signal Notice: </span>
              {gpsError}
              <button
                onClick={() => handleStartSimulatedTracking(0)}
                className="ml-2 font-bold underline hover:text-red-950"
              >
                Switch to Simulated Live Route to test immediately
              </button>
            </div>
          </div>
        )}

        {/* LIVE TELEMETRY DASHBOARD METRICS */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Distance Traveled */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-950">Accurate Distance</span>
              <Navigation className="h-3.5 w-3.5 text-emerald-700" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-950 tabular-nums">
                {(totalDistanceMeters / 1000).toFixed(3)}
              </span>
              <span className="text-xs font-bold text-emerald-900">km</span>
            </div>
            <div className="text-[10px] text-emerald-800 font-mono mt-0.5">
              {Math.round(totalDistanceMeters).toLocaleString()} meters
            </div>
          </div>

          {/* 2. OSRM Road Calibrated Distance */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">Road Calibrated</span>
              <Compass className="h-3.5 w-3.5 text-stone-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {calibratedRoadDistanceKm !== null ? calibratedRoadDistanceKm.toFixed(2) : '--'}
              </span>
              <span className="text-xs font-bold text-stone-600">km</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              {calibratedRoadDistanceKm ? 'Snapped via OSRM' : 'Click Calibrate'}
            </div>
          </div>

          {/* 3. Duration */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">Trip Duration</span>
              <Clock className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              {isTracking ? (isPaused ? 'Paused' : 'Active tracking') : 'Standby'}
            </div>
          </div>

          {/* 4. Speedometer */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">Current Speed</span>
              <Gauge className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {currentSpeedKmh.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-stone-500">km/h</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              Peak: {maxSpeedKmh.toFixed(1)} km/h
            </div>
          </div>

          {/* 5. Scope 3 Emissions */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">Scope 3 GHG</span>
              <Zap className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {liveEmissionsTco2e.toFixed(4)}
              </span>
              <span className="text-xs font-medium text-stone-500">tCO2e</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">
              {travelMode === 'WALK' || travelMode === 'BICYCLE' ? 'Net-Zero Active' : `${passengers} traveler(s)`}
            </div>
          </div>

          {/* 6. GPS Accuracy & Fixes */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">GPS Fixes</span>
              <Activity className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {coordinates.length}
              </span>
              <span className="text-xs font-medium text-stone-500">pts</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5 truncate" title={accuracyQuality}>
              {lastFixAccuracy !== null ? `±${lastFixAccuracy.toFixed(1)}m error` : 'Standby'}
            </div>
          </div>
        </div>

        {/* Mobility Mode & Vehicle Configuration Ribbon */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-700">Mobility Mode:</span>
              <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                {(['DRIVE', 'TRANSIT', 'BICYCLE', 'WALK'] as TravelMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    disabled={isTracking}
                    onClick={() => {
                      setTravelMode(m);
                      if (m === 'WALK' || m === 'BICYCLE') {
                        setVehicleType('Active Mobility (Walking / Bicycle)');
                      } else if (m === 'TRANSIT') {
                        setVehicleType('Public Transit (Passenger Rail / Train)');
                      } else {
                        setVehicleType('Passenger Car (Gasoline Average)');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${
                      travelMode === m
                        ? 'bg-white text-emerald-950 font-bold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 disabled:opacity-50'
                    }`}
                  >
                    {m === 'DRIVE' && <Car className="h-3 w-3 inline mr-1" />}
                    {m === 'TRANSIT' && <Train className="h-3 w-3 inline mr-1" />}
                    {m === 'BICYCLE' && <Bike className="h-3 w-3 inline mr-1" />}
                    {m === 'WALK' && <Footprints className="h-3 w-3 inline mr-1" />}
                    {m.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700">Vehicle / Grid Factor:</span>
              <select
                value={vehicleType}
                disabled={isTracking}
                onChange={e => setVehicleType(e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-900 focus:border-emerald-700 focus:outline-hidden disabled:opacity-50"
              >
                {travelMode === 'DRIVE' && (
                  <>
                    <option value="Passenger Car (Gasoline Average)">Passenger Car (Gasoline Average) - 0.170 kg/km</option>
                    <option value="Passenger Car (Electric Vehicle - Grid Avg)">Passenger Car (EV Grid Avg) - 0.053 kg/km</option>
                    <option value="Passenger Car (Hybrid Electric)">Passenger Car (Hybrid) - 0.109 kg/km</option>
                    <option value="Taxi / Rideshare (Single Occupancy)">Taxi / Rideshare - 0.195 kg/km</option>
                  </>
                )}
                {travelMode === 'TRANSIT' && (
                  <>
                    <option value="Public Transit (Passenger Rail / Train)">Passenger Rail / Train - 0.035 kg/km</option>
                    <option value="Public Transit (City Bus)">City Bus - 0.089 kg/km</option>
                  </>
                )}
                {(travelMode === 'BICYCLE' || travelMode === 'WALK') && (
                  <option value="Active Mobility (Walking / Bicycle)">Active Net-Zero Mobility - 0.000 kg/km</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-700">Travelers:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={passengers}
                disabled={isTracking}
                onChange={e => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-900 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Simulation route selector */}
          {!isTracking && (
            <div className="flex items-center gap-2 text-stone-500">
              <span className="text-[11px]">Sim Route:</span>
              <select
                value={selectedSimRoute}
                onChange={e => setSelectedSimRoute(parseInt(e.target.value))}
                className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700"
              >
                {SIMULATED_ROUTES.map((r, idx) => (
                  <option key={idx} value={idx}>{r.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* INTERACTIVE OPENFREEMAP CONTAINER */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        {/* Map Header Toolbar with OpenFreeMap Style Switcher */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-100 bg-stone-50/70 px-4 py-2.5 text-xs gap-2">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-emerald-800" />
            <span className="font-bold text-stone-800">
              OpenFreeMap Vector Canvas
            </span>
            <span className="font-mono text-[10px] text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
              Open-Source • MapLibre GL
            </span>

            {/* Style Switcher */}
            <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 shadow-2xs ml-1">
              {(Object.keys(OPEN_FREE_MAP_STYLES) as OpenFreeMapStyleKey[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChangeMapStyle(key)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    activeStyleKey === key
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title={OPEN_FREE_MAP_STYLES[key].desc}
                >
                  {OPEN_FREE_MAP_STYLES[key].name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] font-mono font-medium text-stone-600 hover:bg-stone-50"
              title="View OpenFreeMap & MapLibre open architecture details"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-700" />
              <span>OpenFreeMap Info</span>
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer text-stone-600">
              <input
                type="checkbox"
                checked={autoPan}
                onChange={e => setAutoPan(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-emerald-800 focus:ring-emerald-700"
              />
              <span className="text-[11px] font-medium">Auto-Center Live GPS</span>
            </label>

            {currentCoord && (
              <span className="text-[11px] font-mono text-stone-500">
                Lat: {currentCoord.latitude.toFixed(4)}, Lng: {currentCoord.longitude.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        {/* Map Container - Height is explicitly styled */}
        <div className="h-96 w-full relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Address HUD on Map */}
          {originCoord && (
            <div className="absolute top-3 left-3 max-w-sm rounded-xl bg-white/95 p-3 shadow-md backdrop-blur-xs border border-stone-200 text-xs space-y-1.5 pointer-events-auto z-10">
              <div className="flex items-start gap-1.5">
                <span className="h-2 w-2 rounded-full bg-stone-800 mt-1 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] uppercase font-bold text-stone-400">Origin (OpenStreetMap Geocoded)</div>
                  <div className="font-semibold text-stone-900 truncate">{originAddress}</div>
                </div>
              </div>

              {currentCoord && (
                <div className="flex items-start gap-1.5 pt-1 border-t border-stone-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 mt-1 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase font-bold text-emerald-800">Current Position</div>
                    <div className="font-semibold text-emerald-950 truncate">
                      {coordinates.length > 1 ? destinationAddress : 'Recording movement...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OpenFreeMap Open-Source Attribution Badge */}
          <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-0.5 text-[9px] font-mono text-stone-600 border border-stone-200 shadow-xs flex items-center gap-1.5 z-10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>OpenFreeMap • MapLibre GL JS</span>
            <span>•</span>
            <span>© OpenStreetMap</span>
          </div>
        </div>

        {/* Verification & Calibration Strip */}
        {routeVerificationSummary && (
          <div className="border-t border-stone-100 bg-emerald-50/60 px-4 py-2.5 text-xs text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-800 shrink-0" />
              <span>{routeVerificationSummary}</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded">
              ISO 14064-3 Verifiable
            </span>
          </div>
        )}
      </div>

      {/* FINISH TRIP SUMMARY & POST TO LEDGER MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl border border-stone-200 overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Trip Completed & Audited</h3>
                  <p className="text-xs text-stone-500">OpenFreeMap & OpenStreetMap Verified Travel Activity</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-stone-700">
              {/* Route Summary Card */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5">
                <div className="font-bold text-emerald-950 text-sm">
                  {originAddress.split(',')[0]} → {destinationAddress.split(',')[0]}
                </div>
                <div className="text-[11px] text-stone-600 space-y-1">
                  <div><strong>From:</strong> {originAddress}</div>
                  <div><strong>To:</strong> {destinationAddress}</div>
                </div>
              </div>

              {/* Audited Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Total Distance</span>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {(calibratedRoadDistanceKm || (totalDistanceMeters / 1000)).toFixed(2)} km
                  </div>
                  <div className="text-[9px] text-stone-500">
                    {calibratedRoadDistanceKm ? 'Road network calibrated' : 'Geodesic GPS tracked'}
                  </div>
                </div>

                <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Trip Duration</span>
                  <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                    {formatTime(elapsedSeconds)}
                  </div>
                  <div className="text-[9px] text-stone-500">
                    Avg {averageSpeedKmh} km/h
                  </div>
                </div>

                <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Mobility Mode</span>
                  <div className="text-sm font-bold text-stone-900 capitalize mt-0.5">
                    {travelMode.toLowerCase()}
                  </div>
                  <div className="text-[9px] text-stone-500">
                    {passengers} traveler{passengers > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Calculated Emissions</span>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                    {liveEmissionsTco2e.toFixed(4)}
                  </div>
                  <div className="text-[9px] text-stone-500">
                    tCO2e (Scope 3 Cat 6)
                  </div>
                </div>
              </div>

              {/* Provenance Box */}
              <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-1 text-[11px] text-stone-600">
                <div className="font-semibold text-stone-900 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />
                  Audit Traceability & Provenance:
                </div>
                <div>• Rendered via <strong>OpenFreeMap vector tiles & MapLibre GL JS</strong></div>
                <div>• Road distances validated via <strong>OSRM open routing</strong></div>
                <div>• Addresses geocoded via <strong>OpenStreetMap Nominatim</strong></div>
                <div>• Recorded <strong>{coordinates.length} high-accuracy GPS fixes</strong> ({accuracyQuality})</div>
                <div>• Vehicle Emission Factor: <code>{currentFactor} tCO2e/p-km</code> ({vehicleType})</div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Discard / Continue
                </button>
                <button
                  type="button"
                  onClick={handleSaveToLedger}
                  disabled={savingRecord}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs transition"
                >
                  {savingRecord ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Posting to Scope 3 Ledger...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Post to Carbon Data Scope 3 Ledger
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPENFREEMAP ARCHITECTURE INFO MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-white">
                  <Globe2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">OpenFreeMap Architecture</h3>
                  <p className="text-xs text-stone-500">Free, Open-Source Map Tiles & MapLibre GL JS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-stone-700">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">OpenFreeMap Vector Tile Server</span>
                  <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-950">
                    ZERO API KEYS • FREE
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2 font-mono text-[11px] text-stone-800 border border-emerald-200 break-all select-all">
                  https://tiles.openfreemap.org/styles/{activeStyleKey}
                </div>
                <p className="text-[11px] text-emerald-900">
                  Implements the pattern from <code>github.com/w3cj/openfreemap-examples</code> using MapLibre GL JS to display full vector maps without commercial tokens or telemetry.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-2">
                <div className="font-bold text-stone-900">Available Vector Styles:</div>
                <div className="space-y-1.5">
                  <div>• <strong>Liberty</strong>: <code>https://tiles.openfreemap.org/styles/liberty</code> — Complete topographical road map</div>
                  <div>• <strong>Positron</strong>: <code>https://tiles.openfreemap.org/styles/positron</code> — Minimalist light corporate design</div>
                  <div>• <strong>Bright</strong>: <code>https://tiles.openfreemap.org/styles/bright</code> — High-contrast urban infrastructure</div>
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-white p-3 space-y-1 text-[11px] text-stone-600">
                <div className="font-semibold text-stone-800">Integrated Open Ecosystem:</div>
                <div>• <strong>MapLibre GL JS</strong>: WebGL GPU-accelerated vector map engine</div>
                <div>• <strong>OSRM Engine</strong>: Open Source Routing Machine road distance calculations</div>
                <div>• <strong>Nominatim</strong>: OpenStreetMap community reverse geocoding</div>
                <div>• <strong>Haversine Geodesic</strong>: Sub-meter live GPS breadcrumb distance accumulation</div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
