import { useState, useCallback } from "react";
import * as go from "gojs";
import { City, ShippingLink } from "../types";

export const useShippingRoutes = (diagram: go.Diagram | null) => {
  const [shippingLinks, setShippingLinks] = useState<ShippingLink[]>([]);

  const createShippingLink = (fromCity: City, toCity: City): ShippingLink => {
    const methods: Array<ShippingLink["category"]> = [
      "truck",
      "airplane",
      "ship",
    ];
    const category = methods[Math.floor(Math.random() * methods.length)];

    return {
      from: fromCity.id,
      to: toCity.id,
      category: category,
      text: `${fromCity.city} to ${toCity.city}`,
      strokeDashArray: category === "airplane" ? [4, 2] : null,
      stroke:
        category === "airplane"
          ? "#ff6600"
          : category === "ship"
          ? "#0066ff"
          : "#666666",
      strokeWidth: 2,
      opacity: 1,
    };
  };

  const addShippingRoute = useCallback(
    (fromCity: City, toCity: City) => {
      if (!diagram) return;

      const existingLink = diagram.findLinkForData({
        from: fromCity.id,
        to: toCity.id,
      });

      if (existingLink) {
        alert("A shipping route already exists between these cities!");
        return;
      }

      const newLink = createShippingLink(fromCity, toCity);

      diagram.startTransaction("add shipping route");
      (diagram.model as go.GraphLinksModel).addLinkData(newLink);
      diagram.commitTransaction("add shipping route");

      setShippingLinks((prev) => [...prev, newLink]);
    },
    [diagram, createShippingLink]
  );

  const removeShippingRoute = useCallback(
    (link: ShippingLink) => {
      if (!diagram) return;

      diagram.startTransaction("remove shipping route");
      (diagram.model as go.GraphLinksModel).removeLinkData(link);
      diagram.commitTransaction("remove shipping route");

      setShippingLinks((prev) => prev.filter((l) => l !== link));
    },
    [diagram]
  );

  const updateShippingRoute = useCallback(
    (link: ShippingLink, updates: Partial<ShippingLink>) => {
      if (!diagram) return;

      diagram.startTransaction("update shipping route");

      Object.entries(updates).forEach(([key, value]) => {
        (diagram.model as go.GraphLinksModel).setDataProperty(link, key, value);
      });

      diagram.commitTransaction("update shipping route");

      setShippingLinks((prev) =>
        prev.map((l) => (l === link ? { ...l, ...updates } : l))
      );
    },
    [diagram]
  );

  const getRoutesBetweenCities = useCallback(
    (cityKey1: number, cityKey2: number): ShippingLink[] => {
      return shippingLinks.filter(
        (link) =>
          (link.from === cityKey1 && link.to === cityKey2) ||
          (link.from === cityKey2 && link.to === cityKey1)
      );
    },
    [shippingLinks]
  );

  const getRoutesFromCity = useCallback(
    (cityKey: number): ShippingLink[] => {
      return shippingLinks.filter(
        (link) => link.from === cityKey || link.to === cityKey
      );
    },
    [shippingLinks]
  );

  const calculateOptimalRoute = useCallback(
    (fromCity: number, toCity: number): ShippingLink | null => {
      const directRoute = shippingLinks.find(
        (link) => link.from === fromCity && link.to === toCity
      );

      if (directRoute) return directRoute;

      // For now, just return null for indirect routes
      // In a real implementation, this would use a pathfinding algorithm
      return null;
    },
    [shippingLinks]
  );

  return {
    shippingLinks,
    addShippingRoute,
    removeShippingRoute,
    updateShippingRoute,
    getRoutesBetweenCities,
    getRoutesFromCity,
    calculateOptimalRoute,
  };
};
