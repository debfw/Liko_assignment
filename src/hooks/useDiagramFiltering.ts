import { useEffect } from "react";
import * as go from "gojs";

export function useDiagramFiltering(
  diagram: go.Diagram | null,
  searchTerm: string,
  selectedShippingMethod: string | null,
  showLinks: boolean
) {
  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("filter");
    diagram.nodes.each((node) => {
      const city = node.data;
      if (!city) return;

      let visible = true;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const cityLower = city.city.toLowerCase();
        const countryLower = city.country.toLowerCase();

        const dropdownPattern = /^(.+?),\s*(.+?)\s*\(\d{1,3}(,\d{3})*\)$/;
        const dropdownMatch = searchTerm.match(dropdownPattern);

        if (dropdownMatch) {
          const [, searchCity, searchCountry] = dropdownMatch;
          visible =
            city.city.toLowerCase() === searchCity.toLowerCase().trim() &&
            city.country.toLowerCase() === searchCountry.toLowerCase().trim();
        } else if (searchTerm.includes(", ")) {
          const parts = searchTerm.split(", ");
          if (parts.length === 2) {
            const [searchCity, searchCountry] = parts;
            visible =
              cityLower === searchCity.toLowerCase().trim() &&
              countryLower === searchCountry.toLowerCase().trim();
          } else {
            visible =
              cityLower.includes(searchLower) ||
              countryLower.includes(searchLower);
          }
        } else {
          visible =
            cityLower.includes(searchLower) ||
            countryLower.includes(searchLower);
        }
      }

      node.visible = visible;
    });

    diagram.links.each((link) => {
      const nodesVisible =
        (link.fromNode?.visible ?? false) && (link.toNode?.visible ?? false);
      if (!nodesVisible) {
        link.visible = false;
      }
    });

    diagram.commitTransaction("filter");
  }, [diagram, searchTerm]);

  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("filter shipping");

    diagram.nodes.each((node) => {
      const city = node.data;
      if (!city) return;

      let matchesSearch = true;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const cityLower = city.city.toLowerCase();
        const countryLower = city.country.toLowerCase();

        const dropdownPattern = /^(.+?),\s*(.+?)\s*\(\d{1,3}(,\d{3})*\)$/;
        const dropdownMatch = searchTerm.match(dropdownPattern);

        if (dropdownMatch) {
          const [, searchCity, searchCountry] = dropdownMatch;
          matchesSearch =
            city.city.toLowerCase() === searchCity.toLowerCase().trim() &&
            city.country.toLowerCase() === searchCountry.toLowerCase().trim();
        } else if (searchTerm.includes(", ")) {
          const parts = searchTerm.split(", ");
          if (parts.length === 2) {
            const [searchCity, searchCountry] = parts;
            matchesSearch =
              cityLower === searchCity.toLowerCase().trim() &&
              countryLower === searchCountry.toLowerCase().trim();
          } else {
            matchesSearch =
              cityLower.includes(searchLower) ||
              countryLower.includes(searchLower);
          }
        } else {
          matchesSearch =
            cityLower.includes(searchLower) ||
            countryLower.includes(searchLower);
        }
      }

      node.visible = matchesSearch;
    });

    diagram.links.each((link) => {
      const linkData = link.data;
      if (!linkData) return;

      const nodesMatchSearch =
        (link.fromNode?.visible ?? false) && (link.toNode?.visible ?? false);

      if (!nodesMatchSearch) {
        link.visible = false;
        return;
      }

      if (selectedShippingMethod && selectedShippingMethod !== "All") {
        link.visible =
          linkData.category === selectedShippingMethod && showLinks;
      } else {
        link.visible = showLinks;
      }
    });

    if (selectedShippingMethod && selectedShippingMethod !== "All") {
      diagram.nodes.each((node) => {
        if (!node.visible) return;

        let hasVisibleLink = false;
        diagram.links.each((link) => {
          if (
            link.visible &&
            (link.fromNode === node || link.toNode === node)
          ) {
            hasVisibleLink = true;
          }
        });

        if (!hasVisibleLink) {
          node.visible = false;
        }
      });
    }

    diagram.commitTransaction("filter shipping");
  }, [diagram, selectedShippingMethod, showLinks, searchTerm]);
}
