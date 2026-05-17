/**
 * India city centroids for fallback geocoding when a seller hasn't pinned
 * a precise location yet. Free lookup table — replace with Nominatim/OSM
 * call later (Phase 4 locality insights wiring).
 *
 * Keys are lowercased city names. Lat/lng are approximate city centres.
 */
export interface Centroid {
  lat: number;
  lng: number;
}

export const DEFAULT_CENTROID: Centroid = { lat: 22.5726, lng: 88.3639 }; // Kolkata

export const CITY_CENTROIDS: Record<string, Centroid> = {
  // Tier 1
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "mumbai": { lat: 19.076, lng: 72.8777 },
  "delhi": { lat: 28.7041, lng: 77.1025 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "hyderabad": { lat: 17.385, lng: 78.4867 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  // Tier 2
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "kanpur": { lat: 26.4499, lng: 80.3319 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "bhopal": { lat: 23.2599, lng: 77.4126 },
  "patna": { lat: 25.5941, lng: 85.1376 },
  "vadodara": { lat: 22.3072, lng: 73.1812 },
  "surat": { lat: 21.1702, lng: 72.8311 },
  "ludhiana": { lat: 30.901, lng: 75.8573 },
  "agra": { lat: 27.1767, lng: 78.0081 },
  "nashik": { lat: 19.9975, lng: 73.7898 },
  "varanasi": { lat: 25.3176, lng: 82.9739 },
  "amritsar": { lat: 31.634, lng: 74.8723 },
  "ranchi": { lat: 23.3441, lng: 85.3096 },
  "raipur": { lat: 21.2514, lng: 81.6296 },
  "guwahati": { lat: 26.1445, lng: 91.7362 },
  "bhubaneswar": { lat: 20.2961, lng: 85.8245 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
  "chandigarh": { lat: 30.7333, lng: 76.7794 },
  "noida": { lat: 28.5355, lng: 77.391 },
  "gurgaon": { lat: 28.4595, lng: 77.0266 },
  "gurugram": { lat: 28.4595, lng: 77.0266 },
  "faridabad": { lat: 28.4089, lng: 77.3178 },
  "ghaziabad": { lat: 28.6692, lng: 77.4538 },
  "hooghly": { lat: 22.8965, lng: 88.397 },
  "howrah": { lat: 22.5958, lng: 88.2636 },
};
