"use client";

import { Title, Text, Slider, useMantineTheme } from "@mantine/core";
import { KeyValuePair } from "./KeyValuePair";
import type { GoJSCityNodeData } from "../types/gojs-types";

interface NodeDetailsProps {
  selectedCity: GoJSCityNodeData | null;
  nodeSize: number;
  onNodeSizeChange: (size: number) => void;
}

export function NodeDetails({
  selectedCity,
  nodeSize,
  onNodeSizeChange,
}: NodeDetailsProps) {
  const theme = useMantineTheme();
  const valueColor = theme.other?.valueColor || "white";
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
          <KeyValuePair
            label="Coordinates"
            value={`${selectedCity.lat.toFixed(2)}, ${selectedCity.lng.toFixed(
              2
            )}`}
          />
          <KeyValuePair label="Country" value={selectedCity.country} />
          <KeyValuePair
            label="Population"
            value={selectedCity.population?.toLocaleString() || "N/A"}
          />
          {selectedCity.location && (
            <KeyValuePair
              label="Diagram Position"
              value={`x: ${selectedCity.location.x?.toFixed(
                0
              )}, y: ${selectedCity.location.y?.toFixed(0)}`}
            />
          )}
          <Slider
            label={(value) => (
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
                <span style={{ minWidth: 45, textAlign: "right" }}>
                  {value}%
                </span>
              </div>
            )}
            value={nodeSize * 100}
            onChange={(value) => onNodeSizeChange(value / 100)}
            min={50}
            max={150}
            step={10}
            marks={[
              { value: 50, label: "50%" },
              { value: 100, label: "100%" },
              { value: 150, label: "150%" },
            ]}
            styles={{
              markLabel: { fontSize: 10, marginTop: 5, color: valueColor },
              root: { marginTop: 8, marginBottom: 24 },
            }}
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
            label={(value) => (
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
                <span style={{ minWidth: 45, textAlign: "right" }}>
                  {value}%
                </span>
              </div>
            )}
            value={nodeSize * 100}
            onChange={(value) => onNodeSizeChange(value / 100)}
            min={50}
            max={150}
            step={10}
            marks={[
              { value: 50, label: "50%" },
              { value: 100, label: "100%" },
              { value: 150, label: "150%" },
            ]}
            styles={{
              markLabel: { fontSize: 10, marginTop: 5, color: valueColor },
              root: { marginTop: 8, marginBottom: 24 },
            }}
            disabled
          />
        </>
      )}
    </>
  );
}
