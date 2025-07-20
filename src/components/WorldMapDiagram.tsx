"use client";

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import * as go from "gojs";
import { Title, Text, Group, Stack, Paper, Box } from "@mantine/core";

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
import { useDiagramInteractions } from "../hooks/useDiagramInteractions";

const WorldMapDiagram = memo(function WorldMapDiagram() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const { isRelinkingEnabled } = useInteractionStore();

  useDiagramInteractions();

  const [selectedCity, setSelectedCity] = useState<GoJSCityNodeData | null>(
    null
  );
  const [nodeSize, setNodeSize] = useState<number>(1);

  const { diagram, selectedLink, setDiagram, setSelectedLink } =
    useDiagramStore();

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

  const { isDraggingEnabled, isLinkingEnabled, setRelinkingEnabled } =
    useInteractionStore();

  const { triggerSave } = useSaveStateStore();

  // Memoize the loadCityData function to prevent unnecessary re-creations
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

        setAllCities(cities);

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
    [linkOpacity, setAllCities]
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
      "relinkingTool.isEnabled": isRelinkingEnabled,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(80, 80),
      initialAutoScale: go.Diagram.Uniform,
      contentAlignment: go.Spot.Center,
      padding: 50,
      fixedBounds: new go.Rect(0, 0, 1600, 800),
      model: new go.GraphLinksModel(),
    });

    myDiagram.toolManager.relinkingTool.toHandleArchetype = $(
      go.Shape,
      "Circle",
      {
        width: 12,
        height: 12,
        fill: "#228be6",
        stroke: "white",
        strokeWidth: 2,
        cursor: "pointer",
      }
    );

    myDiagram.toolManager.relinkingTool.fromHandleArchetype = $(
      go.Shape,
      "Circle",
      {
        width: 12,
        height: 12,
        fill: "#228be6",
        stroke: "white",
        strokeWidth: 2,
        cursor: "pointer",
      }
    );

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

    myDiagram.toolManager.relinkingTool.temporaryLink =
      myDiagram.toolManager.linkingTool.temporaryLink;

    myDiagram.toolManager.relinkingTool.portGravity = 30;

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

          const shape = goNode.findObject("SHAPE") as go.Shape;
          const label = goNode.findObject("LABEL") as go.TextBlock;
          if (shape) {
            const baseSize = getNodeSize(data.population);
            const currentSize = shape.width;
            const sizeMultiplier = currentSize / baseSize;
            setNodeSize(Math.max(0.5, Math.min(2.5, sizeMultiplier)));
          }

          if (label) {
            const currentFont = label.font;
            const fontSize = parseInt(
              currentFont.match(/(\d+)px/)?.[1] || "10"
            );
            const baseFontSize = 10;
            const fontMultiplier = fontSize / baseFontSize;
            if (fontMultiplier !== 1) {
              setNodeSize(Math.max(0.5, Math.min(2.5, fontMultiplier)));
            }
          }

          setSelectedLink(null);

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

          if (shape && selectedCity && selectedCity.key === data.key) {
            shape.stroke = "#fff";
            shape.strokeWidth = 4;
            shape.scale = 1.5;
          } else if (shape) {
            shape.scale = 1.5;
            shape.stroke = "#ff4444";
            shape.strokeWidth = 3;
          }

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

          if (shape && selectedCity && selectedCity.key === data.key) {
            shape.stroke = "#fff";
            shape.strokeWidth = 4;
            shape.scale = 1.5;
          } else if (shape) {
            shape.scale = 1;
            shape.stroke = "#666";
            shape.strokeWidth = 2;
          }

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
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
          fromLinkable: true,
          toLinkable: true,
          fromLinkableDuplicates: false,
          toLinkableDuplicates: false,
        },
        new go.Binding("fill", "color"),
        new go.Binding("width", "size"),
        new go.Binding("height", "size"),
        new go.Binding("cursor", "", () => "pointer")
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
        fromEndSegmentLength: 30,
        toEndSegmentLength: 30,

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

          if (isRelinkingEnabled && e.diagram) {
            const clickPt = e.diagram.lastInput.documentPoint;
            const fromPt = goLink.getPoint(0);
            const toPt = goLink.getPoint(goLink.pointsCount - 1);

            const HANDLE_THRESHOLD = 30;

            const nearFrom =
              clickPt.distanceSquaredPoint(fromPt) <=
              HANDLE_THRESHOLD * HANDLE_THRESHOLD;
            const nearTo =
              clickPt.distanceSquaredPoint(toPt) <=
              HANDLE_THRESHOLD * HANDLE_THRESHOLD;

            if (nearFrom || nearTo) {
              return;
            }
          }

          const label = goLink.findObject("LABEL");

          setSelectedLink(goLink);

          const linkShape = goLink.findObject("LINKSHAPE") as go.Shape;
          if (linkShape) {
            const currentThickness = linkShape.strokeWidth - 2; // Subtract highlighting
            setSelectedLinkThickness(Math.max(1, currentThickness));
          }

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

          setSelectedCity(null);

          if (label && label.visible) {
            if (
              e.event &&
              (e.event as MouseEvent).ctrlKey &&
              label instanceof go.Panel
            ) {
              const textBlock = label.elt(1);
              if (textBlock instanceof go.TextBlock) {
                // No resizing logic here
              }
            }
          } else if (label) {
            label.visible = true;
          }

          myDiagram.links.each((link) => {
            const linkItem = link as go.Link;
            const linkShape = linkItem.findObject("LINKSHAPE") as go.Shape;
            if (linkShape) {
              if (linkItem === goLink) {
                linkShape.strokeWidth = (linkItem.data.strokeWidth || 2) + 2;
                linkShape.stroke = "#fff";
              } else {
                linkShape.strokeWidth = linkItem.data.strokeWidth || 2;
                linkShape.stroke = linkItem.data.stroke || "#666";
              }
            }
          });

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

    myDiagram.linkTemplate.selectionAdornmentTemplate = $(
      go.Adornment,
      "Link",
      $(go.Shape, {
        isPanelMain: true,
        stroke: "#228be6",
        strokeWidth: 3,
      })
    );

    setDiagram(myDiagram);

    loadCityData(myDiagram);

    myDiagram.addDiagramListener("BackgroundSingleClicked", () => {
      const point = myDiagram.lastInput.documentPoint;
      const part = myDiagram.findPartAt(point);

      if (!part || part instanceof go.Node || part instanceof go.Link) {
        return;
      }

      setSelectedCity(null);
      setSelectedLink(null);

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

    myDiagram.addDiagramListener("LinkDrawn", (e) => {
      const link = e.subject as go.Link;
      if (link && link.data) {
        myDiagram.model.commit((m) => {
          m.set(link.data, "stroke", "#FF69B4");
          m.set(link.data, "strokeWidth", 2);
          m.set(link.data, "strokeDashArray", [4, 2]);
          m.set(link.data, "opacity", 1);
          m.set(link.data, "label", "New Route");
        });
        triggerSave();
      }
    });

    myDiagram.addDiagramListener("LinkRelinked", (e) => {
      console.log(">> LinkRelinked");
      const link = e.subject as go.Link;
      if (link && link.data) {
        console.log("[Event] LinkRelinked: ", link.data);

        const fromNode = link.fromNode;
        const toNode = link.toNode;

        if (fromNode && toNode) {
          const fromCity = fromNode.data.city;
          const toCity = toNode.data.city;
          const method = link.data.category || link.data.method || "ship";

          const messages = [
            `Route Updated! ${fromCity} → ${toCity} now connected via ${method}`,
            `New shipping lane established: ${fromCity} to ${toCity}`,
            `Trade route rerouted: ${fromCity} ↔ ${toCity}`,
            `Express delivery route changed: ${fromCity} → ${toCity}`,
            `Maritime connection updated: ${fromCity} → ${toCity}`,
            `Logistics network modified: ${fromCity} → ${toCity}`,
            `Supply chain rerouted: ${fromCity} → ${toCity}`,
            `Global trade link updated: ${fromCity} ↔ ${toCity}`,
            `Port connection changed: ${fromCity} → ${toCity}`,
            `Cargo route modified: ${fromCity} → ${toCity}`,
          ];

          const randomMessage =
            messages[Math.floor(Math.random() * messages.length)];
          alert(randomMessage);
        } else {
          alert("Shipping route successfully updated!");
        }

        triggerSave();
      }
    });

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      hideContextMenu();
    };

    document.addEventListener("contextmenu", handleContextMenu);

    myDiagram.toolManager.relinkingTool.canStart = function () {
      const canStart = go.RelinkingTool.prototype.canStart.call(this);
      if (canStart) {
        console.log("[RelinkingTool] Can start - handle found");
      }
      return canStart;
    };

    myDiagram.toolManager.relinkingTool.findTargetPort = function (toend) {
      const port = go.RelinkingTool.prototype.findTargetPort.call(this, toend);
      if (port) {
        console.log("[RelinkingTool] Found target port:", port);
        console.log("[RelinkingTool] Port's node:", port.part?.data);
      } else {
        console.log("[RelinkingTool] No target port found at cursor position");
      }
      return port;
    };
    myDiagram.toolManager.relinkingTool.isValidLink = function (
      fromnode,
      fromport,
      tonode,
      toport
    ) {
      if (!fromnode || !tonode || !fromport || !toport) {
        console.log("[RelinkingTool] isValidLink: missing nodes or ports");
        return false;
      }

      if (fromnode === tonode) {
        console.log("[RelinkingTool] isValidLink: same node - not allowed");
        return false;
      }

      const isRelinking = this.isActive && this.originalLink;

      if (isRelinking) {
        console.log(
          "[RelinkingTool] isValidLink: allowing relink between",
          fromnode.data,
          "and",
          tonode.data
        );
        return true;
      }

      const isValid = go.RelinkingTool.prototype.isValidLink.call(
        this,
        fromnode,
        fromport,
        tonode,
        toport
      );
      console.log("[RelinkingTool] isValidLink check:");
      console.log("  - fromnode:", fromnode?.data);
      console.log("  - tonode:", tonode?.data);
      console.log("  - isValid:", isValid);

      return isValid;
    };

    myDiagram.toolManager.relinkingTool.reconnectLink = function (
      existinglink,
      newnode,
      newport,
      toend
    ) {
      console.log("[RelinkingTool] reconnectLink called:");
      console.log("  - existinglink:", existinglink?.data);
      console.log("  - newnode:", newnode?.data);
      console.log("  - newport:", newport);
      console.log("  - toend:", toend);

      if (!existinglink || !newnode || !newport) {
        console.log(
          "[RelinkingTool] reconnectLink: missing required parameters"
        );
        return false;
      }

      if (this.diagram) {
        this.diagram.startTransaction("relink");

        try {
          this.diagram.model.commit((m) => {
            if (toend) {
              m.set(existinglink.data, "to", newnode.data.key);
            } else {
              m.set(existinglink.data, "from", newnode.data.key);
            }
          });

          this.diagram.commitTransaction("relink");
          console.log(
            "[RelinkingTool] reconnectLink: successfully removed old link and created new one"
          );
          return true;
        } catch (e) {
          console.error("[RelinkingTool] reconnectLink error:", e);
          this.diagram.rollbackTransaction();
          return false;
        }
      }

      const result = go.RelinkingTool.prototype.reconnectLink.call(
        this,
        existinglink,
        newnode,
        newport,
        toend
      );
      console.log("  - reconnect result:", result);

      return result;
    };

    myDiagram.toolManager.relinkingTool.doActivate = function () {
      console.log("[RelinkingTool] Activated");
      go.RelinkingTool.prototype.doActivate.call(this);
      if (this.originalLink && this.originalLink.data) {
        console.log("[RelinkingTool] Original link:", this.originalLink.data);
        console.log(
          "[RelinkingTool] From node:",
          this.originalLink.fromNode?.data
        );
        console.log("[RelinkingTool] To node:", this.originalLink.toNode?.data);
        console.log(
          "[RelinkingTool] Is reconnecting:",
          this.isForwards ? "to" : "from"
        );
      }
    };
    myDiagram.toolManager.relinkingTool.doMouseDown = function () {
      if (this.diagram && this.diagram.lastInput) {
        console.log(
          "[RelinkingTool] MouseDown at:",
          this.diagram.lastInput.documentPoint.toString()
        );
      }
      go.RelinkingTool.prototype.doMouseDown.call(this);
    };
    myDiagram.toolManager.relinkingTool.doMouseMove = function () {
      if (this.isActive && this.diagram && this.diagram.lastInput) {
        console.log(
          "[RelinkingTool] MouseMove at:",
          this.diagram.lastInput.documentPoint.toString()
        );
      }
      go.RelinkingTool.prototype.doMouseMove.call(this);
    };
    myDiagram.toolManager.relinkingTool.doMouseUp = function () {
      if (this.isActive && this.diagram && this.diagram.lastInput) {
        console.log(
          "[RelinkingTool] MouseUp at:",
          this.diagram.lastInput.documentPoint.toString()
        );

        console.log("[RelinkingTool] State before mouseUp:");
        console.log("  - targetPort:", this.targetPort);
        console.log("  - isValidLink:", this.isValidLink);
        console.log("  - temporaryToNode:", this.temporaryToNode?.data);
        console.log("  - temporaryFromNode:", this.temporaryFromNode?.data);

        if (this.targetPort && this.targetPort.part) {
          console.log(
            "[RelinkingTool] Target port found on node:",
            this.targetPort.part.data
          );
        } else {
          console.log("[RelinkingTool] No target port found");

          const obj = this.diagram.findObjectAt(
            this.diagram.lastInput.documentPoint,
            null,
            null
          );
          if (obj) {
            console.log("[RelinkingTool] Object under mouse:", obj);
            console.log("[RelinkingTool] Object's part:", obj.part);
            console.log("[RelinkingTool] Object's part data:", obj.part?.data);
          }
        }
      }
      go.RelinkingTool.prototype.doMouseUp.call(this);

      if (this.isActive) {
        console.log(
          "[RelinkingTool] Still active after mouseUp - relink failed"
        );
      } else {
        console.log(
          "[RelinkingTool] Deactivated after mouseUp - relink might have succeeded"
        );
      }
    };

    return () => {
      if (myDiagram) {
        myDiagram.clear();
        myDiagram.model = new go.GraphLinksModel();
        myDiagram.div = null;
      }
      document.removeEventListener("contextmenu", handleContextMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLinks, isRelinkingEnabled]);

  useEffect(() => {
    if (!diagram) return;
    diagram.toolManager.relinkingTool.isEnabled = isRelinkingEnabled;
    console.log("[Effect] Relinking tool enabled:", isRelinkingEnabled);
    diagram.startTransaction("toggle relinking");
    diagram.links.each((link) => {
      const goLink = link as go.Link;
      goLink.relinkableFrom = isRelinkingEnabled;
      goLink.relinkableTo = isRelinkingEnabled;
      console.log(
        "[Effect] Link",
        goLink.data && goLink.data.key,
        "relinkableFrom:",
        goLink.relinkableFrom,
        "relinkableTo:",
        goLink.relinkableTo
      );

      const handle = goLink.findObject("RelinkToHandle");
      if (handle) {
        console.log(
          "[Effect] Relinking handle visible for link",
          goLink.data && goLink.data.key
        );
      }
    });
    diagram.nodes.each((node) => {
      const goNode = node as go.Node;
      goNode.fromLinkable = isRelinkingEnabled;
      goNode.toLinkable = isRelinkingEnabled;

      const port = goNode.findObject("SHAPE");
      if (port && port instanceof go.Shape) {
        port.fromLinkable = isRelinkingEnabled;
        port.toLinkable = isRelinkingEnabled;
        console.log(
          "[Effect] Updated port on node",
          goNode.data && goNode.data.key,
          "port linkable:",
          port.fromLinkable
        );
      }

      console.log(
        "[Effect] Node",
        goNode.data && goNode.data.key,
        "fromLinkable:",
        goNode.fromLinkable,
        "toLinkable:",
        goNode.toLinkable
      );
    });
    diagram.commitTransaction("toggle relinking");
  }, [diagram, isRelinkingEnabled]);

  useEffect(() => {
    if (diagram) {
      diagram.toolManager.draggingTool.isEnabled = isDraggingEnabled;

      diagram.startTransaction("toggle dragging");
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        goNode.movable = isDraggingEnabled;
      });
      diagram.commitTransaction("toggle dragging");
    }
  }, [diagram, isDraggingEnabled]);

  useEffect(() => {
    if (diagram) {
      diagram.toolManager.linkingTool.isEnabled = isLinkingEnabled;

      diagram.startTransaction("toggle linking");
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        goNode.fromLinkable = isLinkingEnabled;
        goNode.toLinkable = isLinkingEnabled;
        goNode.fromLinkableDuplicates = false;
        goNode.toLinkableDuplicates = false;
      });
      diagram.commitTransaction("toggle linking");
    }
  }, [diagram, isLinkingEnabled]);

  useEffect(() => {
    if (diagram && selectedCity) {
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        const shape = goNode.findObject("SHAPE") as go.Shape;
        if (shape) {
          if (goNode.data.key === selectedCity.key) {
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
  }, [diagram, selectedCity]);
  useEffect(() => {
    if (diagram && selectedCity && nodeSize) {
      handleNodeSizeChange(nodeSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeSize, diagram, selectedCity]);

  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("filter");
    diagram.nodes.each((node) => {
      const city = node.data;
      if (!city) return;

      let visible = true;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const cityLower = city.city.toLowerCase();
        const countryLower = city.country.toLowerCase();

        const dropdownPattern = /^(.+?),\s*(.+?)\s*\(\d{1,3}(,\d{3})*\)$/;
        const dropdownMatch = searchTerm.match(dropdownPattern);

        if (dropdownMatch) {
          const [, searchCity, searchCountry] = dropdownMatch;
          visible =
            city.city.toLowerCase() === searchCity.toLowerCase().trim() &&
            city.country.toLowerCase() === searchCountry.toLowerCase().trim();
        } else if (searchTerm.includes(", ")) {
          const parts = searchTerm.split(", ");
          if (parts.length === 2) {
            const [searchCity, searchCountry] = parts;
            visible =
              cityLower === searchCity.toLowerCase().trim() &&
              countryLower === searchCountry.toLowerCase().trim();
          } else {
            visible =
              cityLower.includes(searchLower) ||
              countryLower.includes(searchLower);
          }
        } else {
          visible =
            cityLower.includes(searchLower) ||
            countryLower.includes(searchLower);
        }
      }

      node.visible = visible;
    });

    diagram.links.each((link) => {
      const nodesVisible =
        (link.fromNode?.visible ?? false) && (link.toNode?.visible ?? false);
      if (!nodesVisible) {
        link.visible = false;
      }
    });

    diagram.commitTransaction("filter");
  }, [diagram, searchTerm]);

  useEffect(() => {
    if (!diagram) return;

    diagram.startTransaction("filter shipping");

    diagram.nodes.each((node) => {
      const city = node.data;
      if (!city) return;

      let matchesSearch = true;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const cityLower = city.city.toLowerCase();
        const countryLower = city.country.toLowerCase();
        // const cityCountry = `${city.city}, ${city.country}`.toLowerCase(); // Not used

        const dropdownPattern = /^(.+?),\s*(.+?)\s*\(\d{1,3}(,\d{3})*\)$/;
        const dropdownMatch = searchTerm.match(dropdownPattern);

        if (dropdownMatch) {
          const [, searchCity, searchCountry] = dropdownMatch;
          matchesSearch =
            city.city.toLowerCase() === searchCity.toLowerCase().trim() &&
            city.country.toLowerCase() === searchCountry.toLowerCase().trim();
        } else if (searchTerm.includes(", ")) {
          const parts = searchTerm.split(", ");
          if (parts.length === 2) {
            const [searchCity, searchCountry] = parts;
            matchesSearch =
              cityLower === searchCity.toLowerCase().trim() &&
              countryLower === searchCountry.toLowerCase().trim();
          } else {
            matchesSearch =
              cityLower.includes(searchLower) ||
              countryLower.includes(searchLower);
          }
        } else {
          matchesSearch =
            cityLower.includes(searchLower) ||
            countryLower.includes(searchLower);
        }
      }

      node.visible = matchesSearch;
    });

    diagram.links.each((link) => {
      const linkData = link.data;
      if (!linkData) return;

      const nodesMatchSearch =
        (link.fromNode?.visible ?? false) && (link.toNode?.visible ?? false);

      if (!nodesMatchSearch) {
        link.visible = false;
        return;
      }

      if (selectedShippingMethod && selectedShippingMethod !== "All") {
        link.visible =
          linkData.category === selectedShippingMethod && showLinks;
      } else {
        link.visible = showLinks;
      }
    });

    if (selectedShippingMethod && selectedShippingMethod !== "All") {
      diagram.nodes.each((node) => {
        if (!node.visible) return;

        let hasVisibleLink = false;
        diagram.links.each((link) => {
          if (
            link.visible &&
            (link.fromNode === node || link.toNode === node)
          ) {
            hasVisibleLink = true;
          }
        });

        if (!hasVisibleLink) {
          node.visible = false;
        }
      });
    }

    diagram.commitTransaction("filter shipping");
  }, [diagram, selectedShippingMethod, showLinks, searchTerm]);

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
              const baseSize =
                goNode.data.size || getNodeSize(goNode.data.population);
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

    setSelectedCity(null);
    setSelectedLink(null);

    setSearchTerm("");
    setSelectedShippingMethod(null);

    setShowLinks(true);
    setLinkOpacity(0.7);
    setSelectedLinkThickness(3);
    setNodeSize(1);

    setRelinkingEnabled(false);

    hideContextMenu();

    await loadCityData(diagram);
    diagram.scale = 1;
    diagram.scrollToRect(diagram.documentBounds);
  }, [
    diagram,
    loadCityData,
    setSearchTerm,
    setSelectedShippingMethod,
    setShowLinks,
    setLinkOpacity,
    setSelectedLinkThickness,
    setRelinkingEnabled,
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
