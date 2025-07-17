"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as go from "gojs";
import {
  Button,
  Select,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Switch,
  Box,
  Badge,
  Menu,
  Autocomplete,
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
import { SaveStateIndicator } from "./SaveStateIndicator";
import { useSaveStateStore } from "../stores/saveStateStore";
import { KeyValuePair } from "./KeyValuePair";

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
  const [selectedNodeSize, setSelectedNodeSize] = useState(1);
  const [allCities, setAllCities] = useState<GoJSCityNodeData[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<
    string | null
  >(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: "node" | "link" | null;
    target: go.Node | go.Link | null;
  }>({ visible: false, x: 0, y: 0, type: null, target: null });
  const [isResizing, setIsResizing] = useState<{
    active: boolean;
    type: "node" | "link" | null;
    target: go.Node | go.Link | null;
    startX: number;
    startY: number;
    startSize?: number;
    startFont?: string;
  }>({
    active: false,
    type: null,
    target: null,
    startX: 0,
    startY: 0,
    startSize: undefined,
    startFont: undefined,
  });

  const { triggerSave } = useSaveStateStore();

  const loadCityData = useCallback(
    async (diagram: go.Diagram) => {
      try {
        const response = await fetch("/worldcities.json");
        const cities: GoJSCityNodeData[] = await response.json();

        setAllCities(cities); // Store all cities for autocomplete

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
        diagram.links.each((link) => {
          const goLink = link as go.Link;
          const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
          if (linkShape) {
            linkShape.opacity = linkOpacity;
            goLink.data.opacity = linkOpacity;
          }
        });
      } catch (error) {
        console.error("Error loading city data:", error);
      }
    },
    [linkOpacity]
  );

  useEffect(() => {
    if (!diagramRef.current) return;

    const $ = go.GraphObject.make;
    const myDiagram = new go.Diagram(diagramRef.current, {
      "animationManager.isEnabled": false,
      "undoManager.isEnabled": false,
      layout: $(go.Layout),
      isReadOnly: false,
      "draggingTool.isEnabled": true,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(80, 80),
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
        contextClick: (e, node) => {
          if (e.event) {
            e.event.preventDefault();
            const goNode = node as go.Node;
            const rect = myDiagram.div?.getBoundingClientRect();
            if (rect) {
              setContextMenu({
                visible: true,
                x: (e.event as MouseEvent).clientX - rect.left,
                y: (e.event as MouseEvent).clientY - rect.top,
                type: "node",
                target: goNode,
              });
            }
          }
        },
        click: (e, node) => {
          const goNode = node as go.Node;
          const data = goNode.data as GoJSCityNodeData;

          // Only start resize mode if Ctrl/Cmd key is held down
          if (e.event && (e.event as MouseEvent).ctrlKey) {
            const mouseEvent = e.event as MouseEvent;
            const shape = goNode.findObject("SHAPE") as go.Shape;
            if (shape) {
              setIsResizing({
                active: true,
                type: "node",
                target: goNode,
                startX: mouseEvent.clientX,
                startY: mouseEvent.clientY,
                startSize: shape.width,
              });
            }
          }

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
              label.visible = showLinks && isConnected;
            }
            if (shape) {
              if (showLinks) {
                shape.opacity = isConnected ? 1 : 0.2;
                shape.strokeWidth = isConnected
                  ? (goLink.data.strokeWidth || 2) + 1
                  : goLink.data.strokeWidth || 2;
              } else {
                shape.opacity = 0;
                shape.strokeWidth = goLink.data.strokeWidth || 2;
              }
            }
          });
        },
        mouseEnter: (e, node) => {
          const goNode = node as go.Node;
          const shape = goNode.findObject("SHAPE") as go.Shape;
          if (shape && !goNode.isSelected) {
            shape.scale = 1.5; // Larger scale for better visibility
            shape.stroke = "#ff4444"; // Red border on hover
            shape.strokeWidth = 3; // Thicker border
          }

          // Highlight connected links on hover only if links are visible
          if (showLinks) {
            const data = goNode.data as GoJSCityNodeData;
            myDiagram.links.each((link) => {
              const goLink = link as go.Link;
              const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
              if (linkShape && goLink.visible) {
                const isConnected =
                  goLink.data.from === data.key || goLink.data.to === data.key;
                linkShape.opacity = isConnected ? 0.8 : 0.2;
              }
            });
          }
        },
        mouseLeave: (e, node) => {
          const goNode = node as go.Node;
          const shape = goNode.findObject("SHAPE") as go.Shape;
          const data = goNode.data as GoJSCityNodeData;

          if (shape && !goNode.isSelected) {
            shape.scale = 1;
            shape.stroke = "#666"; // Reset to default stroke
            shape.strokeWidth = 2; // Reset to default width
          } else if (shape && selectedCity && selectedCity.key === data.key) {
            // Keep selected node appearance
            shape.stroke = "#fff";
            shape.strokeWidth = 4;
          }

          // Reset link opacity if no node is selected
          if (!selectedCity && showLinks) {
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
            { margin: 4, stroke: "#e0e0e0" },
            new go.Binding(
              "text",
              "",
              (data) => `${data.city}, ${data.country}`
            ),
            new go.Binding(
              "font",
              "fontSize",
              (size) => `${size || 12}px sans-serif`
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
        new go.Binding("height", "size"),
        new go.Binding("cursor", "", () =>
          isResizing.active && isResizing.type === "node"
            ? "nwse-resize"
            : "pointer"
        )
      ),
      $(
        go.TextBlock,
        {
          name: "LABEL",
          alignment: go.Spot.Center,
          font: "bold 10px sans-serif",
          stroke: "white",
          background: "rgba(0,0,0,0.8)",
          margin: 3,
        },
        new go.Binding("text", "city"),
        new go.Binding(
          "font",
          "fontSize",
          (size) => `bold ${size || 10}px sans-serif`
        )
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
        movable: true,

        contextClick: (e, link) => {
          if (e.event) {
            e.event.preventDefault();
            const goLink = link as go.Link;
            const rect = myDiagram.div?.getBoundingClientRect();
            if (rect) {
              setContextMenu({
                visible: true,
                x: (e.event as MouseEvent).clientX - rect.left,
                y: (e.event as MouseEvent).clientY - rect.top,
                type: "link",
                target: goLink,
              });
            }
          }
        },
        click: (e, link) => {
          const goLink = link as go.Link;
          const label = goLink.findObject("LABEL");

          if (label && label.visible) {
            // Start resize mode for link label only if Ctrl/Cmd key is held down
            if (
              e.event &&
              (e.event as MouseEvent).ctrlKey &&
              label instanceof go.Panel
            ) {
              const textBlock = label.elt(1);
              if (textBlock instanceof go.TextBlock) {
                setIsResizing({
                  active: true,
                  type: "link",
                  target: goLink,
                  startX: (e.event as MouseEvent).clientX,
                  startY: (e.event as MouseEvent).clientY,
                  startFont: textBlock.font,
                });
              }
            }
          } else if (label) {
            label.visible = true;
          }
        },
        mouseEnter: (e, link) => {
          if (showLinks) {
            const goLink = link as go.Link;
            const shape = goLink.findObject("LINKSHAPE") as go.Shape;
            if (shape && goLink.visible) {
              shape.opacity = 0.8;
              shape.strokeWidth = (goLink.data.strokeWidth || 2) + 0.5;
            }
          }
        },
        mouseLeave: (e, link) => {
          if (showLinks) {
            const goLink = link as go.Link;
            const shape = goLink.findObject("LINKSHAPE") as go.Shape;
            if (shape && goLink.visible) {
              shape.opacity = goLink.data.opacity || 1;
              shape.strokeWidth = goLink.data.strokeWidth || 2;
            }
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

    // Add context menu handler
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
    };

    // Add resize handlers
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.active && myDiagram) {
        const deltaX = e.clientX - isResizing.startX;
        const deltaY = e.clientY - isResizing.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const scaleFactor = 1 + (distance / 100) * (deltaX > 0 ? 1 : -1);

        if (isResizing.type === "node" && isResizing.target) {
          const node = isResizing.target as go.Node;
          const shape = node.findObject("SHAPE") as go.Shape;
          if (shape && isResizing.startSize) {
            const newSize = Math.max(
              5,
              Math.min(50, isResizing.startSize * scaleFactor)
            );
            myDiagram.model.commit((m) => {
              m.set(node.data, "size", newSize);
            });
            triggerSave();
          }
        } else if (isResizing.type === "link" && isResizing.target) {
          const link = isResizing.target as go.Link;
          const label = link.findObject("LABEL");
          if (label && label instanceof go.Panel) {
            const textBlock = label.elt(1);
            if (textBlock instanceof go.TextBlock && isResizing.startFont) {
              const currentSize = parseInt(
                isResizing.startFont.match(/(\d+)px/)?.[1] || "10"
              );
              const newSize = Math.max(
                6,
                Math.min(30, currentSize * scaleFactor)
              );
              textBlock.font = `${Math.round(newSize)}px sans-serif`;
              triggerSave();
            }
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizing.active) {
        setIsResizing({
          active: false,
          type: null,
          target: null,
          startX: 0,
          startY: 0,
          startSize: undefined,
          startFont: undefined,
        });
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      myDiagram.div = null;
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selectedCity, showLinks]);

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
    if (!newShowLinks) {
      setLinkOpacity(0);
    } else {
      setLinkOpacity(1);
    }
    if (diagram) {
      diagram.links.each((link) => {
        const goLink = link as go.Link;
        const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
        const label = goLink.findObject("LABEL");

        const fromNode = diagram.findNodeForKey(goLink.data.from);
        const toNode = diagram.findNodeForKey(goLink.data.to);

        // Set link visibility based on showLinks state
        const shouldBeVisible =
          newShowLinks &&
          (fromNode?.visible ?? false) &&
          (toNode?.visible ?? false);

        goLink.visible = shouldBeVisible;

        if (linkShape) {
          if (newShowLinks) {
            // Restore the link opacity when showing
            linkShape.opacity = goLink.data.opacity || linkOpacity;
          } else {
            // Set opacity to 0 when hidden
            linkShape.opacity = 0;
          }
        }

        if (label) {
          label.visible = newShowLinks && label.visible;
        }
      });
      triggerSave();
    }
  };

  const handleLinkOpacityChange = (opacity: number) => {
    setLinkOpacity(opacity);
    if (diagram && showLinks) {
      diagram.links.each((link) => {
        const goLink = link as go.Link;
        const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
        if (linkShape && !selectedCity) {
          linkShape.opacity = opacity;
          goLink.data.opacity = opacity;
        }
      });
      triggerSave();
    }
  };

  const handleNodeSizeChange = (sizeMultiplier: number) => {
    if (diagram && selectedCity) {
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        if (goNode.data.key === selectedCity.key) {
          const shape = goNode.findObject("SHAPE") as go.Shape;
          if (shape) {
            const baseSize =
              goNode.data.size || getNodeSize(goNode.data.population);
            const newSize = baseSize * sizeMultiplier;
            shape.width = newSize;
            shape.height = newSize;
          }
        }
      });
      triggerSave();
    }
  };

  const handleDoubleFontSize = () => {
    if (contextMenu.type === "node" && contextMenu.target && diagram) {
      const node = contextMenu.target as go.Node;
      const currentFontSize = node.data.fontSize || 12;
      const newFontSize = Math.min(currentFontSize * 2, 48); // Max 48px

      diagram.model.commit((m) => {
        m.set(node.data, "fontSize", newFontSize);
      });
      triggerSave();
    }
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  };

  const handleHalveFontSize = () => {
    if (contextMenu.type === "link" && contextMenu.target && diagram) {
      const link = contextMenu.target as go.Link;
      const label = link.findObject("LABEL");
      if (label && label instanceof go.Panel) {
        const textBlock = label.elt(1);
        if (textBlock instanceof go.TextBlock) {
          const currentFont = textBlock.font;
          const currentSize = parseInt(
            currentFont.match(/(\d+)px/)?.[1] || "10"
          );
          const newSize = Math.max(currentSize / 2, 6); // Min 6px
          textBlock.font = `${newSize}px sans-serif`;
          triggerSave();
        }
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  };

  const handleShippingMethodClick = (method: string) => {
    if (!diagram) return;

    // Toggle selection - if same method is clicked again, deselect it
    const newMethod = selectedShippingMethod === method ? null : method;
    setSelectedShippingMethod(newMethod);

    // Filter links based on selected method
    diagram.links.each((link) => {
      const goLink = link as go.Link;
      const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
      const label = goLink.findObject("LABEL");

      if (linkShape) {
        if (newMethod === null) {
          // Show all links when no method is selected
          linkShape.opacity = showLinks ? linkOpacity : 0;
          if (label) label.visible = showLinks;
        } else {
          // Show only links of the selected method, but hide labels
          const isSelectedMethod = goLink.data.category === newMethod;
          linkShape.opacity = showLinks && isSelectedMethod ? linkOpacity : 0;
          if (label) label.visible = false; // Always hide labels when method is selected
        }
      }
    });

    triggerSave();
  };

  return (
    <Box
      className="w-full min-h-screen flex flex-col items-center justify-start"
      bg="dark.8"
    >
      <Box style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <Paper p="md" radius={0} bg="dark.7">
          <Title order={2} mb="xs">
            World Shipping Network Visualization
          </Title>
          <Text size="md" mb="md">
            Click cities to view details, use zoom controls above, adjust link
            settings in sidebar, search and filter cities, resize nodes with
            Ctrl+click. <i>No light mode, of course.</i>
          </Text>

          {/* Node details and Link controls in same row */}
          <Group gap="md" align="flex-start" mt="md">
            {/* Node details card */}
            <Card p="md" radius="md" bg="dark.6" withBorder style={{ flex: 1 }}>
              <Group justify="space-between" mb="xs">
                <Title order={4}>
                  {selectedCity
                    ? `${selectedCity.city}, ${selectedCity.country}`
                    : "Node Details"}
                </Title>
                <Text size="sm">Click a node to view details</Text>
              </Group>
              <Group gap="lg" align="flex-start">
                {/* Left column - Node details */}
                <Stack gap="xs" style={{ flex: 1 }}>
                  <KeyValuePair
                    label="Coordinates"
                    value={
                      selectedCity
                        ? `${selectedCity.lat.toFixed(4)}°${
                            selectedCity.lat > 0 ? "N" : "S"
                          }, ${Math.abs(selectedCity.lng).toFixed(4)}°${
                            selectedCity.lng > 0 ? "E" : "W"
                          }`
                        : "N/A"
                    }
                  />
                  <KeyValuePair
                    label="Population"
                    value={
                      selectedCity
                        ? selectedCity.population.toLocaleString()
                        : "N/A"
                    }
                  />
                  <KeyValuePair
                    label="Region"
                    value={
                      selectedCity ? (
                        <Badge
                          style={{
                            backgroundColor: `${
                              regionColors[selectedCity.region || ""]
                            }20`,
                            color: regionColors[selectedCity.region || ""],
                          }}
                        >
                          {selectedCity.region
                            ?.split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Badge>
                      ) : (
                        "N/A"
                      )
                    }
                  />
                </Stack>

                {/* Right column - Shipping connections */}
                <Stack gap="xs" style={{ flex: 1 }}>
                  <KeyValuePair
                    label="Deliver to"
                    value={
                      selectedCity && diagram
                        ? Array.from(diagram.links)
                            .filter((link) => {
                              const goLink = link as go.Link;
                              return (
                                goLink.data.from === selectedCity.key ||
                                goLink.data.to === selectedCity.key
                              );
                            })
                            .map((link, idx) => {
                              const goLink = link as go.Link;
                              const isFrom =
                                goLink.data.from === selectedCity.key;
                              const counterKey = isFrom
                                ? goLink.data.to
                                : goLink.data.from;
                              const counterNode =
                                diagram.findNodeForKey(counterKey);
                              const counterCity =
                                counterNode?.data?.city || "Unknown";
                              const counterCountry =
                                counterNode?.data?.country || "Unknown";
                              const counterRegion =
                                counterNode?.data?.region || "unknown";
                              return (
                                <Text key={idx} span size="sm">
                                  {counterCity}, {counterCountry}{" "}
                                  <Badge
                                    size="sm"
                                    style={{
                                      backgroundColor: `${regionColors[counterRegion]}20`,
                                      color: regionColors[counterRegion],
                                      verticalAlign: "middle",
                                      marginLeft: 4,
                                    }}
                                  >
                                    {counterRegion
                                      ?.split("-")
                                      .map(
                                        (word: string) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1)
                                      )
                                      .join(" ")}
                                  </Badge>
                                </Text>
                              );
                            })
                        : "N/A"
                    }
                  />
                  <KeyValuePair
                    label="Shipping method"
                    value={
                      selectedCity && diagram
                        ? Array.from(diagram.links)
                            .filter((link) => {
                              const goLink = link as go.Link;
                              return (
                                goLink.data.from === selectedCity.key ||
                                goLink.data.to === selectedCity.key
                              );
                            })
                            .map((link, idx, arr) => {
                              const goLink = link as go.Link;
                              const methodLabels = {
                                truck: "Truck",
                                airplane: "Air",
                                "airplane-express": "Express Air",
                                ship: "Ship",
                                "ship-express": "Express Ship",
                              };
                              const method = goLink.data
                                .category as keyof typeof methodLabels;
                              return (
                                <span key={idx}>
                                  {methodLabels[method] || method}
                                  {idx < arr.length - 1 ? ", " : ""}
                                </span>
                              );
                            })
                        : "N/A"
                    }
                  />
                </Stack>
              </Group>

              {/* Size Controls Section */}
              <Stack
                gap="md"
                mt="md"
                pt="md"
                style={{ borderTop: "1px solid #4a4a4a" }}
              >
                <Group justify="space-between" mb="xs">
                  <Title order={5}>Node Size</Title>
                  <Text size="xs">Draggable after node selected</Text>
                </Group>
                <Group align="center" gap="md">
                  <Box
                    style={{
                      width: "100%",
                      height: 10,
                      backgroundColor: "#2a2a2a",
                      borderRadius: 5,
                      position: "relative",
                      cursor: selectedCity ? "pointer" : "not-allowed",
                      opacity: selectedCity ? 1 : 0.5,
                    }}
                    onMouseDown={(e) => {
                      if (!selectedCity) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = Math.max(
                        0,
                        Math.min(1, x / rect.width)
                      );
                      const newSize = 0.5 + percentage * 1.5;
                      setSelectedNodeSize(newSize);
                      handleNodeSizeChange(newSize);
                    }}
                  >
                    <Box
                      style={{
                        width: `${((selectedNodeSize - 0.5) / 1.5) * 100}%`,
                        height: "100%",
                        backgroundColor: selectedCity ? "#60A5FA" : "#6b7280",
                        borderRadius: 5,
                        transition: "width 0.1s",
                      }}
                    />
                    <Box
                      style={{
                        position: "absolute",
                        left: `${((selectedNodeSize - 0.5) / 1.5) * 100}%`,
                        top: "50%",
                        transform: `translate(-50%, -50%)`,
                        width: 20,
                        height: 20,
                        backgroundColor: "white",
                        borderRadius: "50%",
                        border: `2px solid ${
                          selectedCity ? "#60A5FA" : "#6b7280"
                        }`,
                        cursor: selectedCity ? "grab" : "not-allowed",
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => {
                        if (!selectedCity) return;
                        e.stopPropagation();
                        const parentElement = e.currentTarget.parentElement;
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const rect = parentElement?.getBoundingClientRect();
                          if (rect) {
                            const x = moveEvent.clientX - rect.left;
                            const percentage = Math.max(
                              0,
                              Math.min(1, x / rect.width)
                            );
                            const newSize = 0.5 + percentage * 1.5; // 0.5x to 2x
                            setSelectedNodeSize(newSize);
                            handleNodeSizeChange(newSize);
                          }
                        };
                        const handleMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp
                          );
                        };
                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    />
                  </Box>
                  <Text size="xs" style={{ minWidth: 50 }}>
                    {selectedNodeSize.toFixed(1)}x
                  </Text>
                </Group>
              </Stack>
            </Card>

            {/* Link controls card */}
            <Paper
              p="sm"
              radius="md"
              bg="dark.6"
              withBorder
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Group justify="space-between" mb="sm">
                <Title order={5}>Link Controls</Title>
                <Switch
                  checked={showLinks}
                  onChange={() => handleToggleLinks()}
                  label={showLinks ? "Links Visible" : "Links Hidden"}
                  onLabel="ON"
                  offLabel="OFF"
                />
              </Group>
              <Group align="center" gap="md" mt="md" mb="sm">
                <Text size="sm">Opacity:</Text>
                <Box
                  style={{
                    width: "70%",
                    height: 10,
                    backgroundColor: "#2a2a2a",
                    borderRadius: 5,
                    position: "relative",
                    cursor: "pointer",
                  }}
                  onMouseDown={(e) => {
                    // Handle drag logic here
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = Math.max(0, Math.min(1, x / rect.width));
                    handleLinkOpacityChange(percentage);
                  }}
                >
                  <Box
                    style={{
                      width: `${linkOpacity * 100}%`,
                      height: "100%",
                      backgroundColor: "#6b7280",
                      borderRadius: 5,
                      transition: "width 0.1s",
                    }}
                  />
                  <Box
                    style={{
                      position: "absolute",
                      left: `${linkOpacity * 100}%`,
                      top: "50%",
                      transform: `translate(-50%, -50%)`,
                      width: 20,
                      height: 20,
                      backgroundColor: "white",
                      borderRadius: "50%",
                      border: "2px solid #6b7280",
                      cursor: "grab",
                      zIndex: 10,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      // Store the parent element reference
                      const parentElement = e.currentTarget.parentElement;
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = parentElement?.getBoundingClientRect();
                        if (rect) {
                          const x = moveEvent.clientX - rect.left;
                          const percentage = Math.max(
                            0,
                            Math.min(1, x / rect.width)
                          );
                          handleLinkOpacityChange(percentage);
                        }
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener(
                          "mousemove",
                          handleMouseMove
                        );
                        document.removeEventListener("mouseup", handleMouseUp);
                      };
                      document.addEventListener("mousemove", handleMouseMove);
                      document.addEventListener("mouseup", handleMouseUp);
                    }}
                  />
                </Box>
              </Group>

              {/* Divider between Link Controls and Shipping Methods */}
              <Box
                mt="md"
                mb="md"
                style={{
                  height: 1,
                  backgroundColor: "#4a4a4a",
                  width: "100%",
                }}
              />

              <Group justify="space-between" mb="xs">
                <Title order={5}>Shipping Methods</Title>
                <Text size="sm">Click to filter by method</Text>
              </Group>
              <Group gap="lg" wrap="wrap">
                <Group
                  gap="xs"
                  style={{
                    cursor: "pointer",
                    opacity: selectedShippingMethod === "truck" ? 1 : 0.6,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => handleShippingMethodClick("truck")}
                >
                  <Box w={32} h={2} bg="pink" />
                  <Text size="sm">Truck (Same Country)</Text>
                </Group>
                <Group
                  gap="xs"
                  style={{
                    cursor: "pointer",
                    opacity: selectedShippingMethod === "airplane" ? 1 : 0.6,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => handleShippingMethodClick("airplane")}
                >
                  <Box
                    w={32}
                    h={2}
                    bg="brown"
                    style={{ borderTop: "2px dashed brown" }}
                  />
                  <Text size="sm">Air (Same Continent)</Text>
                </Group>
                <Group
                  gap="xs"
                  style={{
                    cursor: "pointer",
                    opacity:
                      selectedShippingMethod === "airplane-express" ? 1 : 0.6,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => handleShippingMethodClick("airplane-express")}
                >
                  <Box
                    w={32}
                    h={2}
                    bg="yellow"
                    style={{ borderTop: "2px dashed yellow" }}
                  />
                  <Text size="sm">Express Air</Text>
                </Group>
                <Group
                  gap="xs"
                  style={{
                    cursor: "pointer",
                    opacity: selectedShippingMethod === "ship" ? 1 : 0.6,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => handleShippingMethodClick("ship")}
                >
                  <Box
                    w={32}
                    h={2}
                    bg="blue"
                    style={{ borderTop: "2px dotted blue" }}
                  />
                  <Text size="sm">Ship (Cross Ocean)</Text>
                </Group>
                <Group
                  gap="xs"
                  style={{
                    cursor: "pointer",
                    opacity:
                      selectedShippingMethod === "ship-express" ? 1 : 0.6,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() => handleShippingMethodClick("ship-express")}
                >
                  <Box
                    w={32}
                    h={2}
                    bg="gray"
                    style={{ borderTop: "2px dashed gray" }}
                  />
                  <Text size="sm">Express Ship (30%)</Text>
                </Group>
              </Group>
              {/* Add spacer to fill remaining height */}
              <div style={{ flex: 1 }} />

              {/* Search and Filter Controls */}
              <Stack
                gap="md"
                mt="md"
                pt="md"
                style={{ borderTop: "1px solid #4a4a4a" }}
              >
                <Title order={5}>Search & Filter</Title>
                <Group gap="md" wrap="wrap">
                  <Autocomplete
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(value) => {
                      // Extract just the city name if it includes country
                      const cityName = value.includes(",")
                        ? value.split(",")[0].trim()
                        : value;
                      handleSearch(cityName);
                    }}
                    leftSection={<IconSearch size={16} />}
                    w={200}
                    data={
                      searchTerm.length > 0
                        ? allCities
                            .filter((city) =>
                              city.city
                                .toLowerCase()
                                .startsWith(searchTerm.toLowerCase())
                            )
                            .slice(0, 10)
                            .map((city) => `${city.city}, ${city.country}`)
                        : []
                    }
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
                    w={180}
                  />
                </Group>
              </Stack>
            </Paper>
          </Group>
        </Paper>
      </Box>

      <Box style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        <Group justify="space-between" align="center" mb="xs">
          <SaveStateIndicator />
          <Group gap="xs">
            <Button
              leftSection={<IconZoomIn size={14} />}
              onClick={handleZoomIn}
              variant="light"
              size="sm"
            >
              Zoom In
            </Button>
            <Button
              leftSection={<IconZoomOut size={14} />}
              onClick={handleZoomOut}
              variant="light"
              size="sm"
            >
              Zoom Out
            </Button>
            <Button
              leftSection={<IconRefresh size={14} />}
              onClick={handleResetZoom}
              variant="light"
              color="gray"
              size="sm"
            >
              Reset
            </Button>
            <Button
              leftSection={<IconMaximize size={14} />}
              onClick={handleFitToView}
              variant="light"
              color="green"
              size="sm"
            >
              Fit to View
            </Button>
          </Group>
        </Group>
      </Box>
      <Box
        ref={diagramRef}
        bg="dark.9"
        style={{ width: "100%", maxWidth: 1200, height: 600, margin: "0 auto" }}
      />

      <Menu
        opened={contextMenu.visible}
        onChange={(opened) => {
          if (!opened) {
            setContextMenu({
              visible: false,
              x: 0,
              y: 0,
              type: null,
              target: null,
            });
          }
        }}
        position="bottom-start"
        withinPortal={false}
        styles={{
          dropdown: {
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
          },
        }}
      >
        <Menu.Target>
          <div
            style={{
              position: "fixed",
              left: contextMenu.x,
              top: contextMenu.y,
              width: 1,
              height: 1,
            }}
          />
        </Menu.Target>
        <Menu.Dropdown>
          {contextMenu.type === "node" && contextMenu.target && (
            <Menu.Item onClick={handleDoubleFontSize}>
              {(contextMenu.target as go.Node).data.city}
            </Menu.Item>
          )}
          {contextMenu.type === "link" && (
            <Menu.Item onClick={handleHalveFontSize}>Halve Font Size</Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
}
