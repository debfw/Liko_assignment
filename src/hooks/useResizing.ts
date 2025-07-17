import { useEffect, useRef } from "react";
import * as go from "gojs";
import { City } from "../types";
import { useInteractionStore } from "../stores";

export interface ResizeState {
  isResizing: boolean;
  resizingNode: go.Node | null;
  startSize: go.Size | null;
  startPoint: go.Point | null;
}

export const useResizing = (diagram: go.Diagram | null) => {
  const { isResizing, resizingData, startResize, updateResize, stopResize } = useInteractionStore();
  const resizeStateRef = useRef<ResizeState>({
    isResizing: false,
    resizingNode: null,
    startSize: null,
    startPoint: null
  });

  useEffect(() => {
    if (!diagram) return;

    const handleMouseDown = (e: go.InputEvent) => {
      const part = diagram.findPartAt(e.documentPoint, true);
      if (part instanceof go.Node && e.event.shiftKey) {
        const node = part;
        const size = node.actualBounds.size;
        const point = e.documentPoint;
        
        resizeStateRef.current = {
          isResizing: true,
          resizingNode: node,
          startSize: size.copy(),
          startPoint: point.copy()
        };
        
        startResize({
          nodeKey: node.key as string,
          startSize: { width: size.width, height: size.height },
          startPoint: { x: point.x, y: point.y }
        });
        
        e.handled = true;
      }
    };

    const handleMouseMove = (e: go.InputEvent) => {
      const state = resizeStateRef.current;
      if (state.isResizing && state.resizingNode && state.startSize && state.startPoint) {
        const node = state.resizingNode;
        const currentPoint = e.documentPoint;
        const deltaX = currentPoint.x - state.startPoint.x;
        const deltaY = currentPoint.y - state.startPoint.y;
        
        const scale = Math.max(0.5, 1 + Math.max(deltaX, deltaY) / 100);
        const newWidth = state.startSize.width * scale;
        const newHeight = state.startSize.height * scale;
        
        diagram.startTransaction("resize node");
        node.width = newWidth;
        node.height = newHeight;
        
        // Update city data with new size
        const cityData = node.data as City;
        if (cityData) {
          diagram.model.setDataProperty(cityData, "width", newWidth);
          diagram.model.setDataProperty(cityData, "height", newHeight);
        }
        
        diagram.commitTransaction("resize node");
        
        updateResize({
          currentSize: { width: newWidth, height: newHeight }
        });
      }
    };

    const handleMouseUp = (e: go.InputEvent) => {
      if (resizeStateRef.current.isResizing) {
        resizeStateRef.current = {
          isResizing: false,
          resizingNode: null,
          startSize: null,
          startPoint: null
        };
        stopResize();
      }
    };

    diagram.addDiagramListener("BackgroundSingleClicked", handleMouseDown);
    diagram.addDiagramListener("BackgroundDoubleTapped", handleMouseMove);
    diagram.addDiagramListener("BackgroundContextClicked", handleMouseUp);

    // Also add listeners for mouse events
    const diagramDiv = diagram.div;
    if (diagramDiv) {
      diagramDiv.addEventListener("mousedown", (e) => {
        if (e.shiftKey) {
          const point = diagram.transformViewToDoc(new go.Point(e.offsetX, e.offsetY));
          const goEvent = new go.InputEvent();
          goEvent.documentPoint = point;
          goEvent.event = e;
          handleMouseDown(goEvent);
        }
      });

      diagramDiv.addEventListener("mousemove", (e) => {
        if (resizeStateRef.current.isResizing) {
          const point = diagram.transformViewToDoc(new go.Point(e.offsetX, e.offsetY));
          const goEvent = new go.InputEvent();
          goEvent.documentPoint = point;
          goEvent.event = e;
          handleMouseMove(goEvent);
        }
      });

      diagramDiv.addEventListener("mouseup", (e) => {
        if (resizeStateRef.current.isResizing) {
          const goEvent = new go.InputEvent();
          goEvent.event = e;
          handleMouseUp(goEvent);
        }
      });
    }

    return () => {
      diagram.removeDiagramListener("BackgroundSingleClicked");
      diagram.removeDiagramListener("BackgroundDoubleTapped");
      diagram.removeDiagramListener("BackgroundContextClicked");
    };
  }, [diagram, startResize, updateResize, stopResize]);

  return {
    isResizing,
    resizingData
  };
};