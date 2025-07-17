import { Text, Group, useMantineTheme } from "@mantine/core";

interface KeyValuePairProps {
  label: string;
  value: string | number | React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  labelWidth?: number;
  align?: "start" | "center" | "end";
}

// Reusable for form
export function KeyValuePair({
  label,
  value,
  size = "sm",
  labelWidth = 100,
  align = "start",
}: KeyValuePairProps) {
  const theme = useMantineTheme();
  return (
    <Group gap={theme.spacing.xs} align="center" justify={align}>
      <Text
        span
        fw={600}
        size={size}
        c={theme.other?.keyColor || "dimmed"}
        style={{ minWidth: labelWidth, letterSpacing: 0.2, fontWeight: 600 }}
      >
        {label}:
      </Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text
          span
          size={size}
          c={theme.other?.valueColor || "white"}
          style={{ fontWeight: 500, letterSpacing: 0.1 }}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </Group>
  );
}
