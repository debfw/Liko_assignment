"use client";

import {
  Autocomplete,
  MultiSelect,
  useMantineTheme,
  Text,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useFilterStore, useDiagramStore } from "../stores";
import { useMemo } from "react";

export function SearchAndFilter() {
  const theme = useMantineTheme();
  const {
    searchTerm,
    selectedShippingMethod,
    allCities,
    setSearchTerm,
    setSelectedShippingMethod,
  } = useFilterStore();

  const { diagram, setSelectedCity } = useDiagramStore();

  const autocompleteData = useMemo(() => {
    // Only show options if searchTerm is not empty
    if (!searchTerm || searchTerm.length === 0) return [];
    const filteredCities = allCities.filter(
      (city) =>
        city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredCities
      .slice(0, 15) // Show more results
      .map((city) => ({
        value: `${city.city}, ${city.country}`,
        label: `${city.city}, ${city.country} (${
          city.population?.toLocaleString() || "N/A"
        })`,
        city: city, // Store the full city object
      }));
  }, [allCities, searchTerm]);

  const handleCitySelect = (value: string) => {
    setSearchTerm(value);

    // Find the selected city
    const selectedCityData = autocompleteData.find(
      (item) => item.value === value
    );
    if (selectedCityData && diagram) {
      // Find the corresponding node in the diagram
      const node = diagram.findNodeForKey(selectedCityData.city.id);
      if (node) {
        // Select the city
        setSelectedCity(selectedCityData.city);

        // Center the diagram on the selected node
        diagram.centerRect(node.actualBounds);

        // Highlight the selected node
        diagram.nodes.each((n) => {
          const nNode = n as any;
          const shape = nNode.findObject("SHAPE");
          if (shape) {
            if (nNode.data.key === selectedCityData.city.id) {
              shape.strokeWidth = 4;
              shape.stroke = "#fff";
              shape.scale = 1.5;
            } else {
              shape.strokeWidth = 2;
              shape.stroke = "#666";
              shape.scale = 1;
            }
          }
        });
      }
    }
  };

  const shippingMethodOptions = [
    { value: "truck", label: "Truck (Same Country)" },
    { value: "airplane", label: "Air (Same Continent)" },
    { value: "airplane-express", label: "Express Air" },
    { value: "ship", label: "Ship (Cross Ocean)" },
    { value: "ship-express", label: "Express Ship" },
    { value: "custom", label: "Custom Routes" },
  ];

  return (
    <>
      <Autocomplete
        placeholder="Search cities..."
        data={autocompleteData}
        value={searchTerm}
        onChange={handleCitySelect}
        rightSection={<IconSearch size={16} />}
        mb={theme.spacing.xs}
        maxDropdownHeight={200}
        limit={15}
        styles={{
          input: {
            color: theme.other?.valueColor || "white",
            backgroundColor: theme.colors.dark[7],
            borderColor: theme.other?.borderColor || theme.colors.dark[4],
          },
        }}
      />
      <MultiSelect
        label={
          <Text c={theme.other?.keyColor || "dimmed"}>
            Filter by shipping methods
          </Text>
        }
        placeholder="Select shipping methods"
        data={shippingMethodOptions}
        value={selectedShippingMethod ? [selectedShippingMethod] : []}
        onChange={(values) => {
          if (values.length === 0) {
            setSelectedShippingMethod(null);
          } else {
            setSelectedShippingMethod(values[values.length - 1]); // Use the last selected value
          }
        }}
        clearable
        mb={theme.spacing.xs}
        description="Select one or more shipping methods to filter routes"
        styles={{
          input: {
            color: theme.other?.valueColor || "white",
            backgroundColor: theme.colors.dark[7],
            borderColor: theme.other?.borderColor || theme.colors.dark[4],
          },
        }}
      />
    </>
  );
}
