// Convert latitude and longitude to diagram coordinates
// and calculate distance between two points on Earth

export interface Coordinates {
  x: number;
  y: number;
}

export function convertLatLngToDiagramCoords(
  lat: number,
  lng: number,
  mapWidth: number = 1600,
  mapHeight: number = 800
): Coordinates {
  const x = ((lng + 180) / 360) * mapWidth;
  const y = ((90 - lat) / 180) * mapHeight;

  return { x, y };
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
