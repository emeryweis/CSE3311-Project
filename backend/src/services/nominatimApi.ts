import axios from 'axios';

/**
 * Nominatim API Service (OpenStreetMap Geocoding)
 * 100% FREE - No API key required!
 * 
 * This is a free geocoding service provided by OpenStreetMap.
 * It can be used to:
 * - Geocode addresses to coordinates
 * - Reverse geocode coordinates to addresses
 * - Search for places by name
 * - Get detailed location information
 * 
 * Documentation: https://nominatim.org/release-docs/develop/api/Overview/
 * Rate Limits: 1 request per second (free tier)
 */
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

interface NominatimPlace {
  place_id: number;
  licence: string;
  powered_by: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  extratags?: {
    website?: string;
    phone?: string;
    email?: string;
  };
}

interface NominatimSearchResponse extends Array<NominatimPlace> {}

/**
 * Search for camping locations by name using Nominatim
 * This is a free alternative to paid geocoding services
 */
export async function searchCampingByName(
  query: string,
  limit: number = 10
): Promise<NominatimPlace[]> {
  try {
    const response = await axios.get<NominatimSearchResponse>(
      `${NOMINATIM_BASE_URL}/search`,
      {
        params: {
          q: `${query} camping`,
          format: 'json',
          limit: limit,
          addressdetails: 1,
          extratags: 1,
          namedetails: 1,
        },
        headers: {
          'User-Agent': 'OutdoorSpot/1.0 (https://example.com)', // Required by Nominatim
        },
        timeout: 10000,
      }
    );

    // Filter for camping-related places
    const campingTypes = ['camp_site', 'campground', 'caravan_site', 'picnic_site'];
    return response.data.filter((place) => {
      return campingTypes.includes(place.type) || 
             place.display_name.toLowerCase().includes('camp');
    });
  } catch (error: any) {
    console.error('Error fetching Nominatim data:', error.message);
    return [];
  }
}

/**
 * Reverse geocode coordinates to get location details
 * Useful for getting address information for existing coordinates
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<NominatimPlace | null> {
  try {
    const response = await axios.get<NominatimPlace>(
      `${NOMINATIM_BASE_URL}/reverse`,
      {
        params: {
          lat: lat.toString(),
          lon: lon.toString(),
          format: 'json',
          addressdetails: 1,
          extratags: 1,
        },
        headers: {
          'User-Agent': 'OutdoorSpot/1.0 (https://example.com)',
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error reverse geocoding:', error.message);
    return null;
  }
}

/**
 * Search for places near coordinates
 * Useful for finding camping locations near a specific area
 */
export async function searchNearCoordinates(
  lat: number,
  lon: number,
  radius: number = 5000, // meters
  limit: number = 10
): Promise<NominatimPlace[]> {
  try {
    const response = await axios.get<NominatimSearchResponse>(
      `${NOMINATIM_BASE_URL}/search`,
      {
        params: {
          q: 'camping',
          format: 'json',
          limit: limit,
          addressdetails: 1,
          extratags: 1,
          // Note: Nominatim doesn't have a direct radius parameter
          // You would need to filter results by distance after fetching
        },
        headers: {
          'User-Agent': 'OutdoorSpot/1.0 (https://example.com)',
        },
        timeout: 10000,
      }
    );

    // Filter results by distance from target coordinates
    const results = response.data
      .map((place) => {
        const placeLat = parseFloat(place.lat);
        const placeLon = parseFloat(place.lon);
        const distance = Math.sqrt(
          Math.pow(placeLat - lat, 2) + Math.pow(placeLon - lon, 2)
        ) * 111000; // Convert degrees to meters (approximate)
        
        return { place, distance };
      })
      .filter((item) => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map((item) => item.place);

    return results;
  } catch (error: any) {
    console.error('Error searching near coordinates:', error.message);
    return [];
  }
}

/**
 * Convert Nominatim place to our Location format
 */
export function convertNominatimToLocation(
  place: NominatimPlace
): Partial<any> {
  return {
    name: place.display_name.split(',')[0], // Get the first part as the name
    description: `${place.type} ${place.class ? `(${place.class})` : ''}`,
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
    address: place.address?.road || '',
    city: place.address?.city || '',
    state: place.address?.state || '',
    country: place.address?.country || 'US',
    locationType: place.type === 'camp_site' ? 'campground' : 'park',
    websiteUrl: place.extratags?.website || undefined,
    contactInfo: place.extratags?.phone
      ? { phone: place.extratags.phone }
      : undefined,
    verified: false,
    isActive: true,
  };
}

