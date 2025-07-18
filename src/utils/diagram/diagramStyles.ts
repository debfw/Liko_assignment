import * as go from "gojs";
import { GoJSCityNodeData } from "../../types/gojs-types";

interface TooltipData extends Partial<GoJSCityNodeData> {
  name?: string;
  method?: string;
  capacity?: number;
  utilization?: number;
}

export const DIAGRAM_COLORS = {
  background: "#E6F3FF",
  grid: {
    line: "#CCE5FF",
    thick: "#99CCFF"
  },
  node: {
    fill: "#FFFFFF",
    stroke: "#0066CC",
    selectedStroke: "#FF6600",
    selectedStrokeWidth: 3
  },
  link: {
    stroke: "#0066CC",
    selectedStroke: "#FF6600",
    labelBackground: "rgba(255, 255, 255, 0.8)"
  }
};

export const createDiagramGrid = () => {
  const $ = go.GraphObject.make;
  
  return $(go.Panel, "Grid",
    { 
      name: "GRID",
      visible: true,
      gridCellSize: new go.Size(50, 50),
      gridOrigin: new go.Point(0, 0)
    },
    $(go.Shape, "LineH", {
      stroke: DIAGRAM_COLORS.grid.line,
      strokeWidth: 0.5
    }),
    $(go.Shape, "LineV", {
      stroke: DIAGRAM_COLORS.grid.line,
      strokeWidth: 0.5
    }),
    $(go.Shape, "LineH", {
      stroke: DIAGRAM_COLORS.grid.thick,
      strokeWidth: 2,
      interval: 5
    }),
    $(go.Shape, "LineV", {
      stroke: DIAGRAM_COLORS.grid.thick,
      strokeWidth: 2,
      interval: 5
    })
  );
};

export const getNodeStyle = (isSelected: boolean = false) => ({
  fill: DIAGRAM_COLORS.node.fill,
  stroke: isSelected ? DIAGRAM_COLORS.node.selectedStroke : DIAGRAM_COLORS.node.stroke,
  strokeWidth: isSelected ? DIAGRAM_COLORS.node.selectedStrokeWidth : 2,
  shadowColor: "rgba(0, 0, 0, 0.3)",
  shadowBlur: isSelected ? 10 : 5,
  shadowOffset: new go.Point(2, 2)
});

export const getLinkStyle = (isSelected: boolean = false) => ({
  stroke: isSelected ? DIAGRAM_COLORS.link.selectedStroke : DIAGRAM_COLORS.link.stroke,
  strokeWidth: isSelected ? 3 : 2
});

export const createTooltipTemplate = () => {
  const $ = go.GraphObject.make;
  
  return $(go.Adornment, "Auto",
    $(go.Shape, "RoundedRectangle", {
      fill: "rgba(255, 255, 255, 0.95)",
      stroke: "#666",
      strokeWidth: 1,
      shadowColor: "rgba(0, 0, 0, 0.3)",
      shadowBlur: 5,
      shadowOffset: new go.Point(2, 2)
    }),
    $(go.Panel, "Vertical",
      { margin: 8 },
      $(go.TextBlock, {
        font: "bold 14px sans-serif",
        margin: new go.Margin(0, 0, 4, 0)
      },
      new go.Binding("text", "", (data: TooltipData) => data.name || "Unknown")),
      $(go.TextBlock, {
        font: "12px sans-serif"
      },
      new go.Binding("text", "", (data: TooltipData) => {
        if (data.country) {
          return `Country: ${data.country}\\nPopulation: ${data.population?.toLocaleString() || "N/A"}`;
        } else if (data.method) {
          return `Method: ${data.method}\\nCapacity: ${data.capacity}\\nUtilization: ${data.utilization}%`;
        }
        return "";
      }))
    )
  );
};

export const createSelectionAdornment = () => {
  const $ = go.GraphObject.make;
  
  return $(go.Adornment, "Auto",
    $(go.Shape, "RoundedRectangle", {
      fill: null,
      stroke: DIAGRAM_COLORS.node.selectedStroke,
      strokeWidth: 3,
      strokeDashArray: [6, 3]
    }),
    $(go.Placeholder, { margin: 4 })
  );
};