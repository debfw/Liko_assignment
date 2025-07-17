// Define types for GoJS nodes and links
import type { Point } from "gojs";

export interface City {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  country: string;
  iso2: string;
  iso3: string;
  admin_name: string;
  population: number;
  id: number;
  region?: string;
}

export interface GoJSCityNodeData extends City {
  key: number;
  color: string;
  size: number;
  location: Point | { x: number; y: number } | null;
}
