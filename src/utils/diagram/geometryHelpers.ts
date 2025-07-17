import { City } from "../../types";

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export const DEFAULT_MAP_BOUNDS: MapBounds = {
  minLat: -90,
  maxLat: 90,
  minLon: -180,
  maxLon: 180
};

export const latLonToXY = (
  lat: number, 
  lon: number, 
  width: number, 
  height: number,
  bounds: MapBounds = DEFAULT_MAP_BOUNDS
): { x: number; y: number } => {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  
  return { x, y };
};

export const xyToLatLon = (
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: MapBounds = DEFAULT_MAP_BOUNDS
): { lat: number; lon: number } => {
  const lon = (x / width) * (bounds.maxLon - bounds.minLon) + bounds.minLon;
  const lat = bounds.maxLat - (y / height) * (bounds.maxLat - bounds.minLat);
  
  return { lat, lon };
};

export const calculateDistance = (city1: City, city2: City): number => {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1Rad = city1.lat * Math.PI / 180;
  const lat2Rad = city2.lat * Math.PI / 180;
  const deltaLat = (city2.lat - city1.lat) * Math.PI / 180;
  const deltaLon = (city2.lon - city1.lon) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

export const findNearestCity = (
  targetLat: number,
  targetLon: number,
  cities: City[]
): City | null => {
  if (cities.length === 0) return null;
  
  let nearestCity = cities[0];
  let minDistance = Number.MAX_VALUE;
  
  const target = { lat: targetLat, lon: targetLon, key: "", name: "", country: "", population: 0 };
  
  cities.forEach(city => {
    const distance = calculateDistance(target, city);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  });
  
  return nearestCity;
};

export const getCitiesInBounds = (
  cities: City[],
  bounds: MapBounds
): City[] => {
  return cities.filter(city => 
    city.lat >= bounds.minLat &&
    city.lat <= bounds.maxLat &&
    city.lon >= bounds.minLon &&
    city.lon <= bounds.maxLon
  );
};

export const calculateBoundsForCities = (cities: City[]): MapBounds => {
  if (cities.length === 0) return DEFAULT_MAP_BOUNDS;
  
  let minLat = cities[0].lat;
  let maxLat = cities[0].lat;
  let minLon = cities[0].lon;
  let maxLon = cities[0].lon;
  
  cities.forEach(city => {
    minLat = Math.min(minLat, city.lat);
    maxLat = Math.max(maxLat, city.lat);
    minLon = Math.min(minLon, city.lon);
    maxLon = Math.max(maxLon, city.lon);
  });
  
  // Add some padding
  const latPadding = (maxLat - minLat) * 0.1;
  const lonPadding = (maxLon - minLon) * 0.1;
  
  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLon: minLon - lonPadding,
    maxLon: maxLon + lonPadding
  };
};