import { useEffect } from "react";
import * as go from "gojs";
import { City, ShippingLink } from "../types";
import { useFilterStore } from "../stores";

export const useDiagramFilters = (diagram: go.Diagram | null) => {
  const { searchTerm, selectedRegion, selectedShippingMethod } = useFilterStore();

  useEffect(() => {
    if (!diagram) return;

    const applyFilters = () => {
      diagram.startTransaction("filter");

      // Filter nodes based on search and region
      diagram.nodes.each((node) => {
        const city = node.data as City;
        if (!city) return;

        let visible = true;

        // Apply search filter
        if (searchTerm) {
          visible = city.name.toLowerCase().includes(searchTerm.toLowerCase());
        }

        // Apply region filter
        if (visible && selectedRegion && selectedRegion !== "All") {
          visible = city.country === selectedRegion;
        }

        node.visible = visible;
      });

      // Filter links based on shipping method and node visibility
      diagram.links.each((link) => {
        const linkData = link.data as ShippingLink;
        if (!linkData) return;

        let visible = true;

        // Hide links connected to hidden nodes
        if (link.fromNode && !link.fromNode.visible) {
          visible = false;
        }
        if (link.toNode && !link.toNode.visible) {
          visible = false;
        }

        // Apply shipping method filter
        if (visible && selectedShippingMethod && selectedShippingMethod !== "All") {
          visible = linkData.method === selectedShippingMethod;
        }

        link.visible = visible;
      });

      diagram.commitTransaction("filter");
    };

    // Apply filters whenever they change
    applyFilters();
  }, [diagram, searchTerm, selectedRegion, selectedShippingMethod]);

  const clearAllFilters = () => {
    const { setSearchTerm, setSelectedRegion, setSelectedShippingMethod } = useFilterStore.getState();
    setSearchTerm("");
    setSelectedRegion("All");
    setSelectedShippingMethod("All");
  };

  const getVisibleNodeCount = (): number => {
    if (!diagram) return 0;
    
    let count = 0;
    diagram.nodes.each((node) => {
      if (node.visible) count++;
    });
    return count;
  };

  const getVisibleLinkCount = (): number => {
    if (!diagram) return 0;
    
    let count = 0;
    diagram.links.each((link) => {
      if (link.visible) count++;
    });
    return count;
  };

  return {
    clearAllFilters,
    getVisibleNodeCount,
    getVisibleLinkCount
  };
};