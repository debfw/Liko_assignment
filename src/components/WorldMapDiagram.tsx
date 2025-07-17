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
  IconHandMove,
  IconLink,
  IconUnlink,
} from "@tabler/icons-react";
import { convertLatLngToDiagramCoords } from "@/utils/coordinates";
import { detectRegion, regionColors, getNodeSize } from "@/utils/regions";
import { createShippingLinks } from "@/utils/shipping";
import type { GoJSCityNodeData } from "../types/gojs-types";
import { SaveStateIndicator } from "./SaveStateIndicator";
import { SearchAndFilter } from "./SearchAndFilter";
import { LinkControls } from "./LinkControls";
import { NodeDetails } from "./NodeDetails";
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
import { useTestStore } from "../stores/testStore";

export default function WorldMapDiagram() {
  const diagramRef = useRef<HTMLDivElement>(null);

  // Test store
  const { testValue, setTestValue } = useTestStore();

  // Remove Zustand for selectedCity and node size
  // Local state for selected city and node size
  const [selectedCity, setSelectedCity] = useState<GoJSCityNodeData | null>(
    null
  );
  const [nodeSize, setNodeSize] = useState<number>(1);

  // Diagram store (for diagram instance and selectedLink only)
  const { diagram, selectedLink, setDiagram, setSelectedLink } =
    useDiagramStore();

  // Filter store
  const {
    searchTerm,
    selectedShippingMethod,
    allCities,
    setSearchTerm,
    setSelectedShippingMethod,
    setAllCities,
  } = useFilterStore();

  // UI Controls store
  const {
    showLinks,
    linkOpacity,
    selectedLinkThickness,
    toggleLinks,
    setShowLinks,
    setLinkOpacity,
    setSelectedNodeSize,
    setSelectedLinkThickness,
  } = useUIControlsStore();

  // Context Menu store
  const {
    visible: contextMenuVisible,
    x: contextMenuX,
    y: contextMenuY,
    type: contextMenuType,
    target: contextMenuTarget,
    showContextMenu,
    hideContextMenu,
  } = useContextMenuStore();

  // Interaction store
  const {
    isDraggingEnabled,
    isLinkingEnabled,
    isRelinkingEnabled,
    isResizing,
    resizeTarget,
    resizeMouseStartX,
    setDraggingEnabled,
    setLinkingEnabled,
    setRelinkingEnabled,
    startResize,
    stopResize,
  } = useInteractionStore();

  // Save state store
  const { triggerSave } = useSaveStateStore();

  // Local state for resize functionality (complex object not suitable for store)
  const [resizeState, setResizeState] = useState<{
    startSize?: number;
    startFont?: string;
  }>({
    startSize: undefined,
    startFont: undefined,
  });

  const loadCityData = useCallback(
    async (diagram: go.Diagram) => {
      try {
        const response = await fetch("/worldcities.json");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();

        if (!text.trim()) {
          throw new Error("Empty response received");
        }

        const cities: GoJSCityNodeData[] = JSON.parse(text);

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
        console.error("Error details:", {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack,
        });
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
      "draggingTool.isEnabled": false,
      "linkingTool.isEnabled": false,
      "relinkingTool.isEnabled": true,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(80, 80),
      initialAutoScale: go.Diagram.Uniform,
      contentAlignment: go.Spot.Center,
      padding: 50,
      fixedBounds: new go.Rect(0, 0, 1600, 800),
      model: new go.GraphLinksModel(),
    });

    // Configure linking tool
    myDiagram.toolManager.linkingTool.temporaryLink = $(
      go.Link,
      {
        routing: go.Link.Normal,
        curve: go.Link.Bezier,
        layerName: "Tool",
      },
      $(go.Shape, {
        stroke: "#FF69B4",
        strokeWidth: 2,
        strokeDashArray: [4, 2],
      })
    );

    // Configure relinking tool
    myDiagram.toolManager.relinkingTool.temporaryLink =
      myDiagram.toolManager.linkingTool.temporaryLink;

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
        fromLinkable: true,
        toLinkable: true,
        fromLinkableDuplicates: false,
        toLinkableDuplicates: false,
        contextClick: (e, node) => {
          if (e.event) {
            e.event.preventDefault();
            const goNode = node as go.Node;
            const rect = myDiagram.div?.getBoundingClientRect();
            if (rect) {
              showContextMenu({
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
              startResize(goNode, mouseEvent.clientX);
              setResizeState({ startSize: shape.width });
            }
          }

          // Create a completely clean object for state storage
          const cityData = {
            key: Number(data.key || data.id),
            id: Number(data.id),
            city: String(data.city),
            city_ascii: String(data.city_ascii || data.city),
            country: String(data.country),
            iso2: String(data.iso2 || ""),
            iso3: String(data.iso3 || ""),
            admin_name: String(data.admin_name || ""),
            lat: Number(data.lat),
            lng: Number(data.lng),
            population: Number(data.population || 0),
            region: String(data.region || ""),
            color: String(data.color || "#000"),
            size: Number(data.size || 10),
            location: data.location
              ? {
                  x: Number(data.location.x),
                  y: Number(data.location.y),
                }
              : null,
          };

          setSelectedCity({ ...cityData });
          triggerSave();

          // Update node size slider to show current node's size
          const shape = goNode.findObject("SHAPE") as go.Shape;
          const label = goNode.findObject("LABEL") as go.TextBlock;
          if (shape) {
            const baseSize = getNodeSize(data.population);
            const currentSize = shape.width;
            const sizeMultiplier = currentSize / baseSize;
            setNodeSize(Math.max(0.5, Math.min(2, sizeMultiplier)));
          }

          // Update font size if it's been modified
          if (label) {
            const currentFont = label.font;
            const fontSize = parseInt(
              currentFont.match(/(\d+)px/)?.[1] || "10"
            );
            const baseFontSize = 10;
            const fontMultiplier = fontSize / baseFontSize;
            // Update the node size to reflect the font size if it's been modified
            if (fontMultiplier !== 1) {
              setNodeSize(Math.max(0.5, Math.min(2, fontMultiplier)));
            }
          }

          // Clear link selection when node is selected
          setSelectedLink(null);

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
          const data = goNode.data as GoJSCityNodeData;

          // Only apply hover styling if this node is not the currently selected node
          if (shape && selectedCity && selectedCity.key === data.key) {
            // Keep selected node appearance
            shape.stroke = "#fff";
            shape.strokeWidth = 4;
            shape.scale = 1.5;
          } else if (shape) {
            // Apply hover styling only if not selected
            shape.scale = 1.5; // Larger scale for better visibility
            shape.stroke = "#ff4444"; // Red border on hover
            shape.strokeWidth = 3; // Thicker border
          }

          // Highlight connected links on hover only if links are visible
          if (showLinks) {
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

          // Only reset styling if this node is not the currently selected node
          if (shape && selectedCity && selectedCity.key === data.key) {
            // Keep selected node appearance
            shape.stroke = "#fff";
            shape.strokeWidth = 4;
            shape.scale = 1.5;
          } else if (shape) {
            // Reset to default only if not selected
            shape.scale = 1;
            shape.stroke = "#666"; // Reset to default stroke
            shape.strokeWidth = 2; // Reset to default width
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
          isResizing && resizeTarget instanceof go.Node
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
        relinkableFrom: true,
        relinkableTo: true,

        contextClick: (e, link) => {
          if (e.event) {
            e.event.preventDefault();
            const goLink = link as go.Link;
            const rect = myDiagram.div?.getBoundingClientRect();
            if (rect) {
              showContextMenu({
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

          // Select the link
          setSelectedLink(goLink);

          // Update slider to show selected link's current thickness
          const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
          if (linkShape) {
            const currentThickness = linkShape.strokeWidth - 2; // Subtract highlighting
            setSelectedLinkThickness(Math.max(1, currentThickness));
          }

          // Update font size if it's been modified
          const linkLabel = goLink.findObject("LABEL");
          if (linkLabel && linkLabel instanceof go.Panel) {
            const textBlock = linkLabel.elt(1);
            if (textBlock instanceof go.TextBlock) {
              const currentFont = textBlock.font;
              const fontSize = parseInt(
                currentFont.match(/(\d+)px/)?.[1] || "10"
              );
              const baseFontSize = 10;
              const fontMultiplier = fontSize / baseFontSize;
              // Update the thickness to reflect the font size if it's been modified
              if (fontMultiplier !== 1) {
                const thicknessFromFont = fontMultiplier * 2; // Reverse calculation
                setSelectedLinkThickness(
                  Math.max(1, Math.min(5, thicknessFromFont))
                );
              }
            }
          }

          // Clear node selection when link is selected
          setSelectedCity(null);

          if (label && label.visible) {
            // Start resize mode for link label only if Ctrl/Cmd key is held down
            if (
              e.event &&
              (e.event as MouseEvent).ctrlKey &&
              label instanceof go.Panel
            ) {
              const textBlock = label.elt(1);
              if (textBlock instanceof go.TextBlock) {
                startResize(goLink, (e.event as MouseEvent).clientX);
                setResizeState({ startFont: textBlock.font });
              }
            }
          } else if (label) {
            label.visible = true;
          }

          // Highlight selected link
          myDiagram.links.each((link) => {
            const linkItem = link as go.Link;
            const linkShape = linkItem.findObject("LINKSHAPE") as go.Shape;
            if (linkShape) {
              if (linkItem === goLink) {
                // Highlight selected link
                linkShape.strokeWidth = (linkItem.data.strokeWidth || 2) + 2;
                linkShape.stroke = "#fff";
              } else {
                // Reset other links
                linkShape.strokeWidth = linkItem.data.strokeWidth || 2;
                linkShape.stroke = linkItem.data.stroke || "#666";
              }
            }
          });

          // Clear node highlighting
          myDiagram.nodes.each((n) => {
            const nNode = n as go.Node;
            const shape = nNode.findObject("SHAPE") as go.Shape;
            if (shape) {
              shape.strokeWidth = 2;
              shape.stroke = "#666";
              shape.scale = 1;
            }
          });
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

    // Add diagram click handler to clear selections when clicking on empty space
    myDiagram.addDiagramListener("BackgroundSingleClicked", (e) => {
      // Check if the click was actually on the background by examining the event
      const point = myDiagram.lastInput.documentPoint;
      const part = myDiagram.findPartAt(point);

      // Only clear selection if we're clicking on the background (no part found)
      if (!part || part instanceof go.Node || part instanceof go.Link) {
        // Don't clear selection if clicking on a node or link
        return;
      }

      setSelectedCity(null);
      setSelectedLink(null);

      // Clear all highlighting
      myDiagram.nodes.each((n) => {
        const nNode = n as go.Node;
        const shape = nNode.findObject("SHAPE") as go.Shape;
        if (shape) {
          shape.strokeWidth = 2;
          shape.stroke = "#666";
          shape.scale = 1;
        }
      });

      myDiagram.links.each((link) => {
        const goLink = link as go.Link;
        const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
        if (linkShape) {
          linkShape.strokeWidth = goLink.data.strokeWidth || 2;
          linkShape.stroke = goLink.data.stroke || "#666";
        }
      });
    });

    // Handle link insertion and modification
    myDiagram.addDiagramListener("LinkDrawn", (e) => {
      const link = e.subject as go.Link;
      if (link && link.data) {
        // Set default properties for newly created links
        myDiagram.model.commit((m) => {
          m.set(link.data, "stroke", "#FF69B4");
          m.set(link.data, "strokeWidth", 2);
          m.set(link.data, "strokeDashArray", [4, 2]);
          m.set(link.data, "opacity", 1);
          m.set(link.data, "method", "custom");
          m.set(link.data, "label", "New Route");
          m.set(link.data, "isCustom", true);
        });
        triggerSave();
      }
    });

    myDiagram.addDiagramListener("LinkRelinked", (e) => {
      const link = e.subject as go.Link;
      if (link && link.data) {
        triggerSave();
      }
    });

    // Add context menu handler
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      hideContextMenu();
    };

    // Add resize handlers
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && myDiagram) {
        const deltaX = e.clientX - resizeMouseStartX;
        const distance = Math.abs(deltaX);
        const scaleFactor = 1 + (distance / 100) * (deltaX > 0 ? 1 : -1);

        if (resizeTarget instanceof go.Node) {
          const node = resizeTarget as go.Node;
          const shape = node.findObject("SHAPE") as go.Shape;
          if (shape && resizeState.startSize) {
            const newSize = Math.max(
              5,
              Math.min(50, resizeState.startSize * scaleFactor)
            );
            myDiagram.model.commit((m) => {
              m.set(node.data, "size", newSize);
            });
            triggerSave();
          }
        } else if (resizeTarget instanceof go.Link) {
          const link = resizeTarget as go.Link;
          const label = link.findObject("LABEL");
          if (label && label instanceof go.Panel) {
            const textBlock = label.elt(1);
            if (textBlock instanceof go.TextBlock && resizeState.startFont) {
              const currentSize = parseInt(
                resizeState.startFont.match(/(\d+)px/)?.[1] || "10"
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
      if (isResizing) {
        stopResize();
        setResizeState({ startSize: undefined, startFont: undefined });
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
  }, [showLinks]);

  // Update dragging tool when state changes
  useEffect(() => {
    if (diagram) {
      // Configure dragging tool
      diagram.toolManager.draggingTool.isEnabled = isDraggingEnabled;

      // Update movable property on all nodes
      diagram.startTransaction("toggle dragging");
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        goNode.movable = isDraggingEnabled;
      });
      diagram.commitTransaction("toggle dragging");
    }
  }, [diagram, isDraggingEnabled]);

  // Update linking tool when state changes
  useEffect(() => {
    if (diagram) {
      // Configure linking tool
      diagram.toolManager.linkingTool.isEnabled = isLinkingEnabled;

      // Update linkable properties on all nodes
      diagram.startTransaction("toggle linking");
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        goNode.fromLinkable = isLinkingEnabled;
        goNode.toLinkable = isLinkingEnabled;
        goNode.fromLinkableDuplicates = false; // Don't allow duplicate links
        goNode.toLinkableDuplicates = false;
      });
      diagram.commitTransaction("toggle linking");
    }
  }, [diagram, isLinkingEnabled]);

  // Maintain selected node styling on re-renders
  useEffect(() => {
    if (diagram && selectedCity) {
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        const shape = goNode.findObject("SHAPE") as go.Shape;
        if (shape) {
          if (goNode.data.key === selectedCity.key) {
            // Apply selected node styling
            shape.strokeWidth = 4;
            shape.stroke = "#fff";
            shape.scale = 1.5;
          } else {
            // Reset other nodes to default
            shape.strokeWidth = 2;
            shape.stroke = "#666";
            shape.scale = 1;
          }
        }
      });
    }
  }, [diagram, selectedCity]);

  // Apply node size changes when selectedNodeSize changes
  useEffect(() => {
    if (diagram && selectedCity && nodeSize) {
      handleNodeSizeChange(nodeSize);
    }
  }, [nodeSize, diagram, selectedCity]);

  // Apply search and region filters
  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("filter");
    diagram.nodes.each((node) => {
      const city = node.data;
      if (!city) return;

      let visible = true;

      // Apply search filter
      if (searchTerm) {
        visible =
          city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.country.toLowerCase().includes(searchTerm.toLowerCase());
      }

      node.visible = visible;
    });

    // Update links visibility based on connected nodes
    diagram.links.each((link) => {
      const nodesVisible =
        (link.fromNode?.visible ?? false) && (link.toNode?.visible ?? false);
      if (!nodesVisible) {
        link.visible = false;
      }
    });

    diagram.commitTransaction("filter");
  }, [diagram, searchTerm]);

  // Apply shipping method filter
  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("filter shipping");

    // First, update link visibility based on shipping method
    diagram.links.each((link) => {
      const linkData = link.data;
      if (!linkData) return;

      // Check if connected nodes are visible first (from previous filters)
      const nodesVisible =
        (link.fromNode?.visible ?? false) && (link.toNode?.visible ?? false);

      if (!nodesVisible) {
        link.visible = false;
        return;
      }

      // Apply shipping method filter
      if (selectedShippingMethod && selectedShippingMethod !== "All") {
        link.visible = linkData.method === selectedShippingMethod;
      } else {
        link.visible = showLinks;
      }
    });

    // Now, update node visibility: only show nodes that are connected by at least one visible link AND match the search filter
    diagram.nodes.each((node) => {
      const city = node.data;
      if (!city) return;

      // Check if node matches the search filter
      let matchesSearch = true;
      if (searchTerm) {
        matchesSearch =
          city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.country.toLowerCase().includes(searchTerm.toLowerCase());
      }

      // If a shipping method is selected, only show nodes connected by a visible link of that method
      if (selectedShippingMethod && selectedShippingMethod !== "All") {
        // Is this node connected by a visible link?
        let connectedByVisibleLink = false;
        diagram.links.each((link) => {
          if (
            link.visible &&
            (link.fromNode === node || link.toNode === node)
          ) {
            connectedByVisibleLink = true;
          }
        });
        node.visible = matchesSearch && connectedByVisibleLink;
      } else {
        // If no shipping method filter, just use the search filter
        node.visible = matchesSearch;
      }
    });

    diagram.commitTransaction("filter shipping");
  }, [diagram, selectedShippingMethod, showLinks, searchTerm]);

  // Apply link visibility
  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("link visibility");
    diagram.links.each((link) => {
      const path = link.path;
      if (path) {
        path.visible = showLinks;
      }
    });
    diagram.commitTransaction("link visibility");
  }, [diagram, showLinks]);

  // Apply link opacity
  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("link opacity");
    diagram.links.each((link) => {
      const path = link.path;
      if (path) {
        path.opacity = linkOpacity;
      }

      const label = link.findObject("LABEL");
      if (label) {
        label.opacity = linkOpacity;
      }
    });
    diagram.commitTransaction("link opacity");
  }, [diagram, linkOpacity]);

  // Apply link thickness
  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("link thickness");
    diagram.links.each((link) => {
      const path = link.path;
      if (path) {
        path.strokeWidth = selectedLinkThickness;
      }
    });
    diagram.commitTransaction("link thickness");
  }, [diagram, selectedLinkThickness]);

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
        goNode.visible = visible;
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

  // In the node click handler, update selectedCity and nodeSize state
  const handleNodeSizeChange = (sizeMultiplier: number) => {
    setNodeSize(sizeMultiplier);
    if (diagram && selectedCity) {
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        if (goNode.data.key === selectedCity.key) {
          const shape = goNode.findObject("SHAPE") as go.Shape;
          const label = goNode.findObject("LABEL") as go.TextBlock;

          if (shape) {
            const baseSize =
              goNode.data.size || getNodeSize(goNode.data.population);
            const newSize = baseSize * sizeMultiplier;
            shape.width = newSize;
            shape.height = newSize;
          }

          // Update font size proportionally
          if (label) {
            const baseFontSize = 10; // Base font size
            const newFontSize = Math.max(
              6,
              Math.min(24, baseFontSize * sizeMultiplier)
            );
            label.font = `bold ${newFontSize}px sans-serif`;
          }
        }
      });
      triggerSave();
    }
  };

  const handleLinkThicknessChange = (thickness: number) => {
    if (diagram && showLinks && selectedLink) {
      const linkShape = selectedLink.findObject("LINKSHAPE") as go.Shape;
      const label = selectedLink.findObject("LABEL");

      if (linkShape) {
        linkShape.strokeWidth = thickness;
        selectedLink.data.strokeWidth = thickness;

        // Update the visual highlighting for selected link
        if (selectedLink === selectedLink) {
          // This will always be true, but keeping for clarity
          linkShape.strokeWidth = thickness + 2; // Add 2 for highlighting
          linkShape.stroke = "#fff";
        }
      }

      // Update font size proportionally to link thickness
      if (label && label instanceof go.Panel) {
        const textBlock = label.elt(1);
        if (textBlock instanceof go.TextBlock) {
          const baseFontSize = 10; // Base font size
          const newFontSize = Math.max(
            6,
            Math.min(20, baseFontSize * (thickness / 2))
          ); // Scale with thickness
          textBlock.font = `${newFontSize}px sans-serif`;
        }
      }

      triggerSave();
    }
  };

  const handleDoubleFontSize = () => {
    if (contextMenuType === "node" && contextMenuTarget && diagram) {
      const node = contextMenuTarget as go.Node;
      const currentFontSize = node.data.fontSize || 12;
      const newFontSize = Math.min(currentFontSize * 2, 48); // Max 48px

      diagram.model.commit((m) => {
        m.set(node.data, "fontSize", newFontSize);
      });
      triggerSave();
    }
    hideContextMenu();
  };

  const handleHalveFontSize = () => {
    if (contextMenuType === "link" && contextMenuTarget && diagram) {
      const link = contextMenuTarget as go.Link;
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
    hideContextMenu();
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

  // Full reset handler
  const handleFullReset = async () => {
    setSelectedCity(null);
    setSelectedLink(null);
    setSearchTerm("");
    setShowLinks(true);
    setLinkOpacity(1);
    setNodeSize(1);
    setSelectedShippingMethod(null);
    setSelectedLinkThickness(2);
    setDraggingEnabled(false);
    setLinkingEnabled(false);
    setRelinkingEnabled(false);
    hideContextMenu();
    stopResize();
    setResizeState({ startSize: undefined, startFont: undefined });
    if (diagram) {
      await loadCityData(diagram);
      diagram.scale = 1;
      diagram.scrollToRect(diagram.documentBounds);
    }
  };

  const resetView = async () => {
    if (!diagram) return;

    // Clear current selections
    setSelectedCity(null);
    setSelectedLink(null);

    // Reset filters
    setSearchTerm("");
    setSelectedShippingMethod(null);

    // Reset UI controls
    setShowLinks(true);
    setLinkOpacity(0.7);
    setSelectedLinkThickness(3);
    setNodeSize(1);

    // Reset interaction states
    setDraggingEnabled(false);
    setLinkingEnabled(false);
    setRelinkingEnabled(false);

    // Hide context menu
    hideContextMenu();

    // Stop any resize operations
    stopResize();
    setResizeState({ startSize: undefined, startFont: undefined });

    // Reload city data and reset zoom
    await loadCityData(diagram);
    diagram.scale = 1;
    diagram.scrollToRect(diagram.documentBounds);
  };

  return (
    <Box className="w-full h-screen flex" bg="dark.8">
      {/* Left Sidebar */}
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

          {/* Node Details Section */}
          <Paper p="sm" radius="md" bg="dark.6" withBorder>
            <NodeDetails
              key={selectedCity?.key || "no-selection"}
              selectedCity={selectedCity}
              nodeSize={nodeSize}
              onNodeSizeChange={handleNodeSizeChange}
            />
          </Paper>

          {/* Link Controls Section */}
          <Paper p="md" radius="md" bg="dark.6" withBorder>
            <Title order={5} mb="sm">
              Link Controls
            </Title>
            <LinkControls
              selectedLinkData={
                selectedLink
                  ? {
                      from: selectedLink.data.from,
                      to: selectedLink.data.to,
                      method: selectedLink.data.method,
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
                    }
                  : undefined
              }
            />
          </Paper>

          {/* Search & Filter Section */}
          <Paper p="sm" radius="md" bg="dark.6" withBorder>
            <Title order={5} mb="sm">
              Search & Filter
            </Title>
            <SearchAndFilter />
          </Paper>
        </Stack>
      </Paper>

      {/* Main Content Area */}
      <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
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

        {/* Controls */}
        <Box p="md">
          <Group justify="space-between" align="center" mb="sm">
            <SaveStateIndicator />
            <ZoomControls onReset={resetView} />
          </Group>
        </Box>

        {/* Diagram */}
        <Box
          ref={diagramRef}
          bg="dark.9"
          style={{ flex: 1, margin: "0 20px 20px 20px" }}
        />
      </Box>

      <DiagramContextMenu />
    </Box>
  );
}
