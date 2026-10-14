import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Car,
  Train,
  Bike,
  Footprints,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Calculator,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Info,
  Navigation,
  Compass,
  FileCheck2,
  Sparkles,
  AlertCircle,
  X,
  LocateFixed,
  Radio
} from 'lucide-react';
import { maplibregl, initMapLibreWorker } from '../../utils/maplibre';
import { LiveGpsTracker } from '../../components/travel/LiveGpsTracker';
import { OpenFreeMapRouteMap } from '../../components/travel/OpenFreeMapRouteMap';
import { api } from '../../services/api';
import {
  TravelActivityItem,
  TravelMode,
  TripType,
  RoutePreviewResponse,
  EmissionFactor
} from '../../types';
import { useAuth } from '../../context/AuthContext';

function OpenFreeMapPreview({
  coordinates,
  origin,
  destination
}: {
  origin: string;
  destination: string;
  coordinates?: [number, number][];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [styleKey, setStyleKey] = React.useState<'liberty' | 'positron' | 'bright'>('liberty');

  React.useEffect(() => {
    if (!containerRef.current) return;
    initMapLibreWorker();
    const initialCenter: [number, number] = coordinates && coordinates.length > 0 ? coordinates[0] : [-87.6298, 41.8781];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://tiles.openfreemap.org/styles/${styleKey}`,
      center: initialCenter,
      zoom: 10,
      attributionControl: false
    });

    map.on('load', () => {
      if (coordinates && coordinates.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          }
        });

        // Casing layer
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#064e3b',
            'line-width': 7,
            'line-opacity': 0.35
          }
        });

        // Main line
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#059669',
            'line-width': 4
          }
        });

        // Origin Marker (A)
        const originEl = document.createElement('div');
        originEl.innerHTML = `<div style="background:#059669;color:#fff;font-weight:700;font-size:10px;padding:2px 6px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3)">A</div>`;
        new maplibregl.Marker({ element: originEl, anchor: 'bottom' })
          .setLngLat(coordinates[0])
          .addTo(map);

        // Destination Marker (B)
        const destEl = document.createElement('div');
        destEl.innerHTML = `<div style="background:#e11d48;color:#fff;font-weight:700;font-size:10px;padding:2px 6px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3)">B</div>`;
        new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
          .setLngLat(coordinates[coordinates.length - 1])
          .addTo(map);

        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach(c => bounds.extend(c));
        map.fitBounds(bounds, { padding: 40 });
      }
    });

    return () => {
      map.remove();
    };
  }, [coordinates, styleKey]);

  return (
    <div className="h-52 w-full rounded-xl overflow-hidden border border-emerald-200 relative bg-stone-100 shadow-xs">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-stone-200 text-[10px] font-semibold">
        {(['liberty', 'positron', 'bright'] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStyleKey(s)}
            className={`px-1.5 py-0.5 rounded capitalize ${styleKey === s ? 'bg-emerald-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="absolute bottom-1 right-2 bg-white/90 px-2 py-0.5 text-[9px] rounded font-mono text-stone-600 border border-stone-200 shadow-xs z-10">
        OpenFreeMap • MapLibre GL
      </div>
    </div>
  );
}

export function TravelMobilityPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'map' | 'tracker' | 'ledger'>('map');
  const [resolvingGpsField, setResolvingGpsField] = useState<'origin' | 'destination' | null>(null);
  const [activities, setActivities] = useState<TravelActivityItem[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [provenanceModalItem, setProvenanceModalItem] = useState<TravelActivityItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formWaypoints, setFormWaypoints] = useState<string[]>([]);
  const [formMode, setFormMode] = useState<TravelMode>('DRIVE');
  const [formTripType, setFormTripType] = useState<TripType>('ROUND_TRIP');
  const [formVehicleType, setFormVehicleType] = useState('Passenger Car (Gasoline Average)');
  const [formPassengers, setFormPassengers] = useState(1);
  const [formNotes, setFormNotes] = useState('');
  const [autoCalculateCarbon, setAutoCalculateCarbon] = useState(true);

  // Live Route Preview
  const [routePreview, setRoutePreview] = useState<RoutePreviewResponse | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const handleUseCurrentGps = (target: 'origin' | 'destination') => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setResolvingGpsField(target);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (target === 'origin') {
            setFormOrigin(res.formattedAddress);
          } else {
            setFormDestination(res.formattedAddress);
          }
        } catch {
          const fallback = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          if (target === 'origin') setFormOrigin(fallback);
          else setFormDestination(fallback);
        } finally {
          setResolvingGpsField(null);
          setRoutePreview(null);
        }
      },
      (err) => {
        setResolvingGpsField(null);
        alert(`GPS location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canEdit = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER' || role === 'ANALYST' || role === 'EMPLOYEE';
  const canDelete = role === 'COMPANY_ADMIN' || role === 'SUSTAINABILITY_MANAGER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, factorList] = await Promise.all([
        api.getTravelActivities({
          travelMode: modeFilter,
          status: statusFilter
        }),
        api.getEmissionFactors()
      ]);
      setActivities(res.items);
      setFactors(factorList.filter(f => f.category === 'Business Travel'));
    } catch (err) {
      console.error('Failed to load travel activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modeFilter, statusFilter]);

  // Request OpenFreeMap & OSRM route calculation
  const handleCalculateRoute = async () => {
    if (!formOrigin.trim() || !formDestination.trim()) {
      setRouteError('Please enter both origin and destination addresses.');
      return;
    }

    setCalculatingRoute(true);
    setRouteError(null);

    try {
      const preview = await api.computeRoutePreview({
        origin: formOrigin.trim(),
        destination: formDestination.trim(),
        waypoints: formWaypoints.filter(w => w.trim().length > 0),
        travelMode: formMode,
        tripType: formTripType
      });
      setRoutePreview(preview);
    } catch (err: any) {
      console.error(err);
      setRouteError(err?.message || 'Unable to calculate route via OpenFreeMap. Please verify addresses.');
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleAddWaypoint = () => {
    if (formWaypoints.length < 5) {
      setFormWaypoints([...formWaypoints, '']);
    }
  };

  const handleRemoveWaypoint = (idx: number) => {
    setFormWaypoints(formWaypoints.filter((_, i) => i !== idx));
  };

  const handleUpdateWaypoint = (idx: number, val: string) => {
    const updated = [...formWaypoints];
    updated[idx] = val;
    setFormWaypoints(updated);
  };

  const handleSaveTravel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrigin.trim() || !formDestination.trim()) return;

    setSaving(true);
    try {
      const oneWayKm = routePreview ? routePreview.oneWayDistanceKm : 35.0;
      const totalKm = routePreview
        ? routePreview.totalDistanceKm
        : (formTripType === 'ROUND_TRIP' ? oneWayKm * 2 : oneWayKm);
      const durationSec = routePreview ? routePreview.durationSeconds : 1800;

      await api.createTravelActivity({
        title: formTitle.trim() || `Travel: ${formOrigin} → ${formDestination}`,
        travelDate: formDate,
        tripType: formTripType,
        travelMode: formMode,
        vehicleType: formVehicleType,
        originAddress: formOrigin,
        destinationAddress: formDestination,
        waypoints: formWaypoints.filter(w => w.trim().length > 0),
        passengerCount: formPassengers,
        oneWayDistanceKm: oneWayKm,
        totalDistanceKm: totalKm,
        durationSeconds: durationSec,
        routeSummary: routePreview?.routeSummary || `${formMode} route via OpenFreeMap`,
        notes: formNotes,
        autoCalculateCarbon: autoCalculateCarbon
      });

      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving travel activity');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormOrigin('');
    setFormDestination('');
    setFormWaypoints([]);
    setFormMode('DRIVE');
    setFormTripType('ROUND_TRIP');
    setFormVehicleType('Passenger Car (Gasoline Average)');
    setFormPassengers(1);
    setFormNotes('');
    setRoutePreview(null);
    setRouteError(null);
  };

  const handleSyncToCarbon = async (id: string) => {
    try {
      await api.calculateTravelCarbon(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error syncing to carbon ledger');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this travel activity record?')) return;
    try {
      await api.deleteTravelActivity(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting travel activity');
    }
  };

  const handleExportCSV = () => {
    if (activities.length === 0) return;
    const headers = 'ID,Date,Trip Title,Travel Mode,Vehicle Profile,Origin,Destination,Trip Type,Passengers,Distance (km),Emissions (tCO2e),Routing Service,Status\n';
    const rows = activities.map(a =>
      `"${a.id}","${a.travelDate}","${a.title}","${a.travelMode}","${a.vehicleType || ''}","${a.originAddress}","${a.destinationAddress}","${a.tripType}","${a.passengerCount}","${a.totalDistanceKm}","${a.calculatedEmissions || 0}","${a.routingService}","${a.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbonflow_travel_mobility_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Metrics calculation
  const totalDistanceKm = activities.reduce((sum, a) => sum + (a.totalDistanceKm || 0), 0);
  const totalEmissionsTco2e = activities.reduce((sum, a) => sum + (a.calculatedEmissions || 0), 0);
  const activeTravelCount = activities.length;
  const zeroEmissionCount = activities.filter(a => a.travelMode === 'WALK' || a.travelMode === 'BICYCLE').length;
  const cleanMobilityRatio = activeTravelCount > 0 ? ((zeroEmissionCount / activeTravelCount) * 100).toFixed(0) : '0';

  const filteredActivities = activities.filter(a => {
    const matchesSearch = searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.originAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <Compass className="h-3.5 w-3.5 text-emerald-600" />
            Scope 3 Category 6 Business Travel & Commuting
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Travel & Mobility Activity</h1>
          <p className="text-sm text-stone-500 mt-1">
            Calculate accurate route distances using OpenFreeMap vector maps and OSRM routing, verify transit modes, and integrate auditable activity data directly into CarbonFlow’s emissions ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={activities.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export Travel CSV
          </button>
          {canEdit && (
            <button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition active:scale-[0.99]"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Travel Activity
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Travel Distance</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Navigation className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{totalDistanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
            <span className="text-xs font-medium text-stone-500">km</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500">Audited via OpenFreeMap & OSRM routing</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Scope 3 Emissions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{totalEmissionsTco2e.toFixed(3)}</span>
            <span className="text-xs font-medium text-stone-500">tCO2e</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500">Calculated with EPA / DEFRA 2024 factors</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Travel Records</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{activeTravelCount}</span>
            <span className="text-xs font-medium text-stone-500">activities</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500">Tracked with route timestamps & provenance</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Mobility</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-800">{cleanMobilityRatio}%</span>
            <span className="text-xs font-medium text-stone-500">zero-direct emission</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-500">Walking & cycling travel logs</p>
        </div>
      </div>

      {/* View Switcher Tabs: Interactive Route Map vs. Live GPS Tracker vs. Travel Ledger */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px shrink-0 ${
            activeTab === 'map'
              ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Compass className={`h-4 w-4 ${activeTab === 'map' ? 'text-emerald-700' : 'text-stone-400'}`} />
          <span>Interactive Route Planner & Map</span>
          <span className="rounded-full bg-emerald-100 text-emerald-950 px-2 py-0.5 text-[10px] font-mono font-semibold">
            OpenFreeMap
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tracker')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px shrink-0 ${
            activeTab === 'tracker'
              ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Radio className={`h-4 w-4 ${activeTab === 'tracker' ? 'text-emerald-700 animate-pulse' : 'text-stone-400'}`} />
          <span>Live GPS Telemetry Tracker</span>
          <span className="rounded-full bg-stone-100 text-stone-700 px-2 py-0.5 text-[10px] font-mono">
            GPS Stream
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px shrink-0 ${
            activeTab === 'ledger'
              ? 'border-emerald-800 text-emerald-950 bg-emerald-50/50'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <FileCheck2 className="h-4 w-4 text-stone-500" />
          <span>Audited Travel Ledger & Historical Routes</span>
          <span className="rounded-full bg-stone-100 text-stone-700 px-2 py-0.5 text-[10px] font-mono">
            {activities.length}
          </span>
        </button>
      </div>

      {activeTab === 'map' && (
        <OpenFreeMapRouteMap
          onSaveTrip={async (tripData) => {
            await api.createTravelActivity(tripData);
            await loadData();
            setActiveTab('ledger');
          }}
        />
      )}

      {activeTab === 'tracker' && (
        <LiveGpsTracker
          onTripCompleted={() => {
            loadData();
            setActiveTab('ledger');
          }}
        />
      )}

      {activeTab === 'ledger' && (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by title, origin or destination..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <Filter className="h-3.5 w-3.5 text-stone-400" />
                <span>Mode:</span>
                <select
                  value={modeFilter}
                  onChange={e => setModeFilter(e.target.value)}
                  className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-800 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="ALL">All Travel Modes</option>
                  <option value="DRIVE">Driving (Car)</option>
                  <option value="TRANSIT">Public Transit</option>
                  <option value="BICYCLE">Cycling</option>
                  <option value="WALK">Walking</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-800 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CALCULATED">Ledger Synced</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>
          </div>

      {/* Travel Activities Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
        <div className="border-b border-stone-100 bg-stone-50/50 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-stone-800">Verified Travel Activities & Distance Ledger</h3>
          </div>
          <span className="text-xs text-stone-500">
            Showing {filteredActivities.length} of {activities.length} records
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-800" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center">
            <Compass className="mx-auto h-8 w-8 text-stone-400" />
            <h4 className="mt-2 text-sm font-semibold text-stone-800">No travel activities found</h4>
            <p className="mt-1 text-xs text-stone-500">
              {searchQuery ? 'Try adjusting your search filters.' : 'Log a new business trip or employee commute to calculate auditable route distance.'}
            </p>
            {canEdit && (
              <button
                onClick={() => { resetForm(); setModalOpen(true); }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Travel Activity
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Travel Date & Title</th>
                  <th className="px-4 py-3">Route (OpenFreeMap Verified)</th>
                  <th className="px-4 py-3">Mode & Profile</th>
                  <th className="px-4 py-3 text-right">Distance (km)</th>
                  <th className="px-4 py-3 text-right">Emissions (tCO2e)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredActivities.map(activity => {
                  const isCalculated = activity.status === 'CALCULATED';
                  return (
                    <tr key={activity.id} className="hover:bg-stone-50/70 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-900">{activity.title}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                          <span>{activity.travelDate}</span>
                          <span>•</span>
                          <span>{activity.userFullName || 'Employee'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5 font-medium text-stone-800 truncate" title={`${activity.originAddress} → ${activity.destinationAddress}`}>
                          <span className="truncate">{activity.originAddress}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-stone-400" />
                          <span className="truncate">{activity.destinationAddress}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                          <span className="font-mono text-[9px] uppercase px-1 py-0.2 bg-stone-100 rounded text-stone-600">
                            {activity.tripType === 'ROUND_TRIP' ? 'Round Trip' : 'One-Way'}
                          </span>
                          <span>•</span>
                          <span>{activity.routeSummary || 'Routes API v2'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 font-medium text-stone-800">
                          {activity.travelMode === 'DRIVE' && <Car className="h-3.5 w-3.5 text-blue-600" />}
                          {activity.travelMode === 'TRANSIT' && <Train className="h-3.5 w-3.5 text-purple-600" />}
                          {activity.travelMode === 'BICYCLE' && <Bike className="h-3.5 w-3.5 text-emerald-600" />}
                          {activity.travelMode === 'WALK' && <Footprints className="h-3.5 w-3.5 text-teal-600" />}
                          <span>{activity.travelMode}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5 truncate max-w-xs">
                          {activity.vehicleType || 'Standard'} ({activity.passengerCount} {activity.passengerCount > 1 ? 'passengers' : 'pax'})
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-medium text-stone-900">
                        {activity.totalDistanceKm.toFixed(1)} km
                        <div className="text-[10px] font-sans text-stone-400">
                          ({activity.oneWayDistanceKm.toFixed(1)} km / leg)
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="font-mono font-bold text-stone-900">
                          {activity.calculatedEmissions != null ? activity.calculatedEmissions.toFixed(4) : '—'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {activity.travelMode === 'WALK' || activity.travelMode === 'BICYCLE' ? 'Zero Direct' : 'Scope 3.6'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isCalculated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isCalculated ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {activity.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setProvenanceModalItem(activity)}
                          title="View Routing Provenance & Audit Trail"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Provenance
                        </button>

                        {!isCalculated && (
                          <button
                            onClick={() => handleSyncToCarbon(activity.id)}
                            title="Calculate & Link to Carbon Ledger"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 border border-blue-200"
                          >
                            <Calculator className="h-3 w-3" />
                            Post
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(activity.id)}
                            title="Delete record"
                            className="inline-flex items-center p-1 text-stone-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* CREATE TRAVEL ACTIVITY MODAL WITH OPENFREEMAP ROUTING */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-stone-200 my-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Log Travel Activity & Compute Route</h3>
                  <p className="text-xs text-stone-500">OpenFreeMap & OSRM Routing Engine</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTravel} className="p-6 space-y-5">
              {/* Trip Title & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Trip Purpose / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Onsite Client Audit - Chicago to Milwaukee"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Travel Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Mode & Return Trip Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Travel Mode</label>
                  <select
                    value={formMode}
                    onChange={e => {
                      const m = e.target.value as TravelMode;
                      setFormMode(m);
                      if (m === 'WALK' || m === 'BICYCLE') {
                        setFormVehicleType('Active Mobility (Walking / Bicycle)');
                      } else if (m === 'TRANSIT') {
                        setFormVehicleType('Public Transit (Passenger Rail / Train)');
                      } else {
                        setFormVehicleType('Passenger Car (Gasoline Average)');
                      }
                      setRoutePreview(null);
                    }}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="DRIVE">Driving (Car / Fleet)</option>
                    <option value="TRANSIT">Public Transit (Train / Bus)</option>
                    <option value="BICYCLE">Cycling (Bicycle)</option>
                    <option value="WALK">Walking</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Journey Type</label>
                  <select
                    value={formTripType}
                    onChange={e => {
                      setFormTripType(e.target.value as TripType);
                      setRoutePreview(null);
                    }}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="ROUND_TRIP">Round Trip (Return)</option>
                    <option value="ONE_WAY">One-Way</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Passengers / Travelers</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formPassengers}
                    onChange={e => setFormPassengers(parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Vehicle / Fuel Profile */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Vehicle / Fuel Emission Factor Profile</label>
                <select
                  value={formVehicleType}
                  onChange={e => setFormVehicleType(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  {formMode === 'DRIVE' && (
                    <>
                      <option value="Passenger Car (Gasoline Average)">Passenger Car (Gasoline Average) - 0.000170 tCO2e/p-km (EPA)</option>
                      <option value="Passenger Car (Electric Vehicle - Grid Avg)">Passenger Car (Electric Vehicle) - 0.000053 tCO2e/p-km (EPA eGRID)</option>
                      <option value="Passenger Car (Hybrid Electric)">Passenger Car (Hybrid) - 0.000109 tCO2e/p-km (DEFRA)</option>
                      <option value="Taxi / Rideshare (Single Occupancy)">Taxi / Rideshare - 0.000195 tCO2e/p-km (DEFRA)</option>
                    </>
                  )}
                  {formMode === 'TRANSIT' && (
                    <>
                      <option value="Public Transit (Passenger Rail / Train)">Passenger Rail / Train - 0.000035 tCO2e/p-km (DEFRA)</option>
                      <option value="Public Transit (City Bus)">City Bus - 0.000089 tCO2e/p-km (EPA GHG Hub)</option>
                    </>
                  )}
                  {(formMode === 'BICYCLE' || formMode === 'WALK') && (
                    <option value="Active Mobility (Walking / Bicycle)">Active Mobility (Zero Direct Emissions) - 0.000000 tCO2e</option>
                  )}
                </select>
              </div>

              {/* Route Waypoints: Origin & Destination */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                    Route Locations (OpenFreeMap & OpenStreetMap Geocoding)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddWaypoint}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Stop / Waypoint
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-500 w-16">Origin:</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 200 S Wacker Dr, Chicago, IL or O'Hare Airport"
                      value={formOrigin}
                      onChange={e => { setFormOrigin(e.target.value); setRoutePreview(null); }}
                      className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleUseCurrentGps('origin')}
                      disabled={resolvingGpsField !== null}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 shrink-0"
                      title="Detect current GPS location via OpenStreetMap Nominatim"
                    >
                      <LocateFixed className={`h-3 w-3 ${resolvingGpsField === 'origin' ? 'animate-spin' : ''}`} />
                      {resolvingGpsField === 'origin' ? 'Locating...' : 'Use GPS'}
                    </button>
                  </div>

                  {/* Intermediate Stops */}
                  {formWaypoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center gap-2 pl-4">
                      <span className="text-[10px] font-medium text-stone-400 w-12">Stop {idx + 1}:</span>
                      <input
                        type="text"
                        placeholder="e.g. Kenosha Regional Facility"
                        value={wp}
                        onChange={e => handleUpdateWaypoint(idx, e.target.value)}
                        className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveWaypoint(idx)}
                        className="p-1 text-stone-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-500 w-16">Destination:</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 100 E Wisconsin Ave, Milwaukee, WI"
                      value={formDestination}
                      onChange={e => { setFormDestination(e.target.value); setRoutePreview(null); }}
                      className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleUseCurrentGps('destination')}
                      disabled={resolvingGpsField !== null}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 shrink-0"
                      title="Detect current GPS location via OpenStreetMap Nominatim"
                    >
                      <LocateFixed className={`h-3 w-3 ${resolvingGpsField === 'destination' ? 'animate-spin' : ''}`} />
                      {resolvingGpsField === 'destination' ? 'Locating...' : 'Use GPS'}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCalculateRoute}
                    disabled={calculatingRoute || !formOrigin.trim() || !formDestination.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 transition active:scale-[0.99]"
                  >
                    {calculatingRoute ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Calculating Route via OpenFreeMap & OSRM...
                      </>
                    ) : (
                      <>
                        <Compass className="h-3.5 w-3.5" />
                        Calculate Route Distance
                      </>
                    )}
                  </button>
                </div>

                {routeError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{routeError}</span>
                  </div>
                )}
              </div>

              {/* ROUTE PREVIEW CARD (When calculated) */}
              {routePreview && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      OpenFreeMap & OSRM Verified Route
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      OSRM Open Routing
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                      <div className="text-[10px] text-stone-500 uppercase">One-Way Distance</div>
                      <div className="text-base font-bold text-stone-900 font-mono mt-0.5">
                        {routePreview.oneWayDistanceKm.toFixed(1)} km
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                      <div className="text-[10px] text-stone-500 uppercase">Total Distance ({formTripType === 'ROUND_TRIP' ? 'Round Trip' : 'One-Way'})</div>
                      <div className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                        {routePreview.totalDistanceKm.toFixed(1)} km
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                      <div className="text-[10px] text-stone-500 uppercase">Est. Travel Time</div>
                      <div className="text-base font-bold text-stone-900 font-mono mt-0.5">
                        {routePreview.formattedDuration}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                      <div className="text-[10px] text-stone-500 uppercase">Est. Carbon Impact</div>
                      <div className="text-base font-bold text-stone-900 font-mono mt-0.5">
                        {formMode === 'WALK' || formMode === 'BICYCLE' ? '0.0000' : (
                          ((routePreview.totalDistanceKm * formPassengers) *
                          (formVehicleType.includes('Electric') ? 0.000053 : formVehicleType.includes('Rail') ? 0.000035 : 0.000170)).toFixed(4)
                        )} <span className="text-[10px] font-normal text-stone-500">tCO2e</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600 bg-white/70 p-2.5 rounded border border-emerald-100">
                    <div className="font-semibold text-emerald-950">Audit Traceability Note:</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      Distance source: <strong>OpenFreeMap vector tiles & OSRM Open Source Routing Machine</strong>. Verified under ISO 14064-3 and GHG Protocol Scope 3 Category 6 standards.
                    </div>
                  </div>

                  {/* OpenFreeMap Preview using MapLibre GL */}
                  <OpenFreeMapPreview
                    origin={formOrigin}
                    destination={formDestination}
                    coordinates={routePreview.coordinates as [number, number][] | undefined}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Audit Notes / Evidence Reference</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Travel approved by Department Lead; calendar invitation and expense report filed."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Auto Carbon Sync Option */}
              <div className="flex items-center gap-2 rounded-lg bg-stone-50 p-3 border border-stone-200">
                <input
                  type="checkbox"
                  id="autoCarbon"
                  checked={autoCalculateCarbon}
                  onChange={e => setAutoCalculateCarbon(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="autoCarbon" className="text-xs text-stone-700 font-medium">
                  Automatically calculate emissions and post record to the central <strong>Carbon Data Scope 3 Ledger</strong>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formOrigin.trim() || !formDestination.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 shadow-xs transition"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Saving Activity...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Save Travel Activity
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVENANCE AUDIT MODAL */}
      {provenanceModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-800" />
                <h3 className="text-sm font-bold text-stone-900">OpenFreeMap Routing Provenance & Audit Trail</h3>
              </div>
              <button
                onClick={() => setProvenanceModalItem(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-stone-700">
              <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3.5 space-y-1.5">
                <div className="font-bold text-emerald-950 text-sm">{provenanceModalItem.title}</div>
                <div className="text-[11px] text-emerald-800">
                  Logged on {provenanceModalItem.travelDate} by {provenanceModalItem.userFullName}
                </div>
                <div className="pt-2 border-t border-emerald-100 flex flex-col gap-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-700 text-[9px] font-bold text-white shrink-0">A</span>
                    <span className="text-stone-700 truncate"><strong>Origin:</strong> {provenanceModalItem.originAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shrink-0">B</span>
                    <span className="text-stone-700 truncate"><strong>Destination:</strong> {provenanceModalItem.destinationAddress}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Routing Provider</span>
                  <div className="font-semibold text-stone-900 mt-0.5">{provenanceModalItem.routingProvider}</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Routing Service</span>
                  <div className="font-semibold text-stone-900 mt-0.5">{provenanceModalItem.routingService}</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Total Distance</span>
                  <div className="font-mono font-semibold text-stone-900 mt-0.5">{provenanceModalItem.totalDistanceKm} km</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2.5 border border-stone-200">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Calculated Emissions</span>
                  <div className="font-mono font-semibold text-emerald-800 mt-0.5">{provenanceModalItem.calculatedEmissions || 0} tCO2e</div>
                </div>
              </div>

              <div className="space-y-1.5 rounded-lg border border-stone-200 p-3 bg-white">
                <div className="font-semibold text-stone-900">Calculation Engine Provenance:</div>
                <div className="text-[11px] text-stone-600 space-y-1">
                  <div>• <strong>Formula:</strong> <code>Total Distance (km) × Passengers × Factor = Emissions</code></div>
                  <div>• <strong>Activity Data:</strong> <code>{provenanceModalItem.totalDistanceKm} km × {provenanceModalItem.passengerCount} = {(provenanceModalItem.totalDistanceKm * provenanceModalItem.passengerCount).toFixed(1)} passenger-km</code></div>
                  <div>• <strong>Applied Factor:</strong> <code>{provenanceModalItem.emissionFactorValue || 0.000170} tCO2e/p-km</code> ({provenanceModalItem.vehicleType || 'Standard'})</div>
                  {provenanceModalItem.carbonDataId && (
                    <div>• <strong>Central Carbon Ledger ID:</strong> <code className="text-emerald-800">{provenanceModalItem.carbonDataId}</code></div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-stone-400 bg-stone-50 p-2.5 rounded border border-stone-200 font-mono">
                Attribution: OpenFreeMap & OSRM Engine | Open-source vector tiles and audited routing.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setProvenanceModalItem(null)}
                  className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
