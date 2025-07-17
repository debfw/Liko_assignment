import { useState, useCallback } from "react";
import * as go from "gojs";
import { City, ShippingLink } from "../types";

export const useShippingRoutes = (diagram: go.Diagram | null) => {
  const [shippingLinks, setShippingLinks] = useState<ShippingLink[]>([]);

  const createShippingLink = useCallback((fromCity: City, toCity: City): ShippingLink => {
    const methods = ["Sea", "Air", "Land", "Rail"];
    const method = methods[Math.floor(Math.random() * methods.length)];
    
    return {
      from: fromCity.key,
      to: toCity.key,
      method: method,
      capacity: Math.floor(Math.random() * 1000) + 100,
      utilization: Math.floor(Math.random() * 100),
      cost: Math.floor(Math.random() * 10000) + 1000,
      time: Math.floor(Math.random() * 30) + 1,
      reliability: Math.floor(Math.random() * 20) + 80,
      carbonFootprint: Math.floor(Math.random() * 500) + 50
    };
  }, []);

  const addShippingRoute = useCallback((fromCity: City, toCity: City) => {
    if (!diagram) return;

    // Check if link already exists
    const existingLink = diagram.findLinkForData({
      from: fromCity.key,
      to: toCity.key
    });

    if (existingLink) {
      alert("A shipping route already exists between these cities!");
      return;
    }

    // Create new shipping link
    const newLink = createShippingLink(fromCity, toCity);

    // Add to diagram
    diagram.startTransaction("add shipping route");
    diagram.model.addLinkData(newLink);
    diagram.commitTransaction("add shipping route");

    // Update local state
    setShippingLinks(prev => [...prev, newLink]);
  }, [diagram, createShippingLink]);

  const removeShippingRoute = useCallback((link: ShippingLink) => {
    if (!diagram) return;

    diagram.startTransaction("remove shipping route");
    diagram.model.removeLinkData(link);
    diagram.commitTransaction("remove shipping route");

    // Update local state
    setShippingLinks(prev => prev.filter(l => l !== link));
  }, [diagram]);

  const updateShippingRoute = useCallback((link: ShippingLink, updates: Partial<ShippingLink>) => {
    if (!diagram) return;

    diagram.startTransaction("update shipping route");
    
    Object.entries(updates).forEach(([key, value]) => {
      diagram.model.setDataProperty(link, key, value);
    });
    
    diagram.commitTransaction("update shipping route");

    // Update local state
    setShippingLinks(prev => 
      prev.map(l => l === link ? { ...l, ...updates } : l)
    );
  }, [diagram]);

  const getRoutesBetweenCities = useCallback((cityKey1: string, cityKey2: string): ShippingLink[] => {
    return shippingLinks.filter(link => 
      (link.from === cityKey1 && link.to === cityKey2) ||
      (link.from === cityKey2 && link.to === cityKey1)
    );
  }, [shippingLinks]);

  const getRoutesFromCity = useCallback((cityKey: string): ShippingLink[] => {
    return shippingLinks.filter(link => 
      link.from === cityKey || link.to === cityKey
    );
  }, [shippingLinks]);

  const calculateOptimalRoute = useCallback((fromCity: string, toCity: string, criteria: "cost" | "time" | "carbon" = "cost"): ShippingLink | null => {
    const directRoute = shippingLinks.find(link => 
      link.from === fromCity && link.to === toCity
    );

    if (directRoute) return directRoute;

    // For now, just return null for indirect routes
    // In a real implementation, this would use a pathfinding algorithm
    return null;
  }, [shippingLinks]);

  return {
    shippingLinks,
    addShippingRoute,
    removeShippingRoute,
    updateShippingRoute,
    getRoutesBetweenCities,
    getRoutesFromCity,
    calculateOptimalRoute
  };
};