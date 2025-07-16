import { detectRegion } from "./regions";
import type { City } from "../types/gojs-types";

export type ShippingMethod =
  | "truck"
  | "airplane"
  | "airplane-express"
  | "ship"
  | "ship-express";

export interface ShippingRoute {
  method: ShippingMethod;
  label: string;
  style: {
    strokeDashArray: number[] | null;
    stroke: string;
    strokeWidth: number;
    opacity?: number;
  };
}

export function determineShippingMethod(
  fromCity: City,
  toCity: City
): ShippingMethod {
  if (fromCity.country === toCity.country) {
    return "truck";
  }

  const fromRegion = detectRegion(fromCity.lat, fromCity.lng, fromCity.country);
  const toRegion = detectRegion(toCity.lat, toCity.lng, toCity.country);

  if (fromRegion === toRegion) {
    // 30% chance for express air shipping across continent
    const isExpressAir = Math.random() < 0.3;
    return isExpressAir ? "airplane-express" : "airplane";
  }

  // 30% chance for express shipping on cross-ocean routes
  const isExpress = Math.random() < 0.3;
  return isExpress ? "ship-express" : "ship";
}

export function getShippingRoute(fromCity: City, toCity: City): ShippingRoute {
  const method = determineShippingMethod(fromCity, toCity);

  const styles = {
    truck: {
      strokeDashArray: null,
      stroke: "pink",
      strokeWidth: 4,
      opacity: 1.5,
    },
    airplane: {
      strokeDashArray: [6, 3],
      stroke: "brown",
      strokeWidth: 2,
      opacity: 1,
    },
    "airplane-express": {
      strokeDashArray: [10, 4],
      stroke: "yellow",
      strokeWidth: 3,
      opacity: 1,
    },
    ship: {
      strokeDashArray: [2, 4],
      stroke: "blue",
      strokeWidth: 1,
      opacity: 0.2,
    },
    "ship-express": {
      strokeDashArray: [8, 2],
      stroke: "gray",
      strokeWidth: 1,
      opacity: 0.3,
    },
  };

  const methodLabels = {
    truck: "Truck",
    airplane: "Air",
    "airplane-express": "Express Air",
    ship: "Ship",
    "ship-express": "Express Ship",
  };

  return {
    method,
    label: `${fromCity.city} → ${toCity.city} by ${methodLabels[method]}`,
    style: styles[method],
  };
}

export interface ShippingLink {
  from: number;
  to: number;
  category: ShippingMethod;
  text: string;
  strokeDashArray: number[] | null;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
}

export function createShippingLinks(cities: City[]): ShippingLink[] {
  const links: ShippingLink[] = [];
  const halfLength = Math.floor(cities.length / 2);

  for (let i = 0; i < halfLength; i++) {
    const fromCity = cities[i];
    const toCity = cities[cities.length - 1 - i];

    if (fromCity && toCity && fromCity.id !== toCity.id) {
      const route = getShippingRoute(fromCity, toCity);

      links.push({
        from: fromCity.id,
        to: toCity.id,
        category: route.method,
        text: route.label,
        ...route.style,
      });
    }
  }

  return links;
}
