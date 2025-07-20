import { useEffect } from "react";
import * as go from "gojs";
import { useDiagramStore } from "../stores";

export function useDiagramTools(
  diagram: go.Diagram | null,
  isDraggingEnabled: boolean,
  isLinkingEnabled: boolean,
  isRelinkingEnabled: boolean
) {
  useEffect(() => {
    if (!diagram) return;

    // Dragging tool
    diagram.toolManager.draggingTool.isEnabled = isDraggingEnabled;
    diagram.startTransaction("toggle dragging");
    diagram.nodes.each((node) => {
      const goNode = node as go.Node;
      goNode.movable = isDraggingEnabled;
    });
    diagram.commitTransaction("toggle dragging");
  }, [diagram, isDraggingEnabled]);

  useEffect(() => {
    if (!diagram) return;

    // Linking tool
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
  }, [diagram, isLinkingEnabled]);

  useEffect(() => {
    if (!diagram) return;

    // Relinking tool
    diagram.toolManager.relinkingTool.isEnabled = isRelinkingEnabled;
    diagram.startTransaction("toggle relinking");
    diagram.links.each((link) => {
      const goLink = link as go.Link;
      goLink.relinkableFrom = isRelinkingEnabled;
      goLink.relinkableTo = isRelinkingEnabled;
    });
    diagram.commitTransaction("toggle relinking");
  }, [diagram, isRelinkingEnabled]);
}
