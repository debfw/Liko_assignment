import { useEffect } from "react";
import * as go from "gojs";
import {
  useDiagramStore,
  useContextMenuStore,
  useInteractionStore,
} from "../stores";
import type { City } from "../types/gojs-types";

export const useDiagramInteractions = (
  onLinkCreated?: (fromCity: City, toCity: City) => void
) => {
  const { diagram, setSelectedCity, setSelectedLink } = useDiagramStore();
  const { showContextMenu } = useContextMenuStore();
  const { isDraggingEnabled, isLinkingEnabled, isRelinkingEnabled } =
    useInteractionStore();

  useEffect(() => {
    if (!diagram) return;

    diagram.toolManager.draggingTool.isEnabled = isDraggingEnabled;
  }, [diagram, isDraggingEnabled]);

  useEffect(() => {
    if (!diagram) return;

    diagram.toolManager.linkingTool.isEnabled = isLinkingEnabled;

    let linkDrawnHandler: ((e: go.DiagramEvent) => void) | null = null;

    if (isLinkingEnabled && onLinkCreated) {
      diagram.toolManager.linkingTool.doActivate = function () {
        const tool = this as go.LinkingTool;
        go.LinkingTool.prototype.doActivate.call(tool);
      };

      linkDrawnHandler = (e: go.DiagramEvent) => {
        const link = e.subject as go.Link;
        if (link && link.fromNode && link.toNode) {
          const fromCity = link.fromNode.data as City;
          const toCity = link.toNode.data as City;

          diagram.remove(link);

          onLinkCreated(fromCity, toCity);
        }
      };

      diagram.addDiagramListener("LinkDrawn", linkDrawnHandler);
    }

    return () => {
      if (linkDrawnHandler) {
        diagram.removeDiagramListener("LinkDrawn", linkDrawnHandler);
      }
    };
  }, [diagram, isLinkingEnabled, onLinkCreated]);

  useEffect(() => {
    if (!diagram) return;

    diagram.toolManager.relinkingTool.isEnabled = isRelinkingEnabled;
  }, [diagram, isRelinkingEnabled]);

  const handleNodeClick = (city: City) => {
    setSelectedCity(city);
  };

  const handleContextMenu = (
    e: go.InputEvent,
    type: "node" | "link" | "background",
    target?: go.GraphObject
  ) => {
    const canvas = diagram?.div;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!e.event) return;
    const mouseEvent = e.event as MouseEvent;
    const x = mouseEvent.clientX - rect.left;
    const y = mouseEvent.clientY - rect.top;

    if (type === "background") return;
    if (!target) return;
    if (type === "node" && !(target instanceof go.Node)) return;
    if (type === "link" && !(target instanceof go.Link)) return;
    showContextMenu({ x, y, type, target: target as go.Node | go.Link });
  };

  return {
    handleNodeClick,
    handleContextMenu,
  };
};
