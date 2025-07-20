import { Text, Group, useMantineTheme } from "@mantine/core";
import { memo, useMemo } from "react";

interface KeyValuePairProps {
  label: string;
  value: string | number | React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  labelWidth?: number;
  align?: "start" | "center" | "end";
}

// Reusable for form
export const KeyValuePair = memo(function KeyValuePair({
  label,
  value,
  size = "sm",
  labelWidth = 100,
  align = "start",
}: KeyValuePairProps) {
  const theme = useMantineTheme();

  const labelStyle = useMemo(
    () => ({
      minWidth: labelWidth,
      letterSpacing: 0.2,
      fontWeight: 600,
    }),
    [labelWidth]
  );

  const valueStyle = useMemo(
    () => ({
      fontWeight: 500,
      letterSpacing: 0.1,
    }),
    []
  );

  const keyColor = theme.other?.keyColor || "dimmed";
  const valueColor = theme.other?.valueColor || "white";

  return (
    <Group gap={theme.spacing.xs} align="center" justify={align}>
      <Text span fw={600} size={size} c={keyColor} style={labelStyle}>
        {label}:
      </Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text span size={size} c={valueColor} style={valueStyle}>
          {value}
        </Text>
      ) : (
        value
      )}
    </Group>
  );
});
