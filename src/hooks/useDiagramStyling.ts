import { useEffect } from "react";
import * as go from "gojs";
import type { GoJSCityNodeData } from "../types/gojs-types";

export function useDiagramStyling(
  diagram: go.Diagram | null,
  showLinks: boolean,
  linkOpacity: number,
  selectedLinkThickness: number,
  selectedCity: GoJSCityNodeData | null,
  nodeSize: number
) {
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
      diagram.startTransaction("resize node");
      diagram.nodes.each((node) => {
        const goNode = node as go.Node;
        if (goNode.data.key === selectedCity.key) {
          const shape = goNode.findObject("SHAPE") as go.Shape;
          const label = goNode.findObject("LABEL") as go.TextBlock;

          if (shape) {
            const baseSize = goNode.data.size || 10;
            const newSize = baseSize * nodeSize;
            shape.width = newSize;
            shape.height = newSize;
          }

          if (label) {
            const baseFontSize = 10;
            const newFontSize = Math.max(
              6,
              Math.min(24, baseFontSize * nodeSize)
            );
            label.font = `bold ${newFontSize}px sans-serif`;
          }
        }
      });
      diagram.commitTransaction("resize node");
    }
  }, [diagram, selectedCity, nodeSize]);
}
