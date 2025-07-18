"use client";

import { Switch, Text, Stack, Slider, useMantineTheme } from "@mantine/core";
import { useUIControlsStore } from "../stores";
import { KeyValuePair } from "./KeyValuePair";

interface LinkControlsProps {
  selectedLinkData?: any;
}

export function LinkControls({ selectedLinkData }: LinkControlsProps) {
  const theme = useMantineTheme();
  const {
    showLinks,
    linkOpacity,
    selectedLinkThickness,
    setShowLinks,
    setLinkOpacity,
    setSelectedLinkThickness,
  } = useUIControlsStore();

  return (
    <Stack gap={theme.spacing.xs}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text size="sm" fw={500} c={theme.other?.keyColor || "dimmed"}>
          Show Links
        </Text>
        <Switch
          checked={showLinks}
          onChange={(event) => {
            setShowLinks(event.currentTarget.checked);
            if (!event.currentTarget.checked) {
              setLinkOpacity(0);
            } else {
              setLinkOpacity(1);
            }
          }}
        />
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text size="sm" fw={500} c={theme.other?.keyColor || "dimmed"}>
            Link Opacity
          </Text>
          <Text size="sm" fw={500} c={theme.other?.valueColor || "white"}>
            {Math.round(linkOpacity * 100)}%
          </Text>
        </div>
        <Slider
          value={linkOpacity}
          onChange={setLinkOpacity}
          min={0}
          max={1}
          step={0.1}
          disabled={!showLinks}
          marks={[
            { value: 0, label: "0%" },
            { value: 0.5, label: "50%" },
            { value: 1, label: "100%" },
          ]}
          styles={{
            markLabel: {
              fontSize: 10,
              marginTop: 5,
              color: theme.other?.keyColor || theme.colors.gray[4],
            },
            root: { marginBottom: 16 },
          }}
        />
      </div>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text size="sm" fw={500} c={theme.other?.keyColor || "dimmed"}>
            Link Thickness
          </Text>
          <Text size="sm" fw={500} c={theme.other?.valueColor || "white"}>
            {selectedLinkThickness}px
          </Text>
        </div>
        <Slider
          value={selectedLinkThickness}
          onChange={setSelectedLinkThickness}
          min={1}
          max={10}
          step={1}
          disabled={!showLinks}
          marks={[
            { value: 1, label: "1px" },
            { value: 5, label: "5px" },
            { value: 10, label: "10px" },
          ]}
          styles={{
            markLabel: {
              fontSize: 10,
              marginTop: 5,
              color: theme.other?.keyColor || theme.colors.gray[4],
            },
            root: { marginBottom: 16 },
          }}
        />
      </div>
      {selectedLinkData && (
        <>
          <Text
            size="sm"
            fw={500}
            mt={theme.spacing.xs}
            c={theme.other?.keyColor || "dimmed"}
          >
            Selected Link:
          </Text>
          <KeyValuePair label="From" value={selectedLinkData.from} />
          <KeyValuePair label="To" value={selectedLinkData.to} />
          <KeyValuePair
            label="Method"
            value={
              selectedLinkData.method === "ship"
                ? "Ship"
                : selectedLinkData.method === "ship-express"
                ? "Express Ship"
                : selectedLinkData.method === "airplane"
                ? "Airplane"
                : selectedLinkData.method === "airplane-express"
                ? "Express Air"
                : selectedLinkData.method === "truck"
                ? "Truck"
                : selectedLinkData.method
            }
          />
          <KeyValuePair
            label="Distance"
            value={`${selectedLinkData.distance?.toFixed(0)} km`}
          />
        </>
      )}
    </Stack>
  );
}
