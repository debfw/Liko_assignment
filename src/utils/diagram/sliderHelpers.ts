import * as go from "gojs";

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  label: string;
  unit?: string;
}

export const SLIDER_CONFIGS = {
  nodeSize: {
    min: 20,
    max: 150,
    step: 5,
    defaultValue: 80,
    label: "Node Size",
    unit: "px"
  } as SliderConfig,
  
  linkOpacity: {
    min: 10,
    max: 100,
    step: 5,
    defaultValue: 60,
    label: "Link Opacity",
    unit: "%"
  } as SliderConfig,
  
  linkThickness: {
    min: 1,
    max: 10,
    step: 0.5,
    defaultValue: 2,
    label: "Link Thickness",
    unit: "px"
  } as SliderConfig
};

export const updateAllNodeSizes = (diagram: go.Diagram, size: number) => {
  diagram.startTransaction("update node sizes");
  
  diagram.nodes.each((node) => {
    node.width = size;
    node.height = size;
    
    // Update the model data
    const nodeData = node.data;
    if (nodeData) {
      diagram.model.setDataProperty(nodeData, "width", size);
      diagram.model.setDataProperty(nodeData, "height", size);
    }
  });
  
  diagram.commitTransaction("update node sizes");
};

export const updateNodeSize = (diagram: go.Diagram, nodeKey: string, size: number) => {
  const node = diagram.findNodeForKey(nodeKey);
  if (node) {
    diagram.startTransaction("update node size");
    
    node.width = size;
    node.height = size;
    
    const nodeData = node.data;
    if (nodeData) {
      diagram.model.setDataProperty(nodeData, "width", size);
      diagram.model.setDataProperty(nodeData, "height", size);
    }
    
    diagram.commitTransaction("update node size");
  }
};

export const updateAllLinkOpacities = (diagram: go.Diagram, opacity: number) => {
  diagram.startTransaction("update link opacities");
  
  diagram.links.each((link) => {
    const path = link.path;
    if (path) {
      path.opacity = opacity / 100;
    }
    
    // Update link labels too
    const label = link.findObject("LABEL");
    if (label) {
      label.opacity = opacity / 100;
    }
  });
  
  diagram.commitTransaction("update link opacities");
};

export const updateAllLinkThicknesses = (diagram: go.Diagram, thickness: number) => {
  diagram.startTransaction("update link thicknesses");
  
  diagram.links.each((link) => {
    const path = link.path;
    if (path) {
      path.strokeWidth = thickness;
    }
  });
  
  diagram.commitTransaction("update link thicknesses");
};

export const formatSliderValue = (value: number, unit?: string): string => {
  if (unit) {
    return `${value}${unit}`;
  }
  return value.toString();
};

export const getSliderMarks = (config: SliderConfig): Array<{ value: number; label: string }> => {
  const marks = [];
  const range = config.max - config.min;
  const markCount = 5; // Show 5 marks including min and max
  
  for (let i = 0; i < markCount; i++) {
    const value = config.min + (range / (markCount - 1)) * i;
    marks.push({
      value: Math.round(value),
      label: formatSliderValue(Math.round(value), config.unit)
    });
  }
  
  return marks;
};