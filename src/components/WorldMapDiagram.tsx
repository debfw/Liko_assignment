"use client";

import { useEffect, useRef, useState } from "react";
import * as go from "gojs";
import {
  Button,
  TextInput,
  Select,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Slider,
  Switch,
  CloseButton,
  Box,
  Flex,
  Badge,
} from "@mantine/core";
import {
  IconSearch,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconMaximize,
} from "@tabler/icons-react";
import { convertLatLngToDiagramCoords } from "@/utils/coordinates";
import { detectRegion, regionColors, getNodeSize } from "@/utils/regions";
import { createShippingLinks } from "@/utils/shipping";
import type { GoJSCityNodeData } from "../types/gojs-types";

export default function WorldMapDiagram() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagram, setDiagram] = useState<go.Diagram | null>(null);
  const [selectedCity, setSelectedCity] = useState<GoJSCityNodeData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [showLinks, setShowLinks] = useState(true);
  const [linkOpacity, setLinkOpacity] = useState(1);

  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;
    const myDiagram = new go.Diagram(diagramRef.current, {
      "animationManager.isEnabled": false,
      "undoManager.isEnabled": false,
      layout: $(go.Layout),
      isReadOnly: false,
      "draggingTool.isEnabled": false,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(40, 40),
      initialAutoScale: go.Diagram.Uniform,
      contentAlignment: go.Spot.Center,
      padding: 50,
      fixedBounds: new go.Rect(0, 0, 1600, 800),
      model: new go.GraphLinksModel(),
    });

    // Set dark theme background
    if (myDiagram.div) {
      myDiagram.div.style.backgroundColor = "#0a0a0a";
    }

    myDiagram.nodeTemplate = $(
      go.Node,
      "Auto",
      {
        movable: false,
        locationSpot: go.Spot.Center,
        selectable: true,
        click: (e, node) => {
          const goNode = node as go.Node;
          const data = goNode.data as GoJSCityNodeData;
          setSelectedCity(data);

          // Highlight selected node
          myDiagram.nodes.each((n) => {
            const nNode = n as go.Node;
            const shape = nNode.findObject("SHAPE") as go.Shape;
            if (shape) {
              if (nNode.data.key === data.key) {
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

          myDiagram.links.each((link) => {
            const goLink = link as go.Link;
            const label = goLink.findObject("LABEL");
            const shape = goLink.findObject("LINKSHAPE") as go.Shape;
            const isConnected =
              goLink.data.from === data.key || goLink.data.to === data.key;

            if (label) {
              label.visible = isConnected;
            }
            if (shape) {
              shape.opacity = isConnected ? 1 : 0.2;
              shape.strokeWidth = isConnected
                ? (goLink.data.strokeWidth || 2) + 1
                : goLink.data.strokeWidth || 2;
            }
          });
        },
        mouseEnter: (e, node) => {
          const goNode = node as go.Node;
          const shape = goNode.findObject("SHAPE") as go.Shape;
          if (shape && !goNode.isSelected) {
            shape.scale = 1.2;
          }

          // Highlight connected links on hover
          const data = goNode.data as GoJSCityNodeData;
          myDiagram.links.each((link) => {
            const goLink = link as go.Link;
            const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
            if (linkShape) {
              const isConnected =
                goLink.data.from === data.key || goLink.data.to === data.key;
              linkShape.opacity = isConnected ? 0.6 : 0.2;
            }
          });
        },
        mouseLeave: (e, node) => {
          const goNode = node as go.Node;
          const shape = goNode.findObject("SHAPE") as go.Shape;
          if (shape && !goNode.isSelected) {
            shape.scale = 1;
          }

          // Reset link opacity if no node is selected
          if (!selectedCity) {
            myDiagram.links.each((link) => {
              const goLink = link as go.Link;
              const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
              if (linkShape) {
                linkShape.opacity = goLink.data.opacity || 1;
              }
            });
          }
        },
        toolTip: $(
          "ToolTip",
          { "Border.fill": "#2d2d2d", "Border.stroke": "#4a4a4a" },
          $(
            go.TextBlock,
            { margin: 4, font: "12px sans-serif", stroke: "#e0e0e0" },
            new go.Binding(
              "text",
              "",
              (data) => `${data.city}, ${data.country}`
            )
          )
        ),
      },
      new go.Binding("location", "location"),
      $(
        go.Shape,
        "Circle",
        {
          name: "SHAPE",
          strokeWidth: 2,
          stroke: "#666",
          portId: "",
          cursor: "pointer",
        },
        new go.Binding("fill", "color"),
        new go.Binding("width", "size"),
        new go.Binding("height", "size")
      )
    );

    myDiagram.linkTemplate = $(
      go.Link,
      {
        routing: go.Link.Normal,
        curve: go.Link.Bezier,
        selectable: true,
        relinkableFrom: false,
        relinkableTo: false,
        click: (e, link) => {
          const goLink = link as go.Link;
          const label = goLink.findObject("LABEL");
          if (label) {
            label.visible = !label.visible;
          }
        },
        mouseEnter: (e, link) => {
          const goLink = link as go.Link;
          const shape = goLink.findObject("LINKSHAPE") as go.Shape;
          if (shape) {
            shape.opacity = 0.8;
            shape.strokeWidth = (goLink.data.strokeWidth || 2) + 0.5;
          }
        },
        mouseLeave: (e, link) => {
          const goLink = link as go.Link;
          const shape = goLink.findObject("LINKSHAPE") as go.Shape;
          if (shape) {
            shape.opacity = goLink.data.opacity || 1;
            shape.strokeWidth = goLink.data.strokeWidth || 2;
          }
        },
      },
      new go.Binding("curviness", "curviness"),
      $(
        go.Shape,
        {
          name: "LINKSHAPE",
          strokeWidth: 2,
          cursor: "pointer",
        },
        new go.Binding("stroke", "stroke"),
        new go.Binding("strokeWidth", "strokeWidth"),
        new go.Binding("strokeDashArray", "strokeDashArray"),
        new go.Binding("opacity", "opacity")
      ),
      $(
        go.Panel,
        "Auto",
        {
          name: "LABEL",
          visible: false,
          segmentIndex: 0,
          segmentFraction: 0.5,
        },
        $(go.Shape, "RoundedRectangle", {
          fill: "white",
          stroke: "gray",
          strokeWidth: 0.5,
        }),
        $(
          go.TextBlock,
          {
            margin: 3,
            font: "10px sans-serif",
            textAlign: "center",
          },
          new go.Binding("text", "text")
        )
      )
    );

    setDiagram(myDiagram);

    loadCityData(myDiagram);

    return () => {
      myDiagram.div = null;
    };
  }, [selectedCity]);

  const loadCityData = async (diagram: go.Diagram) => {
    try {
      const response = await fetch("/worldcities.json");
      const cities: GoJSCityNodeData[] = await response.json();

      const nodeDataArray = cities.map((city) => {
        const coords = convertLatLngToDiagramCoords(city.lat, city.lng);
        const region = detectRegion(city.lat, city.lng, city.country);

        return {
          ...city,
          key: city.id,
          region: region,
          color: regionColors[region],
          size: getNodeSize(city.population),
          location: new go.Point(coords.x, coords.y),
        };
      });

      const linkDataArray = createShippingLinks(cities);

      diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    } catch (error) {
      console.error("Error loading city data:", error);
    }
  };

  const handleZoomIn = () => {
    if (diagram) {
      diagram.commandHandler.increaseZoom();
    }
  };

  const handleZoomOut = () => {
    if (diagram) {
      diagram.commandHandler.decreaseZoom();
    }
  };

  const handleResetZoom = () => {
    if (diagram) {
      diagram.scale = 1;
      diagram.scrollToRect(diagram.documentBounds);
      setSelectedCity(null);
      // Reset all node highlights
      diagram.nodes.each((n) => {
        const nNode = n as go.Node;
        const shape = nNode.findObject("SHAPE") as go.Shape;
        if (shape) {
          shape.strokeWidth = 2;
          shape.stroke = "#666";
          shape.scale = 1;
        }
      });
      // Reset all link opacity and labels
      diagram.links.each((link) => {
        const goLink = link as go.Link;
        const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
        const label = goLink.findObject("LABEL");
        if (linkShape) {
          linkShape.opacity = goLink.data.opacity || 1;
          linkShape.strokeWidth = goLink.data.strokeWidth || 2;
        }
        if (label) {
          label.visible = false;
        }
      });
    }
  };

  const handleFitToView = () => {
    if (diagram) {
      diagram.zoomToFit();
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (diagram) {
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        const cityName = (goNode.data as GoJSCityNodeData).city.toLowerCase();
        const visible = term === "" || cityName.includes(term.toLowerCase());
        goNode.visible =
          visible &&
          (selectedRegion === "all" ||
            (goNode.data as GoJSCityNodeData).region === selectedRegion);
      });

      diagram.links.each((link) => {
        const goLink = link as go.Link;
        const fromNode = diagram.findNodeForKey(goLink.data.from);
        const toNode = diagram.findNodeForKey(goLink.data.to);
        goLink.visible =
          showLinks &&
          (fromNode?.visible ?? false) &&
          (toNode?.visible ?? false);
      });
    }
  };

  const handleRegionFilter = (region: string) => {
    setSelectedRegion(region);
    if (diagram) {
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        const nodeRegion = (goNode.data as GoJSCityNodeData).region;
        const cityName = (goNode.data as GoJSCityNodeData).city.toLowerCase();
        const matchesSearch =
          searchTerm === "" || cityName.includes(searchTerm.toLowerCase());
        goNode.visible =
          matchesSearch && (region === "all" || nodeRegion === region);
      });

      diagram.links.each((link) => {
        const goLink = link as go.Link;
        const fromNode = diagram.findNodeForKey(goLink.data.from);
        const toNode = diagram.findNodeForKey(goLink.data.to);
        goLink.visible =
          showLinks &&
          (fromNode?.visible ?? false) &&
          (toNode?.visible ?? false);
      });
    }
  };

  const handleToggleLinks = () => {
    const newShowLinks = !showLinks;
    setShowLinks(newShowLinks);
    if (diagram) {
      diagram.links.each((link) => {
        const goLink = link as go.Link;
        const fromNode = diagram.findNodeForKey(goLink.data.from);
        const toNode = diagram.findNodeForKey(goLink.data.to);
        goLink.visible =
          newShowLinks &&
          (fromNode?.visible ?? false) &&
          (toNode?.visible ?? false);
      });
    }
  };

  const handleLinkOpacityChange = (opacity: number) => {
    setLinkOpacity(opacity);
    if (diagram) {
      diagram.links.each((link) => {
        const goLink = link as go.Link;
        const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
        if (linkShape && !selectedCity) {
          linkShape.opacity = opacity;
          goLink.data.opacity = opacity;
        }
      });
    }
  };

  return (
    <Box
      className="w-full min-h-screen flex flex-col items-center justify-start"
      bg="dark.8"
    >
      <Box style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <Paper p="md" radius={0} bg="dark.7">
          <Title order={2} mb="md" c="white">
            World Shipping Network Visualization
          </Title>
          <Text size="md" c="dimmed" mb="md">
            Explore global shipping connections between major cities. Click on a
            city to view its details and highlight its shipping routes. Use the
            controls to filter, search, and adjust the visualization to your
            needs. <i>No light mode button, of course.</i>
          </Text>

          <Group gap="md" wrap="wrap">
            <Button.Group>
              <Button
                leftSection={<IconZoomIn size={16} />}
                onClick={handleZoomIn}
                variant="light"
                size="sm"
                style={{ marginRight: 8 }}
              >
                Zoom In
              </Button>
              <Button
                leftSection={<IconZoomOut size={16} />}
                onClick={handleZoomOut}
                variant="light"
                size="sm"
                style={{ marginRight: 8 }}
              >
                Zoom Out
              </Button>
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={handleResetZoom}
                variant="light"
                color="gray"
                size="sm"
                style={{ marginRight: 8 }}
              >
                Reset
              </Button>
              <Button
                leftSection={<IconMaximize size={16} />}
                onClick={handleFitToView}
                variant="light"
                color="green"
                size="sm"
              >
                Fit to View
              </Button>
            </Button.Group>

            <TextInput
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              leftSection={<IconSearch size={16} />}
              size="sm"
              w={200}
            />

            <Select
              value={selectedRegion}
              onChange={(value) => handleRegionFilter(value || "all")}
              data={[
                { value: "all", label: "All Regions" },
                { value: "north-america", label: "North America" },
                { value: "south-america", label: "South America" },
                { value: "europe", label: "Europe" },
                { value: "africa", label: "Africa" },
                { value: "asia", label: "Asia" },
                { value: "oceania", label: "Oceania" },
              ]}
              size="sm"
              w={180}
            />
          </Group>

          {selectedCity && (
            <Card mt="md" p="md" radius="md" bg="dark.6" withBorder>
              <Group justify="space-between" mb="xs">
                <Title order={4}>
                  {selectedCity.city}, {selectedCity.country}
                </Title>
                <CloseButton
                  onClick={() => {
                    setSelectedCity(null);
                    // Reset all node highlights
                    if (diagram) {
                      diagram.nodes.each((n) => {
                        const nNode = n as go.Node;
                        const shape = nNode.findObject("SHAPE") as go.Shape;
                        if (shape) {
                          shape.strokeWidth = 2;
                          shape.stroke = "#666";
                          shape.scale = 1;
                        }
                      });
                      // Reset all link opacity
                      diagram.links.each((link) => {
                        const goLink = link as go.Link;
                        const linkShape = goLink.findObject(
                          "LINKSHAPE"
                        ) as go.Shape;
                        const label = goLink.findObject("LABEL");
                        if (linkShape) {
                          linkShape.opacity = goLink.data.opacity || 1;
                          linkShape.strokeWidth = goLink.data.strokeWidth || 2;
                        }
                        if (label) {
                          label.visible = false;
                        }
                      });
                    }
                  }}
                  size="sm"
                  variant="subtle"
                />
              </Group>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  <Text span fw={600}>
                    Coordinates:
                  </Text>{" "}
                  {selectedCity.lat.toFixed(4)}°
                  {selectedCity.lat > 0 ? "N" : "S"},{" "}
                  {Math.abs(selectedCity.lng).toFixed(4)}°
                  {selectedCity.lng > 0 ? "E" : "W"}
                </Text>
                <Text size="sm" c="dimmed">
                  <Text span fw={600}>
                    Population:
                  </Text>{" "}
                  {selectedCity.population.toLocaleString()}
                </Text>
                <Text size="sm" c="dimmed">
                  <Text span fw={600}>
                    Region:
                  </Text>{" "}
                  <Badge variant="light" size="sm">
                    {selectedCity.region
                      ?.split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </Badge>
                </Text>
              </Stack>
            </Card>
          )}

          <Paper mt="md" p="sm" radius="md" bg="dark.6" withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Link Controls</Title>
              <Switch
                checked={showLinks}
                onChange={() => handleToggleLinks()}
                label={showLinks ? "Links Visible" : "Links Hidden"}
                size="sm"
                onLabel="ON"
                offLabel="OFF"
              />
            </Group>
            {showLinks && (
              <Group align="center" gap="md">
                <Text size="sm" c="dimmed">
                  Opacity:
                </Text>
                <Slider
                  value={linkOpacity}
                  onChange={handleLinkOpacityChange}
                  min={0.1}
                  max={1}
                  step={0.1}
                  label={(value) => `${Math.round(value * 100)}%`}
                  w={180}
                  size="sm"
                  color="violet"
                  marks={[
                    { value: 0.1, label: "10%" },
                    { value: 0.5, label: "50%" },
                    { value: 1, label: "100%" },
                  ]}
                />
              </Group>
            )}
            <Title order={5} mt="md" mb="sm">
              Shipping Methods
            </Title>
            <Group gap="lg" wrap="wrap">
              <Group gap="xs">
                <Box w={32} h={2} bg="pink" />
                <Text size="sm" c="dimmed">
                  Truck (Same Country)
                </Text>
              </Group>
              <Group gap="xs">
                <Box
                  w={32}
                  h={2}
                  bg="brown"
                  style={{ borderTop: "2px dashed brown" }}
                />
                <Text size="sm" c="dimmed">
                  Air (Same Continent)
                </Text>
              </Group>
              <Group gap="xs">
                <Box
                  w={32}
                  h={2}
                  bg="yellow"
                  style={{ borderTop: "2px dashed yellow" }}
                />
                <Text size="sm" c="dimmed">
                  Express Air
                </Text>
              </Group>
              <Group gap="xs">
                <Box
                  w={32}
                  h={2}
                  bg="blue"
                  style={{ borderTop: "2px dotted blue" }}
                />
                <Text size="sm" c="dimmed">
                  Ship (Cross Ocean)
                </Text>
              </Group>
              <Group gap="xs">
                <Box
                  w={32}
                  h={2}
                  bg="gray"
                  style={{ borderTop: "2px dashed gray" }}
                />
                <Text size="sm" c="dimmed">
                  Express Ship (30%)
                </Text>
              </Group>
            </Group>
          </Paper>
        </Paper>
      </Box>

      <Box
        ref={diagramRef}
        bg="dark.9"
        style={{ width: "100%", maxWidth: 1200, height: 600, margin: "0 auto" }}
      />
    </Box>
  );
}
