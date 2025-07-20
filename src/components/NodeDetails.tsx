"use client";

import { Title, Text, Slider, useMantineTheme } from "@mantine/core";
import { KeyValuePair } from "./KeyValuePair";
import type { GoJSCityNodeData } from "../types/gojs-types";
import { memo, useCallback } from "react";

interface NodeDetailsProps {
  selectedCity: GoJSCityNodeData | null;
  nodeSize: number;
  onNodeSizeChange: (size: number) => void;
}

export const NodeDetails = memo(function NodeDetails({
  selectedCity,
  nodeSize,
  onNodeSizeChange,
}: NodeDetailsProps) {
  const theme = useMantineTheme();
  const valueColor = theme.other?.valueColor || "white";

  const sliderConfig = {
    min: 50,
    max: 250,
    step: 10,
    marks: [
      { value: 50, label: "50%" },
      { value: 100, label: "100%" },
      { value: 150, label: "150%" },
      { value: 200, label: "200%" },
      { value: 250, label: "250%" },
    ],
    styles: {
      markLabel: { fontSize: 10, marginTop: 5, color: valueColor },
      root: { marginTop: 8, marginBottom: 24 },
    },
  };

  const handleSliderChange = useCallback(
    (value: number) => {
      onNodeSizeChange(value / 100);
    },
    [onNodeSizeChange]
  );

  const sliderLabel = (value: number) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 8,
        color: valueColor,
      }}
    >
      <span>Node Size</span>
      <span style={{ minWidth: 45, textAlign: "right" }}>{value}%</span>
    </div>
  );

  const cityCoordinates = selectedCity
    ? `${selectedCity.lat.toFixed(2)}, ${selectedCity.lng.toFixed(2)}`
    : "N/A";

  const formattedPopulation = selectedCity
    ? selectedCity.population?.toLocaleString() || "N/A"
    : "N/A";

  const diagramPosition = selectedCity?.location
    ? `x: ${selectedCity.location.x?.toFixed(
        0
      )}, y: ${selectedCity.location.y?.toFixed(0)}`
    : null;

  const sliderValue = nodeSize * 100;
  return (
    <>
      <Title order={4} c={valueColor} mb={theme.spacing.xs}>
        Node Details
      </Title>
      {selectedCity ? (
        <>
          <Text size="sm" fw={500} mb={theme.spacing.xs} c={valueColor}>
            {selectedCity.city}, {selectedCity.country}
          </Text>
          <KeyValuePair label="Coordinates" value={cityCoordinates} />
          <KeyValuePair label="Country" value={selectedCity.country} />
          <KeyValuePair label="Population" value={formattedPopulation} />
          {diagramPosition && (
            <KeyValuePair label="Diagram Position" value={diagramPosition} />
          )}
          <Slider
            label={sliderLabel}
            value={sliderValue}
            onChange={handleSliderChange}
            {...sliderConfig}
          />
        </>
      ) : (
        <>
          <Text size="sm" fw={500} mb={theme.spacing.xs} c={valueColor}>
            No Node Selected
          </Text>
          <KeyValuePair label="City" value="N/A" />
          <KeyValuePair label="Country" value="N/A" />
          <KeyValuePair label="Coordinates" value="N/A" />
          <KeyValuePair label="Population" value="N/A" />
          <KeyValuePair label="Diagram Position" value="N/A" />
          <Slider
            label={sliderLabel}
            value={sliderValue}
            onChange={handleSliderChange}
            {...sliderConfig}
            disabled
          />
        </>
      )}
    </>
  );
});
