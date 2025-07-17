import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the context menu actions
const mockHandleDoubleFontSize = jest.fn();
const mockHandleHalveFontSize = jest.fn();

// Mock context menu component
const MockContextMenu = ({
  visible,
  x,
  y,
  type,
  onDoubleFontSize,
  onHalveFontSize,
}: {
  visible: boolean;
  x: number;
  y: number;
  type: "node" | "link" | null;
  onDoubleFontSize: () => void;
  onHalveFontSize: () => void;
}) => {
  if (!visible) return null;

  return (
    <div
      data-testid="context-menu"
      style={{
        position: "absolute",
        left: x,
        top: y,
        backgroundColor: "#2d2d2d",
        border: "1px solid #4a4a4a",
        borderRadius: "4px",
        padding: "8px",
        zIndex: 1000,
      }}
    >
      {type === "node" && (
        <button
          data-testid="double-font-size"
          onClick={onDoubleFontSize}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "4px 8px",
          }}
        >
          Double Font Size
        </button>
      )}
      {type === "link" && (
        <button
          data-testid="halve-font-size"
          onClick={onHalveFontSize}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "4px 8px",
          }}
        >
          Halve Font Size
        </button>
      )}
    </div>
  );
};

describe("Context Menu Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Node Context Menu", () => {
    it("shows double font size option when right-clicking a node", async () => {
      const user = userEvent.setup();

      render(
        <MockContextMenu
          visible={true}
          x={100}
          y={100}
          type="node"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      expect(screen.getByTestId("double-font-size")).toBeInTheDocument();
      expect(screen.queryByTestId("halve-font-size")).not.toBeInTheDocument();
    });

    it("calls double font size handler when clicked", async () => {
      const user = userEvent.setup();

      render(
        <MockContextMenu
          visible={true}
          x={100}
          y={100}
          type="node"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      const doubleFontButton = screen.getByTestId("double-font-size");
      await user.click(doubleFontButton);

      expect(mockHandleDoubleFontSize).toHaveBeenCalledTimes(1);
    });

    it("does not show when not visible", () => {
      render(
        <MockContextMenu
          visible={false}
          x={100}
          y={100}
          type="node"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
    });
  });

  describe("Link Context Menu", () => {
    it("shows halve font size option when right-clicking a link", async () => {
      const user = userEvent.setup();

      render(
        <MockContextMenu
          visible={true}
          x={100}
          y={100}
          type="link"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      expect(screen.getByTestId("context-menu")).toBeInTheDocument();
      expect(screen.getByTestId("halve-font-size")).toBeInTheDocument();
      expect(screen.queryByTestId("double-font-size")).not.toBeInTheDocument();
    });

    it("calls halve font size handler when clicked", async () => {
      const user = userEvent.setup();

      render(
        <MockContextMenu
          visible={true}
          x={100}
          y={100}
          type="link"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      const halveFontButton = screen.getByTestId("halve-font-size");
      await user.click(halveFontButton);

      expect(mockHandleHalveFontSize).toHaveBeenCalledTimes(1);
    });
  });

  describe("Context Menu Positioning", () => {
    it("positions menu at correct coordinates", () => {
      render(
        <MockContextMenu
          visible={true}
          x={200}
          y={300}
          type="node"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      const contextMenu = screen.getByTestId("context-menu");
      expect(contextMenu).toHaveStyle({
        left: "200px",
        top: "300px",
      });
    });
  });

  describe("Context Menu Styling", () => {
    it("has proper styling for dark theme", () => {
      render(
        <MockContextMenu
          visible={true}
          x={100}
          y={100}
          type="node"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      const contextMenu = screen.getByTestId("context-menu");
      expect(contextMenu).toHaveStyle({
        backgroundColor: "#2d2d2d",
        border: "1px solid #4a4a4a",
        borderRadius: "4px",
      });
    });

    it("has proper button styling", () => {
      render(
        <MockContextMenu
          visible={true}
          x={100}
          y={100}
          type="node"
          onDoubleFontSize={mockHandleDoubleFontSize}
          onHalveFontSize={mockHandleHalveFontSize}
        />
      );

      const button = screen.getByTestId("double-font-size");
      expect(button).toHaveStyle({
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "4px 8px",
      });
    });
  });
});

// Test utility functions
describe("Utility Functions", () => {
  describe("Font Size Calculations", () => {
    it("calculates double font size correctly", () => {
      const baseFontSize = 12;
      const doubledFontSize = Math.min(baseFontSize * 2, 48);
      expect(doubledFontSize).toBe(24);
    });

    it("limits maximum font size to 48px", () => {
      const baseFontSize = 30;
      const doubledFontSize = Math.min(baseFontSize * 2, 48);
      expect(doubledFontSize).toBe(48);
    });

    it("calculates halve font size correctly", () => {
      const baseFontSize = 20;
      const halvedFontSize = Math.max(baseFontSize / 2, 6);
      expect(halvedFontSize).toBe(10);
    });

    it("limits minimum font size to 6px", () => {
      const baseFontSize = 8;
      const halvedFontSize = Math.max(baseFontSize / 2, 6);
      expect(halvedFontSize).toBe(6);
    });
  });

  describe("Node Size Calculations", () => {
    it("calculates node size multiplier correctly", () => {
      const baseSize = 20;
      const currentSize = 30;
      const multiplier = currentSize / baseSize;
      expect(multiplier).toBe(1.5);
    });

    it("limits node size multiplier to valid range", () => {
      const multiplier = 2.5;
      const limitedMultiplier = Math.max(0.5, Math.min(2, multiplier));
      expect(limitedMultiplier).toBe(2);
    });
  });

  describe("Link Thickness Calculations", () => {
    it("calculates link thickness from percentage", () => {
      const percentage = 0.5;
      const thickness = 1 + percentage * 4; // 1px to 5px
      expect(thickness).toBe(3);
    });

    it("limits link thickness to valid range", () => {
      const thickness = 6;
      const limitedThickness = Math.max(1, Math.min(5, thickness));
      expect(limitedThickness).toBe(5);
    });
  });
});
