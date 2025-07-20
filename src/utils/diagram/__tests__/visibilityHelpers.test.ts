import * as go from "gojs";
import {
  updateNodeVisibility,
  updateLinkVisibility,
  showAllNodes,
  hideAllNodes,
  showAllLinks,
  hideAllLinks,
  filterNodesByRegion,
  filterNodesBySearch,
  filterLinksByMethod,
  getVisibleNodeCount,
  getVisibleLinkCount,
} from "../visibilityHelpers";
import { City, ShippingLink } from "../../../types";

// Mock gojs
jest.mock("gojs");

// Helper to create mock diagram
function createMockDiagram() {
  const nodes: ReturnType<typeof createMockNode>[] = [];
  const links: ReturnType<typeof createMockLink>[] = [];

  const mockDiagram = {
    nodes: {
      each: (callback: (node: ReturnType<typeof createMockNode>) => void) => {
        nodes.forEach(callback);
      },
    },
    links: {
      each: (callback: (link: ReturnType<typeof createMockLink>) => void) => {
        links.forEach(callback);
      },
    },
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    _nodes: nodes,
    _links: links,
  };

  return mockDiagram;
}

// Helper to create mock node
function createMockNode(data: City, visible = true) {
  return {
    data,
    visible,
    key: data.id,
  };
}

// Helper to create mock link
function createMockLink(
  data: ShippingLink,
  visible = true,
  fromNode?: ReturnType<typeof createMockNode>,
  toNode?: ReturnType<typeof createMockNode>
) {
  return {
    data,
    visible,
    fromNode,
    toNode,
    key: `${data.from}-${data.to}`,
  };
}

// Helper to create valid mock city
function createMockCity(overrides: Partial<City> = {}): City {
  return {
    id: 1,
    city: "Test City",
    city_ascii: "Test City",
    lat: 0,
    lng: 0,
    country: "Test Country",
    iso2: "TC",
    iso3: "TST",
    admin_name: "Test Admin",
    population: 100000,
    ...overrides,
  };
}

describe("visibilityHelpers", () => {
  let mockDiagram: ReturnType<typeof createMockDiagram>;

  beforeEach(() => {
    mockDiagram = createMockDiagram();
  });

  describe("updateNodeVisibility", () => {
    it("should update node visibility based on predicate", () => {
      const nodes = [
        createMockNode({
          id: 1,
          city: "New York",
          city_ascii: "New York",
          country: "USA",
          lat: 40.7128,
          lng: -74.006,
          iso2: "US",
          iso3: "USA",
          admin_name: "New York",
          population: 8000000,
        }),
        createMockNode({
          id: 2,
          city: "London",
          city_ascii: "London",
          country: "UK",
          lat: 51.5074,
          lng: -0.1278,
          iso2: "GB",
          iso3: "GBR",
          admin_name: "England",
          population: 9000000,
        }),
        createMockNode({
          id: 3,
          city: "Tokyo",
          city_ascii: "Tokyo",
          country: "Japan",
          lat: 35.6762,
          lng: 139.6503,
          iso2: "JP",
          iso3: "JPN",
          admin_name: "Tokyo",
          population: 14000000,
        }),
      ];
      mockDiagram._nodes.push(...nodes);

      // Filter to show only USA
      updateNodeVisibility(
        mockDiagram as unknown as go.Diagram,
        (city) => city.country === "USA"
      );

      expect(mockDiagram.startTransaction).toHaveBeenCalledWith(
        "update node visibility"
      );
      expect(nodes[0].visible).toBe(true); // NYC
      expect(nodes[1].visible).toBe(false); // London
      expect(nodes[2].visible).toBe(false); // Tokyo
      expect(mockDiagram.commitTransaction).toHaveBeenCalledWith(
        "update node visibility"
      );
    });

    it("should handle empty diagram", () => {
      updateNodeVisibility(mockDiagram as unknown as go.Diagram, () => true);

      expect(mockDiagram.startTransaction).toHaveBeenCalled();
      expect(mockDiagram.commitTransaction).toHaveBeenCalled();
    });

    it("should handle nodes without data", () => {
      const nodeWithoutData = {
        data: {
          city: "",
          city_ascii: "",
          lat: 0,
          lng: 0,
          country: "",
          iso2: "",
          iso3: "",
          admin_name: "",
          population: 0,
          id: -1,
        },
        visible: true,
        key: -1,
      };
      mockDiagram._nodes.push(nodeWithoutData);

      updateNodeVisibility(mockDiagram as unknown as go.Diagram, () => false);

      // Node without data should not be modified
      expect(nodeWithoutData.visible).toBe(false);
    });
  });

  describe("updateLinkVisibility", () => {
    it("should update link visibility based on predicate and node visibility", () => {
      const visibleNode = {
        data: {
          city: "",
          city_ascii: "",
          lat: 0,
          lng: 0,
          country: "",
          iso2: "",
          iso3: "",
          admin_name: "",
          population: 0,
          id: 1,
        },
        visible: true,
        key: 1,
      };
      const hiddenNode = {
        data: {
          city: "",
          city_ascii: "",
          lat: 0,
          lng: 0,
          country: "",
          iso2: "",
          iso3: "",
          admin_name: "",
          population: 0,
          id: 2,
        },
        visible: false,
        key: 2,
      };

      const links = [
        createMockLink(
          {
            from: 1,
            to: 2,
            category: "airplane",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          true,
          visibleNode,
          visibleNode
        ),
        createMockLink(
          {
            from: 2,
            to: 3,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          true,
          visibleNode,
          hiddenNode
        ),
        createMockLink(
          {
            from: 3,
            to: 4,
            category: "ship",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          true,
          visibleNode,
          visibleNode
        ),
      ];
      mockDiagram._links.push(...links);

      // Filter to show only airplane
      updateLinkVisibility(
        mockDiagram as unknown as go.Diagram,
        (link) => link.category === "airplane"
      );

      expect(links[0].visible).toBe(true); // airplane with both nodes visible
      expect(links[1].visible).toBe(false); // truck (wrong method) + hidden node
      expect(links[2].visible).toBe(false); // ship (wrong method)
    });

    it("should handle links without connected nodes", () => {
      const links = [
        createMockLink({
          from: 1,
          to: 2,
          category: "airplane",
          text: "",
          strokeDashArray: null,
          stroke: "",
          strokeWidth: 1,
        }),
      ];
      mockDiagram._links.push(...links);

      updateLinkVisibility(
        mockDiagram as unknown as go.Diagram,
        (link) => link.category === "airplane"
      );

      // Should still be visible if nodes are not defined
      expect(links[0].visible).toBe(true);
    });
  });

  describe("showAllNodes / hideAllNodes", () => {
    it("should show all nodes", () => {
      const nodes = [
        createMockNode(createMockCity({ id: 1, city: "NYC" }), false),
        createMockNode(createMockCity({ id: 2, city: "LON" }), false),
      ];
      mockDiagram._nodes.push(...nodes);

      showAllNodes(mockDiagram as unknown as go.Diagram);

      expect(nodes[0].visible).toBe(true);
      expect(nodes[1].visible).toBe(true);
    });

    it("should hide all nodes", () => {
      const nodes = [
        createMockNode(createMockCity({ id: 1, city: "NYC" }), true),
        createMockNode(createMockCity({ id: 2, city: "LON" }), true),
      ];
      mockDiagram._nodes.push(...nodes);

      hideAllNodes(mockDiagram as unknown as go.Diagram);

      expect(nodes[0].visible).toBe(false);
      expect(nodes[1].visible).toBe(false);
    });
  });

  describe("showAllLinks / hideAllLinks", () => {
    it("should show all links", () => {
      const links = [
        createMockLink(
          {
            from: 1,
            to: 2,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          false
        ),
        createMockLink(
          {
            from: 2,
            to: 3,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          false
        ),
      ];
      mockDiagram._links.push(...links);

      showAllLinks(mockDiagram as unknown as go.Diagram);

      expect(links[0].visible).toBe(true);
      expect(links[1].visible).toBe(true);
    });

    it("should hide all links", () => {
      const links = [
        createMockLink(
          {
            from: 1,
            to: 2,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          true
        ),
        createMockLink(
          {
            from: 2,
            to: 3,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          true
        ),
      ];
      mockDiagram._links.push(...links);

      hideAllLinks(mockDiagram as unknown as go.Diagram);

      expect(links[0].visible).toBe(false);
      expect(links[1].visible).toBe(false);
    });
  });

  describe("filterNodesByRegion", () => {
    it("should filter nodes by country", () => {
      const nodes = [
        createMockNode(createMockCity({ id: 1, city: "NYC", country: "USA" })),
        createMockNode(
          createMockCity({ id: 2, city: "Miami", country: "USA" })
        ),
        createMockNode(
          createMockCity({ id: 3, city: "London", country: "UK" })
        ),
        createMockNode(
          createMockCity({ id: 4, city: "Paris", country: "France" })
        ),
      ];
      mockDiagram._nodes.push(...nodes);

      filterNodesByRegion(mockDiagram as unknown as go.Diagram, "USA");

      expect(nodes[0].visible).toBe(true); // NYC
      expect(nodes[1].visible).toBe(true); // Miami
      expect(nodes[2].visible).toBe(false); // London
      expect(nodes[3].visible).toBe(false); // Paris
    });

    it('should show all nodes when region is "All"', () => {
      const nodes = [
        createMockNode(
          createMockCity({ id: 1, city: "NYC", country: "USA" }),
          false
        ),
        createMockNode(
          createMockCity({ id: 2, city: "London", country: "UK" }),
          false
        ),
      ];
      mockDiagram._nodes.push(...nodes);

      filterNodesByRegion(mockDiagram as unknown as go.Diagram, "All");

      expect(nodes[0].visible).toBe(true);
      expect(nodes[1].visible).toBe(true);
    });
  });

  describe("filterNodesBySearch", () => {
    it("should filter nodes by search term", () => {
      const nodes = [
        createMockNode(
          createMockCity({ id: 1, city: "New York", city_ascii: "New York" })
        ),
        createMockNode(
          createMockCity({
            id: 2,
            city: "New Orleans",
            city_ascii: "New Orleans",
          })
        ),
        createMockNode(
          createMockCity({ id: 3, city: "London", city_ascii: "London" })
        ),
        createMockNode(
          createMockCity({
            id: 4,
            city: "Los Angeles",
            city_ascii: "Los Angeles",
          })
        ),
      ];
      mockDiagram._nodes.push(...nodes);

      filterNodesBySearch(mockDiagram as unknown as go.Diagram, "new");

      expect(nodes[0].visible).toBe(true); // New York
      expect(nodes[1].visible).toBe(true); // New Orleans
      expect(nodes[2].visible).toBe(false); // London
      expect(nodes[3].visible).toBe(false); // Los Angeles
    });

    it("should be case insensitive", () => {
      const nodes = [
        createMockNode(
          createMockCity({ id: 1, city: "New York", city_ascii: "New York" })
        ),
        createMockNode(
          createMockCity({ id: 2, city: "London", city_ascii: "London" })
        ),
      ];
      mockDiagram._nodes.push(...nodes);

      filterNodesBySearch(mockDiagram as unknown as go.Diagram, "NEW YORK");

      expect(nodes[0].visible).toBe(true);
      expect(nodes[1].visible).toBe(false);
    });

    it("should show all nodes when search term is empty", () => {
      const nodes = [
        createMockNode(
          createMockCity({ id: 1, city: "New York", city_ascii: "New York" }),
          false
        ),
        createMockNode(
          createMockCity({ id: 2, city: "London", city_ascii: "London" }),
          false
        ),
      ];
      mockDiagram._nodes.push(...nodes);

      filterNodesBySearch(mockDiagram as unknown as go.Diagram, "");

      expect(nodes[0].visible).toBe(true);
      expect(nodes[1].visible).toBe(true);
    });
  });

  describe("filterLinksByMethod", () => {
    it("should filter links by shipping method", () => {
      const links = [
        createMockLink({
          from: 1,
          to: 2,
          category: "airplane",
          text: "",
          strokeDashArray: null,
          stroke: "",
          strokeWidth: 1,
        }),
        createMockLink({
          from: 2,
          to: 3,
          category: "truck",
          text: "",
          strokeDashArray: null,
          stroke: "",
          strokeWidth: 1,
        }),
        createMockLink({
          from: 3,
          to: 4,
          category: "ship",
          text: "",
          strokeDashArray: null,
          stroke: "",
          strokeWidth: 1,
        }),
        createMockLink({
          from: 4,
          to: 5,
          category: "airplane",
          text: "",
          strokeDashArray: null,
          stroke: "",
          strokeWidth: 1,
        }),
      ];
      mockDiagram._links.push(...links);

      filterLinksByMethod(mockDiagram as unknown as go.Diagram, "airplane");

      expect(links[0].visible).toBe(true); // airplane
      expect(links[1].visible).toBe(false); // truck
      expect(links[2].visible).toBe(false); // ship
      expect(links[3].visible).toBe(true); // airplane
    });

    it('should show all links when method is "All"', () => {
      const links = [
        createMockLink(
          {
            from: 1,
            to: 2,
            category: "airplane",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          false
        ),
        createMockLink(
          {
            from: 2,
            to: 3,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          false
        ),
      ];
      mockDiagram._links.push(...links);

      filterLinksByMethod(mockDiagram as unknown as go.Diagram, "All");

      expect(links[0].visible).toBe(true);
      expect(links[1].visible).toBe(true);
    });
  });

  describe("getVisibleNodeCount", () => {
    it("should count visible nodes", () => {
      const nodes = [
        createMockNode(createMockCity({ id: 1 }), true),
        createMockNode(createMockCity({ id: 2 }), false),
        createMockNode(createMockCity({ id: 3 }), true),
        createMockNode(createMockCity({ id: 4 }), false),
      ];
      mockDiagram._nodes.push(...nodes);

      expect(getVisibleNodeCount(mockDiagram as unknown as go.Diagram)).toBe(2);
    });

    it("should return 0 for empty diagram", () => {
      expect(getVisibleNodeCount(mockDiagram as unknown as go.Diagram)).toBe(0);
    });
  });

  describe("getVisibleLinkCount", () => {
    it("should count visible links", () => {
      const links = [
        createMockLink(
          {
            from: 1,
            to: 2,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          true
        ),
        createMockLink(
          {
            from: 2,
            to: 3,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          true
        ),
        createMockLink(
          {
            from: 3,
            to: 4,
            category: "truck",
            text: "",
            strokeDashArray: null,
            stroke: "",
            strokeWidth: 1,
          },
          false
        ),
      ];
      mockDiagram._links.push(...links);

      expect(getVisibleLinkCount(mockDiagram as unknown as go.Diagram)).toBe(2);
    });

    it("should return 0 for empty diagram", () => {
      expect(getVisibleLinkCount(mockDiagram as unknown as go.Diagram)).toBe(0);
    });
  });
});
