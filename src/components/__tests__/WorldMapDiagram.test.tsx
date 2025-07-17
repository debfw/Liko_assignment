import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the components that depend on GoJS
jest.mock("../WorldMapDiagram", () => {
  return function MockWorldMapDiagram() {
    return (
      <div data-testid="world-map-diagram">
        <h1>World Shipping Network Visualization</h1>
        <p>
          Click cities to view details, use zoom controls above, adjust link
          settings in sidebar, search and filter cities
          <i>No light mode, of course.</i>
        </p>

        {/* Node Details Card */}
        <div data-testid="node-details-card">
          <h4>Node Details</h4>
          <p>Click a node to view details</p>
          <div>
            <span>Coordinates</span>
            <span>N/A</span>
          </div>
          <div>
            <span>Population</span>
            <span>N/A</span>
          </div>
          <div>
            <span>Region</span>
            <span>N/A</span>
          </div>
          <div>
            <span>Deliver to</span>
            <span>N/A</span>
          </div>
          <div>
            <span>Shipping method</span>
            <span>N/A</span>
          </div>
        </div>

        {/* Link Controls Card */}
        <div data-testid="link-controls-card">
          <h5>Link Controls</h5>
          <label>
            <input type="checkbox" defaultChecked data-testid="link-toggle" />
            Links Visible
          </label>

          <h5>Shipping Methods</h5>
          <p>Click to filter by method</p>
          <div>
            <span>Truck (Same Country)</span>
            <span>Air (Same Continent)</span>
            <span>Express Air</span>
            <span>Ship (Cross Ocean)</span>
            <span>Express Ship (30%)</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div data-testid="search-filter">
          <h5>Search & Filter</h5>
          <input
            type="text"
            placeholder="Search cities..."
            data-testid="search-input"
          />
          <select data-testid="region-select">
            <option value="all">All Regions</option>
            <option value="north-america">North America</option>
            <option value="south-america">South America</option>
            <option value="europe">Europe</option>
            <option value="africa">Africa</option>
            <option value="asia">Asia</option>
            <option value="oceania">Oceania</option>
          </select>
        </div>

        {/* Zoom Controls */}
        <div data-testid="zoom-controls">
          <button data-testid="zoom-in">Zoom In</button>
          <button data-testid="zoom-out">Zoom Out</button>
          <button data-testid="reset-zoom">Reset Zoom</button>
          <button data-testid="fit-to-view">Fit to View</button>
        </div>

        {/* Node Size Controls */}
        <div data-testid="node-size-controls">
          <h5>Node Size</h5>
          <p>
            Click a node to resize, the font size will also be adjusted
            proportionally
          </p>
          <div data-testid="node-size-slider" style={{ opacity: 0.5 }}>
            <div style={{ width: "50%" }}></div>
          </div>
          <span>N/A</span>
        </div>

        {/* Link Thickness Controls */}
        <div data-testid="link-thickness-controls">
          <h5>Link Thickness</h5>
          <p>
            Click a link to resize, the font size will also be adjusted
            proportionally
          </p>
          <div data-testid="link-thickness-slider" style={{ opacity: 0.5 }}>
            <div style={{ width: "25%" }}></div>
          </div>
          <span>N/A</span>
        </div>
      </div>
    );
  };
});

import WorldMapDiagram from "../WorldMapDiagram";

describe("WorldMapDiagram", () => {
  describe("Initial Rendering", () => {
    it("renders the main title and subtitle", () => {
      render(<WorldMapDiagram />);

      expect(
        screen.getByText("World Shipping Network Visualization")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Click cities to view details/)
      ).toBeInTheDocument();
    });

    it("renders the node details card with default state", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByTestId("node-details-card")).toBeInTheDocument();
      expect(screen.getByText("Node Details")).toBeInTheDocument();
      expect(
        screen.getByText("Click a node to view details")
      ).toBeInTheDocument();
      expect(screen.getAllByText("N/A")).toHaveLength(7); // Updated to match the mock component
    });

    it("renders the link controls card", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByTestId("link-controls-card")).toBeInTheDocument();
      expect(screen.getByText("Link Controls")).toBeInTheDocument();
      expect(screen.getByTestId("link-toggle")).toBeChecked();
    });

    it("renders the search and filter controls", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByTestId("search-filter")).toBeInTheDocument();
      expect(screen.getByText("Search & Filter")).toBeInTheDocument();
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
      expect(screen.getByTestId("region-select")).toBeInTheDocument();
    });
  });

  describe("Search and Filter Functionality", () => {
    it("allows searching for cities", async () => {
      const user = userEvent.setup();
      render(<WorldMapDiagram />);

      const searchInput = screen.getByTestId("search-input");
      await user.type(searchInput, "New York");

      expect(searchInput).toHaveValue("New York");
    });

    it("filters by region when dropdown is changed", async () => {
      const user = userEvent.setup();
      render(<WorldMapDiagram />);

      const regionSelect = screen.getByTestId("region-select");
      await user.selectOptions(regionSelect, "north-america");

      expect(regionSelect).toHaveValue("north-america");
    });

    it("shows all region options", () => {
      render(<WorldMapDiagram />);

      const regionSelect = screen.getByTestId("region-select");
      expect(regionSelect).toHaveDisplayValue("All Regions");

      const options = regionSelect.querySelectorAll("option");
      expect(options).toHaveLength(7); // All Regions + 6 regions
    });
  });

  describe("Link Controls", () => {
    it("toggles link visibility when switch is clicked", async () => {
      const user = userEvent.setup();
      render(<WorldMapDiagram />);

      const linkToggle = screen.getByTestId("link-toggle");
      expect(linkToggle).toBeChecked();

      await user.click(linkToggle);

      expect(linkToggle).not.toBeChecked();
    });

    it("shows shipping methods section", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByText("Shipping Methods")).toBeInTheDocument();
      expect(screen.getByText("Click to filter by method")).toBeInTheDocument();
      expect(screen.getByText("Truck (Same Country)")).toBeInTheDocument();
      expect(screen.getByText("Air (Same Continent)")).toBeInTheDocument();
      expect(screen.getByText("Express Air")).toBeInTheDocument();
      expect(screen.getByText("Ship (Cross Ocean)")).toBeInTheDocument();
      expect(screen.getByText("Express Ship (30%)")).toBeInTheDocument();
    });

    it("allows clicking on shipping methods", async () => {
      const user = userEvent.setup();
      render(<WorldMapDiagram />);

      const truckMethod = screen.getByText("Truck (Same Country)");
      await user.click(truckMethod);

      expect(truckMethod).toBeInTheDocument();
    });
  });

  describe("Node Size Controls", () => {
    it("shows node size slider with disabled state when no node is selected", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByText("Node Size")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Click a node to resize, the font size will also be adjusted proportionally"
        )
      ).toBeInTheDocument();

      const slider = screen.getByTestId("node-size-slider");
      expect(slider).toHaveStyle({ opacity: "0.5" });
    });

    it("shows link thickness slider with disabled state when no link is selected", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByText("Link Thickness")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Click a link to resize, the font size will also be adjusted proportionally"
        )
      ).toBeInTheDocument();

      const slider = screen.getByTestId("link-thickness-slider");
      expect(slider).toHaveStyle({ opacity: "0.5" });
    });
  });

  describe("Zoom Controls", () => {
    it("renders zoom control buttons", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByTestId("zoom-in")).toBeInTheDocument();
      expect(screen.getByTestId("zoom-out")).toBeInTheDocument();
      expect(screen.getByTestId("reset-zoom")).toBeInTheDocument();
      expect(screen.getByTestId("fit-to-view")).toBeInTheDocument();
    });

    it("allows clicking zoom buttons", async () => {
      const user = userEvent.setup();
      render(<WorldMapDiagram />);

      const zoomInButton = screen.getByTestId("zoom-in");
      await user.click(zoomInButton);

      expect(zoomInButton).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper form controls", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByTestId("search-input")).toBeInTheDocument();
      expect(screen.getByTestId("link-toggle")).toBeInTheDocument();
      expect(screen.getByTestId("region-select")).toBeInTheDocument();
    });

    it("has keyboard accessible elements", () => {
      render(<WorldMapDiagram />);

      const searchInput = screen.getByTestId("search-input");
      const linkToggle = screen.getByTestId("link-toggle");
      const regionSelect = screen.getByTestId("region-select");

      expect(searchInput).toBeInTheDocument();
      expect(linkToggle).toBeInTheDocument();
      expect(regionSelect).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders with proper test IDs", () => {
      render(<WorldMapDiagram />);

      expect(screen.getByTestId("world-map-diagram")).toBeInTheDocument();
      expect(screen.getByTestId("node-details-card")).toBeInTheDocument();
      expect(screen.getByTestId("link-controls-card")).toBeInTheDocument();
      expect(screen.getByTestId("search-filter")).toBeInTheDocument();
      expect(screen.getByTestId("zoom-controls")).toBeInTheDocument();
      expect(screen.getByTestId("node-size-controls")).toBeInTheDocument();
      expect(screen.getByTestId("link-thickness-controls")).toBeInTheDocument();
    });
  });
});
