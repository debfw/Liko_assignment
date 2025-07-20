"use client";

import { Switch, Text, Stack, Slider, useMantineTheme } from "@mantine/core";
import { useUIControlsStore } from "../stores";
import { KeyValuePair } from "./KeyValuePair";
import { memo, useMemo, useCallback } from "react";

interface SelectedLinkData {
  from: string;
  to: string;
  method: string;
  distance: number;
}

interface LinkControlsProps {
  selectedLinkData?: SelectedLinkData;
}

export const LinkControls = memo(function LinkControls({
  selectedLinkData,
}: LinkControlsProps) {
  const theme = useMantineTheme();
  const {
    showLinks,
    linkOpacity,
    selectedLinkThickness,
    setShowLinks,
    setLinkOpacity,
    setSelectedLinkThickness,
  } = useUIControlsStore();

  const opacitySliderConfig = useMemo(
    () => ({
      min: 0,
      max: 1,
      step: 0.1,
      marks: [
        { value: 0, label: "0%" },
        { value: 0.5, label: "50%" },
        { value: 1, label: "100%" },
      ],
      styles: {
        markLabel: {
          fontSize: 10,
          marginTop: 5,
          color: theme.other?.keyColor || theme.colors.gray[4],
        },
        root: { marginBottom: 16 },
      },
    }),
    [theme]
  );

  const thicknessSliderConfig = useMemo(
    () => ({
      min: 1,
      max: 10,
      step: 1,
      marks: [
        { value: 1, label: "1px" },
        { value: 5, label: "5px" },
        { value: 10, label: "10px" },
      ],
      styles: {
        markLabel: {
          fontSize: 10,
          marginTop: 5,
          color: theme.other?.keyColor || theme.colors.gray[4],
        },
        root: { marginBottom: 16 },
      },
    }),
    [theme]
  );

  const handleShowLinksChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.currentTarget.checked;
      setShowLinks(isChecked);
      if (!isChecked) {
        setLinkOpacity(0);
      } else {
        setLinkOpacity(1);
      }
    },
    [setShowLinks, setLinkOpacity]
  );

  // Memoize shipping method display name
  const shippingMethodName = useMemo(() => {
    if (!selectedLinkData) return "";
    const methodMap: Record<string, string> = {
      ship: "Ship",
      "ship-express": "Express Ship",
      airplane: "Airplane",
      "airplane-express": "Express Air",
      truck: "Truck",
    };
    return methodMap[selectedLinkData.method] || selectedLinkData.method;
  }, [selectedLinkData]);

  const formattedDistance = useMemo(() => {
    if (!selectedLinkData) return "";
    return `${selectedLinkData.distance?.toFixed(0)} km`;
  }, [selectedLinkData]);

  const opacityPercentage = useMemo(() => {
    return Math.round(linkOpacity * 100);
  }, [linkOpacity]);

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
        <Switch checked={showLinks} onChange={handleShowLinksChange} />
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
            {opacityPercentage}%
          </Text>
        </div>
        <Slider
          value={linkOpacity}
          onChange={setLinkOpacity}
          disabled={!showLinks}
          {...opacitySliderConfig}
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
          disabled={!showLinks}
          {...thicknessSliderConfig}
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
          <KeyValuePair label="Method" value={shippingMethodName} />
          <KeyValuePair label="Distance" value={formattedDistance} />
        </>
      )}
    </Stack>
  );
});
