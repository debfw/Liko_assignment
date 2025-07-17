"use client";

import { Menu } from "@mantine/core";
import * as go from "gojs";
import { useContextMenuStore } from "../stores";

export function DiagramContextMenu() {
  const {
    visible: contextMenuVisible,
    x: contextMenuX,
    y: contextMenuY,
    type: contextMenuType,
    target: contextMenuTarget,
    hideContextMenu,
  } = useContextMenuStore();

  const handleIncreaseFontSize = () => {
    if (contextMenuType === "node" && contextMenuTarget) {
      const node = contextMenuTarget as go.Node;
      const textBlock = node.findObject("LABEL") as go.TextBlock;
      if (textBlock) {
        const currentFont = textBlock.font;
        const currentSize = parseInt(currentFont.match(/(\d+)px/)?.[1] || "12");
        textBlock.font = `${Math.min(24, currentSize + 2)}px sans-serif`;
      }
    } else if (contextMenuType === "link" && contextMenuTarget) {
      const link = contextMenuTarget as go.Link;
      const label = link.findObject("LABEL");
      if (label && label instanceof go.Panel) {
        const textBlock = label.elt(1);
        if (textBlock instanceof go.TextBlock) {
          const currentFont = textBlock.font;
          const currentSize = parseInt(currentFont.match(/(\d+)px/)?.[1] || "10");
          textBlock.font = `${Math.min(20, currentSize + 2)}px sans-serif`;
        }
      }
    }
    hideContextMenu();
  };

  const handleDecreaseFontSize = () => {
    if (contextMenuType === "node" && contextMenuTarget) {
      const node = contextMenuTarget as go.Node;
      const textBlock = node.findObject("LABEL") as go.TextBlock;
      if (textBlock) {
        const currentFont = textBlock.font;
        const currentSize = parseInt(currentFont.match(/(\d+)px/)?.[1] || "12");
        textBlock.font = `${Math.max(8, currentSize - 2)}px sans-serif`;
      }
    } else if (contextMenuType === "link" && contextMenuTarget) {
      const link = contextMenuTarget as go.Link;
      const label = link.findObject("LABEL");
      if (label && label instanceof go.Panel) {
        const textBlock = label.elt(1);
        if (textBlock instanceof go.TextBlock) {
          const currentFont = textBlock.font;
          const currentSize = parseInt(currentFont.match(/(\d+)px/)?.[1] || "10");
          textBlock.font = `${Math.max(6, currentSize - 2)}px sans-serif`;
        }
      }
    }
    hideContextMenu();
  };

  return (
    <Menu
      opened={contextMenuVisible}
      onChange={(opened) => {
        if (!opened) {
          hideContextMenu();
        }
      }}
      position="bottom-start"
      withinPortal={false}
    >
      <Menu.Target>
        <div
          style={{
            position: "absolute",
            left: contextMenuX,
            top: contextMenuY,
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
        />
      </Menu.Target>
      <Menu.Dropdown>
        {contextMenuType === "node" && contextMenuTarget && (
          <>
            <Menu.Item onClick={() => {
              const node = contextMenuTarget as go.Node;
              const textBlock = node.findObject("LABEL") as go.TextBlock;
              if (textBlock) {
                const currentFont = textBlock.font;
                const currentSize = parseInt(currentFont.match(/(\d+)px/)?.[1] || "12");
                textBlock.font = `${Math.min(48, currentSize * 2)}px sans-serif`;
              }
              hideContextMenu();
            }}>
              Double Font Size
            </Menu.Item>
            <Menu.Divider />
          </>
        )}
        {contextMenuType === "link" && (
          <>
            <Menu.Item onClick={() => {
              const link = contextMenuTarget as go.Link;
              const label = link.findObject("LABEL");
              if (label && label instanceof go.Panel) {
                const textBlock = label.elt(1);
                if (textBlock instanceof go.TextBlock) {
                  const currentFont = textBlock.font;
                  const currentSize = parseInt(currentFont.match(/(\d+)px/)?.[1] || "10");
                  textBlock.font = `${Math.max(5, Math.floor(currentSize / 2))}px sans-serif`;
                }
              }
              hideContextMenu();
            }}>
              Halve Font Size
            </Menu.Item>
            <Menu.Divider />
          </>
        )}
        <Menu.Item onClick={handleIncreaseFontSize}>Increase Font Size</Menu.Item>
        <Menu.Item onClick={handleDecreaseFontSize}>Decrease Font Size</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}