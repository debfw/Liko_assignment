"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import * as go from "gojs";
import { convertLatLngToDiagramCoords } from "@/utils/coordinates";
import { detectRegion, regionColors, getNodeSize } from "@/utils/regions";
import { createShippingLinks } from "@/utils/shipping";
import type { GoJSCityNodeData } from "@/types/gojs-types";

const WorldMapDiagram = dynamic(() => import("@/components/WorldMapDiagram"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      Loading visualization...
    </div>
  ),
});

export default function Home() {
  const [nodeDataArray, setNodeDataArray] = useState<GoJSCityNodeData[]>([]);
  const [linkDataArray, setLinkDataArray] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCityData = async () => {
    try {
      const response = await fetch("/worldcities.json");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      if (!text.trim()) {
        throw new Error("Empty response received");
      }

      const cities: GoJSCityNodeData[] = JSON.parse(text);

      const nodes = cities.map((city) => {
        const coords = convertLatLngToDiagramCoords(city.lat, city.lng);
        const region = detectRegion(city.lat, city.lng, city.country);

        return {
          ...city,
          key: city.id,
          region: region,
          color: regionColors[region],
          size: getNodeSize(city.population),
          location: new go.Point(coords.x, coords.y),
        };
      });

      const links = createShippingLinks(cities);

      setNodeDataArray(nodes);
      setLinkDataArray(links);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading city data:", error);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadCityData();
  }, []);

  if (isLoading || nodeDataArray.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        Loading visualization...
      </div>
    );
  }

  return (
    <WorldMapDiagram
      nodeDataArray={nodeDataArray}
      linkDataArray={linkDataArray}
      loadCityData={loadCityData}
    />
  );
}
