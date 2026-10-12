import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Global MapLibre GL Worker Configuration
 * 
 * Fixes Vite worker resolution issue:
 * "Error: Worker failed to load. Check that the worker URL is correct."
 * 
 * Explicitly configures MapLibre's worker URL to our served /maplibre-gl-worker.mjs endpoint,
 * preventing MapLibre from attempting to load relative to Vite's pre-bundled node_modules path.
 */
let isWorkerConfigured = false;

export function initMapLibreWorker(): void {
  if (isWorkerConfigured) return;
  try {
    if (typeof window !== 'undefined') {
      const workerUrl = `${window.location.origin}/maplibre-gl-worker.mjs`;
      if (typeof (maplibregl as any).setWorkerUrl === 'function') {
        (maplibregl as any).setWorkerUrl(workerUrl);
      }
      if (typeof (maplibregl as any).default?.setWorkerUrl === 'function') {
        (maplibregl as any).default.setWorkerUrl(workerUrl);
      }
      isWorkerConfigured = true;
    }
  } catch (err) {
    console.warn('MapLibre worker setup note:', err);
  }
}

// Auto-initialize upon import
initMapLibreWorker();

export { maplibregl };
export default maplibregl;
