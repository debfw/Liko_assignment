"use client";

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import * as go from "gojs";
import { Title, Text, Group, Stack, Paper, Box } from "@mantine/core";

import type { GoJSCityNodeData } from "../types/gojs-types";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { NodeDetails } from "./NodeDetails";
import { LinkControls } from "./LinkControls";
import { SearchAndFilter } from "./SearchAndFilter";
import { ZoomControls } from "./ZoomControls";
import { DiagramContextMenu } from "./DiagramContextMenu";
import {
  useDiagramStore,
  useFilterStore,
  useUIControlsStore,
  useContextMenuStore,
  useInteractionStore,
  useSaveStateStore,
} from "../stores";
import { useDiagramInteractions } from "../hooks/useDiagramInteractions";
import { useDiagramSetup } from "../hooks/useDiagramSetup";
import { useDiagramTools } from "../hooks/useDiagramTools";
import { useDiagramFiltering } from "../hooks/useDiagramFiltering";
import { useDiagramStyling } from "../hooks/useDiagramStyling";

interface WorldMapDiagramProps {
  nodeDataArray: GoJSCityNodeData[];
  linkDataArray: go.GraphLinksModel["linkDataArray"];
  loadCityData: (diagram: go.Diagram) => Promise<void>;
}

const WorldMapDiagram = memo(function WorldMapDiagram({
  nodeDataArray,
  linkDataArray,
  loadCityData,
}: WorldMapDiagramProps) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const { isRelinkingEnabled } = useInteractionStore();

  const [selectedCity, setSelectedCity] = useState<GoJSCityNodeData | null>(
    null
  );
  const [nodeSize, setNodeSize] = useState<number>(1);

  const { diagram, selectedLink, setSelectedLink } = useDiagramStore();

  const {
    searchTerm,
    selectedShippingMethod,
    setSearchTerm,
    setSelectedShippingMethod,
    setAllCities,
  } = useFilterStore();

  const {
    showLinks,
    linkOpacity,
    selectedLinkThickness,
    setShowLinks,
    setLinkOpacity,
    setSelectedLinkThickness,
  } = useUIControlsStore();

  const { showContextMenu, hideContextMenu } = useContextMenuStore();

  const {
    isDraggingEnabled,
    isLinkingEnabled,
    setRelinkingEnabled,
    setDraggingEnabled,
    setLinkingEnabled,
  } = useInteractionStore();

  const { triggerSave } = useSaveStateStore();

  // Setup diagram
  useDiagramSetup({
    diagramRef,
    nodeDataArray,
    linkDataArray,
    linkOpacity,
    onCitySelect: setSelectedCity,
    onLinkSelect: setSelectedLink,
    onNodeSizeChange: setNodeSize,
    onLinkThicknessChange: setSelectedLinkThickness,
    selectedCity,
    triggerSave,
    showContextMenu,
    hideContextMenu,
  });

  // Setup tools
  useDiagramTools(
    diagram,
    isDraggingEnabled,
    isLinkingEnabled,
    isRelinkingEnabled
  );

  // Setup filtering
  useDiagramFiltering(diagram, searchTerm, selectedShippingMethod, showLinks);

  // Setup styling
  useDiagramStyling(
    diagram,
    showLinks,
    linkOpacity,
    selectedLinkThickness,
    selectedCity,
    nodeSize
  );

  // Setup interactions
  useDiagramInteractions();

  // Update cities in filter store
  useEffect(() => {
    const cities = nodeDataArray.map((city) => ({
      ...city,
      city_ascii: city.city_ascii || city.city,
    }));
    setAllCities(cities);
  }, [nodeDataArray, setAllCities]);

  const handleNodeSizeChange = useCallback(
    (sizeMultiplier: number) => {
      setNodeSize(sizeMultiplier);
      if (diagram && selectedCity) {
        diagram.startTransaction("resize node");
        diagram.nodes.each((node) => {
          const goNode = node as go.Node;
          if (goNode.data.key === selectedCity.key) {
            const shape = goNode.findObject("SHAPE") as go.Shape;
            const label = goNode.findObject("LABEL") as go.TextBlock;

            if (shape) {
              const baseSize = goNode.data.size || 10;
              const newSize = baseSize * sizeMultiplier;
              shape.width = newSize;
              shape.height = newSize;
            }

            if (label) {
              const baseFontSize = 10;
              const newFontSize = Math.max(
                6,
                Math.min(24, baseFontSize * sizeMultiplier)
              );
              label.font = `bold ${newFontSize}px sans-serif`;
            }
          }
        });
        diagram.commitTransaction("resize node");
        triggerSave();
      }
    },
    [diagram, selectedCity, triggerSave]
  );

  const resetView = useCallback(async () => {
    if (!diagram) return;

    setRelinkingEnabled(false);
    setDraggingEnabled(false);
    setLinkingEnabled(false);

    loadCityData(diagram);

    setSelectedCity(null);
    setSelectedLink(null);

    setSearchTerm("");
    setSelectedShippingMethod(null);

    setShowLinks(true);
    setLinkOpacity(0.7);
    setSelectedLinkThickness(3);
    setNodeSize(1);

    hideContextMenu();
  }, [
    diagram,
    loadCityData,
    setSearchTerm,
    setSelectedShippingMethod,
    setShowLinks,
    setLinkOpacity,
    setSelectedLinkThickness,
    setRelinkingEnabled,
    setDraggingEnabled,
    setLinkingEnabled,
    hideContextMenu,
    setSelectedLink,
  ]);

  const selectedLinkData = useMemo(() => {
    if (!selectedLink) return undefined;
    return {
      from:
        selectedLink.fromNode?.data?.city || `City ${selectedLink.data.from}`,
      to: selectedLink.toNode?.data?.city || `City ${selectedLink.data.to}`,
      method:
        selectedLink.data.category || selectedLink.data.method || "Unknown",
      distance: Math.round(
        selectedLink.fromNode && selectedLink.toNode
          ? Math.sqrt(
              Math.pow(
                selectedLink.fromNode.location.x -
                  selectedLink.toNode.location.x,
                2
              ) +
                Math.pow(
                  selectedLink.fromNode.location.y -
                    selectedLink.toNode.location.y,
                  2
                )
            )
          : 0
      ),
    };
  }, [selectedLink]);

  return (
    <Box className="w-full h-screen flex" bg="dark.8">
      <Paper
        p="md"
        bg="dark.7"
        style={{
          width: 350,
          height: "100%",
          overflowY: "auto",
          borderRadius: 0,
        }}
      >
        <Stack gap="md">
          <div>
            <Title size="sm" c="dimmed">
              Visualization Dashboard
            </Title>
          </div>

          <Paper p="sm" radius="md" bg="dark.6" withBorder>
            <NodeDetails
              key={selectedCity?.key || "no-selection"}
              selectedCity={selectedCity}
              nodeSize={nodeSize}
              onNodeSizeChange={handleNodeSizeChange}
            />
          </Paper>

          <Paper p="md" radius="md" bg="dark.6" withBorder>
            <Title order={5} mb="sm">
              Link Controls
            </Title>
            <LinkControls selectedLinkData={selectedLinkData} />
          </Paper>

          <Paper p="sm" radius="md" bg="dark.6" withBorder>
            <Title order={5} mb="sm">
              Search & Filter
            </Title>
            <SearchAndFilter />
          </Paper>
        </Stack>
      </Paper>
      <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Paper p="md" radius={0} bg="dark.7">
          <Title order={2} mb="xs">
            World Shipping Network Visualization
          </Title>
          <Text size="md">
            Click a city to view its details. Use the zoom controls to navigate
            the map. Adjust link visibility and thickness in the sidebar. Search
            for cities or countries, and filter the map by shipping method to
            highlight specific routes and their connected cities. No light mode,
            of course.
          </Text>
        </Paper>

        <Box p="md">
          <Group justify="space-between" align="center" mb="sm">
            <SaveStateIndicator />
            <ZoomControls onReset={resetView} />
          </Group>
        </Box>

        <Box
          ref={diagramRef}
          bg="dark.9"
          style={{ flex: 1, margin: "0 20px 20px 20px" }}
        />
      </Box>

      <DiagramContextMenu />
    </Box>
  );
});

export default WorldMapDiagram;
