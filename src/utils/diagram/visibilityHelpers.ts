import * as go from "gojs";
import { City, ShippingLink } from "../../types";

export const updateNodeVisibility = (
  diagram: go.Diagram,
  predicate: (city: City) => boolean
) => {
  diagram.startTransaction("update node visibility");
  
  diagram.nodes.each((node) => {
    const city = node.data as City;
    if (city) {
      node.visible = predicate(city);
    }
  });
  
  diagram.commitTransaction("update node visibility");
};

export const updateLinkVisibility = (
  diagram: go.Diagram,
  predicate: (link: ShippingLink) => boolean
) => {
  diagram.startTransaction("update link visibility");
  
  diagram.links.each((link) => {
    const linkData = link.data as ShippingLink;
    if (linkData) {
      // Also check if connected nodes are visible
      const fromNodeVisible = link.fromNode?.visible ?? true;
      const toNodeVisible = link.toNode?.visible ?? true;
      
      link.visible = fromNodeVisible && toNodeVisible && predicate(linkData);
    }
  });
  
  diagram.commitTransaction("update link visibility");
};

export const showAllNodes = (diagram: go.Diagram) => {
  updateNodeVisibility(diagram, () => true);
};

export const showAllLinks = (diagram: go.Diagram) => {
  updateLinkVisibility(diagram, () => true);
};

export const hideAllNodes = (diagram: go.Diagram) => {
  updateNodeVisibility(diagram, () => false);
};

export const hideAllLinks = (diagram: go.Diagram) => {
  updateLinkVisibility(diagram, () => false);
};

export const filterNodesByRegion = (diagram: go.Diagram, region: string) => {
  if (region === "All") {
    showAllNodes(diagram);
  } else {
    updateNodeVisibility(diagram, (city) => city.country === region);
  }
};

export const filterNodesBySearch = (diagram: go.Diagram, searchTerm: string) => {
  if (!searchTerm) {
    showAllNodes(diagram);
  } else {
    const lowerSearch = searchTerm.toLowerCase();
    updateNodeVisibility(diagram, (city) => 
      city.name.toLowerCase().includes(lowerSearch)
    );
  }
};

export const filterLinksByMethod = (diagram: go.Diagram, method: string) => {
  if (method === "All") {
    updateLinkVisibility(diagram, () => true);
  } else {
    updateLinkVisibility(diagram, (link) => link.method === method);
  }
};

export const getVisibleNodeCount = (diagram: go.Diagram): number => {
  let count = 0;
  diagram.nodes.each((node) => {
    if (node.visible) count++;
  });
  return count;
};

export const getVisibleLinkCount = (diagram: go.Diagram): number => {
  let count = 0;
  diagram.links.each((link) => {
    if (link.visible) count++;
  });
  return count;
};