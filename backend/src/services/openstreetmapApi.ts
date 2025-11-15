import axios from 'axios';

/**
 * OpenStreetMap Overpass API Service
 * Free API for querying camping locations around DFW
 * No API key required!
 * Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
 */
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

interface OSMNode {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'tourism'?: string;
    'leisure'?: string;
    'amenity'?: string;
    'operator'?: string;
    'phone'?: string;
    'website'?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:postcode'?: string;
    'addr:street'?: string;
    description?: string;
    [key: string]: string | undefined;
  };
}

interface OSMResponse {
  elements: OSMNode[];
}

/**
 * Search for camping locations around DFW area
 * DFW coordinates: ~32.7767° N, 96.7970° W
 */
export async function searchCampingNearDFW(
  radiusKm: number = 80, // ~50 miles around DFW
  limit: number = 100
): Promise<OSMNode[]> {
  try {
    // DFW area coordinates
    const dfwLat = 32.7767;
    const dfwLng = -96.7970;

    // Overpass QL query to find camping facilities
    // This searches for:
    // - campgrounds (tourism=camp_site)
    // - campsites (leisure=camp_site)
    // - camping areas (amenity=camping)
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="camp_site"](around:${radiusKm * 1000},${dfwLat},${dfwLng});
        way["tourism"="camp_site"](around:${radiusKm * 1000},${dfwLat},${dfwLng});
        node["leisure"="camp_site"](around:${radiusKm * 1000},${dfwLat},${dfwLng});
        way["leisure"="camp_site"](around:${radiusKm * 1000},${dfwLat},${dfwLng});
      );
      out center meta;
    `.trim();

    const response = await axios.post<OSMResponse>(
      OVERPASS_API_URL,
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    // Filter and process results
    let results = response.data.elements || [];

    // Process results and extract coordinates
    results = results.map((element) => {
      // For ways, use center coordinates if available
      if (element.type === 'way' && !element.lat && !element.lon) {
        // Ways might have center coordinates in the response
        // If not, we'll skip them for now (can enhance later)
        return null;
      }
      return element;
    }).filter((element): element is OSMNode => {
      // Filter for elements with coordinates and valid names
      return element !== null && 
             Boolean(element.tags?.name) && 
             Boolean(element.lat || element.center?.lat) && 
             Boolean(element.lon || element.center?.lon);
    });

    // Extract coordinates from center if needed
    results = results.map((element) => {
      if (!element.lat && element.center?.lat) {
        element.lat = element.center.lat;
        element.lon = element.center.lon;
      }
      return element;
    });

    // Limit results
    return results.slice(0, limit);
  } catch (error: any) {
    console.error('Error fetching OpenStreetMap data:', error.message);
    // Return empty array if API fails (graceful degradation)
    return [];
  }
}

/**
 * Convert OSM node to our Location format
 */
export function convertOSMToLocation(osmNode: OSMNode): Partial<any> {
  const tags = osmNode.tags || {};
  
  // Extract address components
  const city = tags['addr:city'] || tags['addr:suburb'] || '';
  const state = tags['addr:state'] || 'TX';
  const address = tags['addr:street'] || '';
  const zip = tags['addr:postcode'] || '';

  // Build full address
  const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');

  // Determine location type
  const tourismType = tags.tourism || tags.leisure || tags.amenity || '';
  let locationType = 'campground';
  if (tourismType.includes('camp')) {
    locationType = 'campground';
  } else if (tourismType.includes('park')) {
    locationType = 'park';
  }

  // Get coordinates (use center if lat/lon not available)
  const lat = osmNode.lat || osmNode.center?.lat || 0;
  const lon = osmNode.lon || osmNode.center?.lon || 0;

  return {
    name: tags.name || 'Unnamed Campground',
    description: tags.description || tags['description:en'] || `Camping location in ${city || state}`,
    latitude: lat,
    longitude: lon,
    address: fullAddress || undefined,
    city: city || undefined,
    state: state || 'TX',
    country: 'US',
    locationType: locationType,
    websiteUrl: tags.website || undefined,
    contactInfo: tags.phone ? { phone: tags.phone } : undefined,
    verified: false, // OSM data, not manually verified
    isActive: true,
  };
}

/**
 * Search for camping locations near specific coordinates
 * Useful for finding website info for a specific location
 */
export async function searchCampingNearCoordinates(
  lat: number,
  lng: number,
  radiusKm: number = 2, // Small radius for specific location
  limit: number = 5
): Promise<OSMNode[]> {
  try {
    const query = `
      [out:json][timeout:15];
      (
        node["tourism"="camp_site"](around:${radiusKm * 1000},${lat},${lng});
        way["tourism"="camp_site"](around:${radiusKm * 1000},${lat},${lng});
        node["leisure"="camp_site"](around:${radiusKm * 1000},${lat},${lng});
        way["leisure"="camp_site"](around:${radiusKm * 1000},${lat},${lng});
      );
      out center meta;
    `.trim();

    const response = await axios.post<OSMResponse>(
      OVERPASS_API_URL,
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 20000,
      }
    );

    // Filter and process results
    let results = response.data.elements || [];

    // Process results and extract coordinates
    results = results.map((element) => {
      if (element.type === 'way' && !element.lat && !element.lon) {
        return null;
      }
      return element;
    }).filter((element): element is OSMNode => {
      return element !== null && 
             Boolean(element.tags?.name) && 
             Boolean(element.lat || element.center?.lat) && 
             Boolean(element.lon || element.center?.lon);
    });

    // Extract coordinates from center if needed
    results = results.map((element) => {
      if (!element.lat && element.center?.lat) {
        element.lat = element.center.lat;
        element.lon = element.center.lon;
      }
      return element;
    });

    // Sort by distance from target coordinates
    results = results
      .map((element) => {
        const elLat = element.lat || element.center?.lat || 0;
        const elLon = element.lon || element.center?.lon || 0;
        const distance = Math.sqrt(
          Math.pow(elLat - lat, 2) + Math.pow(elLon - lng, 2)
        );
        return { element, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .map((item) => item.element);

    // Limit results
    return results.slice(0, limit);
  } catch (error: any) {
    console.error('Error fetching OSM data near coordinates:', error.message);
    return [];
  }
}

/**
 * Get detailed information for a specific OSM location
 */
export async function getOSMLocationDetails(osmId: number, osmType: string): Promise<OSMNode | null> {
  try {
    const query = `
      [out:json][timeout:10];
      ${osmType}(${osmId});
      out body;
      >;
      out skel qt;
    `.trim();

    const response = await axios.post<OSMResponse>(
      OVERPASS_API_URL,
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      }
    );

    return response.data.elements?.[0] || null;
  } catch (error: any) {
    console.error('Error fetching OSM location details:', error.message);
    return null;
  }
}

