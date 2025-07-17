import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@mantine/core";
import { useSaveStateStore } from "../stores/saveStateStore";

/**
 * SaveStateIndicator - Shows save status for diagram modifications
 *
 * Displays "Saved" or "Saving..." with appropriate icons when:
 * - Node resizing (Ctrl+drag on nodes)
 * - Link opacity changes (slider adjustment)
 * - Font size modifications (context menu)
 * - Link visibility toggles (show/hide switch)
 * - Shipping method filtering (method selection)
 * - Real-time diagram modifications
 */
export function SaveStateIndicator() {
  const { status } = useSaveStateStore();

  return (
    <Badge
      variant="light"
      color={status === "saved" ? "green" : "blue"}
      leftSection={
        status === "saved" ? (
          <IconCheck size={14} />
        ) : (
          <IconLoader2 size={14} className="animate-spin" />
        )
      }
      size="sm"
    >
      {status === "saved" ? "Saved" : "Saving..."}
    </Badge>
  );
}
