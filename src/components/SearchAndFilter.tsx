"use client";

import { Autocomplete, Select, useMantineTheme, Text } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useFilterStore, useDiagramStore } from "../stores";
import { useMemo } from "react";
import type { City } from "../types/gojs-types";

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
    if (!searchTerm || searchTerm.length === 0) return [];

    const visibleCities: City[] = [];
    if (diagram) {
      diagram.nodes.each((node) => {
        const goNode = node as any;
        if (goNode.visible) {
          visibleCities.push(goNode.data);
        }
      });
    }

    const filteredCities = visibleCities.filter(
      (city) =>
        city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredCities.slice(0, 15).map((city) => ({
      value: `${city.city}, ${city.country}`,
      label: `${city.city}, ${city.country} (${
        city.population?.toLocaleString() || "N/A"
      })`,
      city: city,
    }));
  }, [allCities, searchTerm, diagram]);

  const handleCitySelect = (value: string) => {
    const selectedCityData = autocompleteData.find(
      (item) => item.value === value
    );

    if (selectedCityData && diagram) {
      const node = diagram.findNodeForKey(selectedCityData.city.id);
      if (node) {
        setSelectedCity(selectedCityData.city);

        diagram.centerRect(node.actualBounds);

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

        node.visible = true;

        setSearchTerm(selectedCityData.value);
      } else {
        let foundNode: any = null;
        diagram.nodes.each((n) => {
          const nNode = n as any;
          if (
            nNode.data.city === selectedCityData.city.city &&
            nNode.data.country === selectedCityData.city.country
          ) {
            foundNode = nNode;
          }
        });

        if (foundNode) {
          setSelectedCity(selectedCityData.city);

          diagram.centerRect(foundNode.actualBounds);

          diagram.nodes.each((n) => {
            const nNode = n as any;
            const shape = nNode.findObject("SHAPE");
            if (shape) {
              if (nNode === foundNode) {
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

          foundNode.visible = true;

          setSearchTerm(selectedCityData.value);
        } else {
          console.log("Node not found for city:", selectedCityData.city);
          console.log("Looking for key:", selectedCityData.city.id);
          console.log("Available nodes:", diagram.nodes.count);
        }
      }
    }
  };

  const shippingMethodOptions = [
    { value: "truck", label: "Truck (Same Country)" },
    { value: "airplane", label: "Air (Same Continent)" },
    { value: "airplane-express", label: "Express Air" },
    { value: "ship", label: "Ship (Cross Ocean)" },
    { value: "ship-express", label: "Express Ship" },
  ];

  return (
    <>
      <Autocomplete
        placeholder="Search cities..."
        data={autocompleteData}
        value={searchTerm}
        onChange={setSearchTerm}
        onOptionSubmit={handleCitySelect}
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
      <Select
        label={
          <Text c={theme.other?.keyColor || "dimmed"}>
            Filter by shipping methods
          </Text>
        }
        placeholder="Select shipping method"
        data={shippingMethodOptions}
        value={selectedShippingMethod}
        onChange={setSelectedShippingMethod}
        clearable
        mb={theme.spacing.xs}
        description="Select a shipping method to filter routes"
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
