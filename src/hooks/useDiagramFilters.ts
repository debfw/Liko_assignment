import { useEffect } from "react";
import * as go from "gojs";
import { City, ShippingLink } from "../types";
import { useFilterStore } from "../stores";

export const useDiagramFilters = (diagram: go.Diagram | null) => {
  const { searchTerm, selectedShippingMethod } = useFilterStore();

  useEffect(() => {
    if (!diagram) return;

    const applyFilters = () => {
      diagram.startTransaction("filter");

      // Node visibility based on search
      diagram.nodes.each((node) => {
        const city = node.data as City;
        if (!city) return;
        let visible = true;
        if (searchTerm) {
          visible = city.city.toLowerCase().includes(searchTerm.toLowerCase());
        }
        node.visible = visible;
      });

      // Link visibility based on node visibility and shipping method
      diagram.links.each((link) => {
        const linkData = link.data as ShippingLink;
        if (!linkData) return;
        let visible = true;
        if (link.fromNode && !link.fromNode.visible) visible = false;
        if (link.toNode && !link.toNode.visible) visible = false;
        if (
          visible &&
          selectedShippingMethod &&
          selectedShippingMethod !== "All"
        ) {
          visible = linkData.category === selectedShippingMethod;
        }
        link.visible = visible;
      });

      diagram.commitTransaction("filter");
    };

    applyFilters();
  }, [diagram, searchTerm, selectedShippingMethod]);

  const clearAllFilters = () => {
    const { setSearchTerm, setSelectedShippingMethod } =
      useFilterStore.getState();
    setSearchTerm("");
    setSelectedShippingMethod(null);
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
    getVisibleLinkCount,
  };
};
