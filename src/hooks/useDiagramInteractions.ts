import { useEffect } from "react";
import * as go from "gojs";
import {
  useDiagramStore,
  useContextMenuStore,
  useInteractionStore,
} from "../stores";
import type { City } from "../types/gojs-types";

export const useDiagramInteractions = () => {
  const { diagram, setSelectedCity } = useDiagramStore();
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
  }, [diagram, isLinkingEnabled]);

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
