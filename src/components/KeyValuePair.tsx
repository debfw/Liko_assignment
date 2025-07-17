import { Text, Group } from "@mantine/core";

interface KeyValuePairProps {
  label: string;
  value: string | number | React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  labelWidth?: number;
  align?: "start" | "center" | "end";
}

//reuseable for form
export function KeyValuePair({
  label,
  value,
  size = "sm",
  labelWidth = 100,
  align = "start",
}: KeyValuePairProps) {
  return (
    <Group gap="xs" align="center" justify={align}>
      <Text
        span
        fw={600}
        size={size}
        c="gray.3"
        style={{ minWidth: labelWidth }}
      >
        {label}:
      </Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text span size={size} c="white">
          {value}
        </Text>
      ) : (
        value
      )}
    </Group>
  );
}
