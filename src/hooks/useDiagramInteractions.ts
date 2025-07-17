import { useEffect } from "react";
import * as go from "gojs";
import { useDiagramStore, useContextMenuStore, useInteractionStore } from "../stores";
import { City, ShippingLink } from "../types";

export const useDiagramInteractions = (
  onLinkCreated?: (fromCity: City, toCity: City) => void
) => {
  const { diagram, setSelectedCity, setSelectedLink } = useDiagramStore();
  const { showContextMenu } = useContextMenuStore();
  const { isDraggingEnabled, isLinkingEnabled, isRelinkingEnabled } = useInteractionStore();

  useEffect(() => {
    if (!diagram) return;

    // Update dragging tool based on state
    diagram.toolManager.draggingTool.isEnabled = isDraggingEnabled;
  }, [diagram, isDraggingEnabled]);

  useEffect(() => {
    if (!diagram) return;

    // Update linking tool based on state
    diagram.toolManager.linkingTool.isEnabled = isLinkingEnabled;
    
    if (isLinkingEnabled && onLinkCreated) {
      // Set up link creation callback
      diagram.toolManager.linkingTool.doActivate = function() {
        const tool = this as go.LinkingTool;
        go.LinkingTool.prototype.doActivate.call(tool);
      };

      diagram.addDiagramListener("LinkDrawn", (e: go.DiagramEvent) => {
        const link = e.subject as go.Link;
        if (link && link.fromNode && link.toNode) {
          const fromCity = link.fromNode.data as City;
          const toCity = link.toNode.data as City;
          
          // Remove the temporary link
          diagram.remove(link);
          
          // Call the callback to create the actual link
          onLinkCreated(fromCity, toCity);
        }
      });
    }

    return () => {
      diagram.removeDiagramListener("LinkDrawn");
    };
  }, [diagram, isLinkingEnabled, onLinkCreated]);

  useEffect(() => {
    if (!diagram) return;

    // Update relinking tool based on state
    diagram.toolManager.relinkingTool.isEnabled = isRelinkingEnabled;
  }, [diagram, isRelinkingEnabled]);

  const handleNodeClick = (city: City) => {
    setSelectedCity(city);
  };

  const handleLinkClick = (link: ShippingLink) => {
    setSelectedLink(link);
  };

  const handleContextMenu = (
    e: go.InputEvent, 
    type: "node" | "link" | "background", 
    target?: go.GraphObject
  ) => {
    const canvas = diagram?.div;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.event.clientX - rect.left;
    const y = e.event.clientY - rect.top;

    showContextMenu(x, y, type, target || null);
  };

  return {
    handleNodeClick,
    handleLinkClick,
    handleContextMenu
  };
};