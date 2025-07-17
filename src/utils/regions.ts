export type Region =
  | "north-america"
  | "south-america"
  | "europe"
  | "africa"
  | "asia"
  | "oceania";

export interface RegionColors {
  [key: string]: string;
}

export const regionColors: RegionColors = {
  "north-america": "#60A5FA", // Brighter blue
  "south-america": "#34D399", // Brighter emerald
  europe: "#4ADE80", // Brighter green
  africa: "#FCD34D", // Brighter yellow
  asia: "#F87171", // Brighter red
  oceania: "#FB923C", // Brighter orange
};

export function detectRegion(
  lat: number,
  lng: number,
  country?: string
): Region {
  if (country) {
    const countryLower = country.toLowerCase();

    if (["united states", "canada", "mexico"].includes(countryLower)) {
      return "north-america";
    }
    if (
      ["brazil", "argentina", "chile", "peru", "colombia"].includes(
        countryLower
      )
    ) {
      return "south-america";
    }

    if (
      [
        "united kingdom",
        "germany",
        "france",
        "italy",
        "spain",
        "netherlands",
        "belgium",
        "sweden",
        "norway",
      ].includes(countryLower)
    ) {
      return "europe";
    }

    if (
      [
        "egypt",
        "south africa",
        "nigeria",
        "kenya",
        "morocco",
        "ethiopia",
      ].includes(countryLower)
    ) {
      return "africa";
    }

    if (
      [
        "china",
        "japan",
        "india",
        "south korea",
        "indonesia",
        "thailand",
        "vietnam",
        "singapore",
      ].includes(countryLower)
    ) {
      return "asia";
    }

    if (
      ["australia", "new zealand", "fiji", "papua new guinea"].includes(
        countryLower
      )
    ) {
      return "oceania";
    }
  }

  if (lng < -30) {
    if (lat > 15) return "north-america";
    return "south-america";
  } else if (lng < 50) {
    if (lat > 35) return "europe";
    return "africa";
  } else if (lng < 100) {
    if (lat > 20) return "asia";
    return "africa";
  } else {
    if (lat > 0) return "asia";
    return "oceania";
  }
}

export function getNodeSize(population?: number): number {
  if (!population) return 25;

  if (population > 20000000) return 45;
  if (population > 10000000) return 35;
  return 25;
}
