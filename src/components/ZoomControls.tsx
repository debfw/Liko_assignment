"use client";

import { Button, Group } from "@mantine/core";
import {
  IconRefresh,
  IconMaximize,
  IconHandMove,
  IconLink,
  IconUnlink,
} from "@tabler/icons-react";
import { useDiagramStore, useInteractionStore } from "../stores";

interface ZoomControlsProps {
  onReset: () => Promise<void>;
}

export function ZoomControls({ onReset }: ZoomControlsProps) {
  const { diagram } = useDiagramStore();
  const {
    isDraggingEnabled,
    isLinkingEnabled,
    isRelinkingEnabled,
    setDraggingEnabled,
    setLinkingEnabled,
    setRelinkingEnabled,
  } = useInteractionStore();

  const handleZoomToFit = () => {
    if (diagram) {
      diagram.zoomToFit();
    }
  };

  const handleToggleDragging = () => {
    if (!isDraggingEnabled) {
      const confirmed = window.confirm(
        "You sure the citizens agreed to this relocation?"
      );
      if (confirmed) {
        // Disable other tools when enabling dragging
        setLinkingEnabled(false);
        setRelinkingEnabled(false);
        setDraggingEnabled(true);
      }
    } else {
      setDraggingEnabled(false);
      alert("Node dragging has been disabled");
    }
  };

  const handleToggleLinking = () => {
    if (!isLinkingEnabled) {
      const confirmed = window.confirm(
        "Your bank account might be billed after creating a new route"
      );
      if (confirmed) {
        // Disable other tools when enabling linking
        setDraggingEnabled(false);
        setRelinkingEnabled(false);
        setLinkingEnabled(true);
      }
    } else {
      setLinkingEnabled(false);
      alert("Link creation has been disabled");
    }
  };

  const handleToggleRelinking = () => {
    if (!isRelinkingEnabled) {
      const confirmed = window.confirm(
        "You better not mess with the holiday inventory"
      );
      if (confirmed) {
        // Disable other tools when enabling relinking
        setDraggingEnabled(false);
        setLinkingEnabled(false);
        setRelinkingEnabled(true);
      }
    } else {
      setRelinkingEnabled(false);
      alert("Link relinking has been disabled");
    }
  };

  return (
    <Group justify="space-between">
      <Group gap="xs">
        <Button
          leftSection={<IconHandMove size={14} />}
          onClick={handleToggleDragging}
          variant={isDraggingEnabled ? "filled" : "light"}
          color={isDraggingEnabled ? "blue" : "gray"}
          size="sm"
          title="Enable/Disable node dragging"
        >
          Drag Nodes
        </Button>
        <Button
          leftSection={<IconLink size={14} />}
          onClick={handleToggleLinking}
          variant={isLinkingEnabled ? "filled" : "light"}
          color={isLinkingEnabled ? "blue" : "gray"}
          size="sm"
          title="Enable/Disable link creation"
        >
          Create Links
        </Button>
        <Button
          leftSection={<IconUnlink size={14} />}
          onClick={handleToggleRelinking}
          variant={isRelinkingEnabled ? "filled" : "light"}
          color={isRelinkingEnabled ? "blue" : "gray"}
          size="sm"
          title="Enable/Disable link relinking"
        >
          Relink
        </Button>
      </Group>
      <Group gap="xs">
        <Button
          leftSection={<IconMaximize size={14} />}
          onClick={handleZoomToFit}
          size="sm"
        >
          Fit
        </Button>
        <Button
          leftSection={<IconRefresh size={14} />}
          onClick={onReset}
          size="sm"
          variant="light"
          color="red"
        >
          Reset
        </Button>
      </Group>
    </Group>
  );
}
