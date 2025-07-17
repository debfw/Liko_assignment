import { createTheme } from "@mantine/core";

export const appTheme = createTheme({
  primaryColor: "violet",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  fontFamilyMonospace:
    '"SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
  colors: {
    dark: [
      "#C9C9C9",
      "#b8b8b8",
      "#828282",
      "#696969",
      "#4a4a4a",
      "#2d2d2d",
      "#1f1f1f",
      "#141414",
      "#0f0f0f",
      "#0a0a0a",
    ],
  },
  headings: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    fontWeight: "600",
  },
  components: {
    Title: {
      defaultProps: {
        c: "white",
      },
      styles: {
        root: {
          fontWeight: 600,
        },
      },
    },
    Text: {
      defaultProps: {
        c: "dimmed",
      },
      styles: {
        root: {
          lineHeight: 1.5,
        },
      },
    },
    Card: {
      defaultProps: {
        bg: "dark.6",
        withBorder: true,
        radius: "md",
      },
    },
    Paper: {
      defaultProps: {
        bg: "dark.7",
        radius: 0,
      },
    },
    Badge: {
      defaultProps: {
        size: "sm",
        variant: "light",
      },
    },
    Button: {
      defaultProps: {
        variant: "light",
        size: "sm",
      },
    },
    Select: {
      defaultProps: {
        size: "sm",
      },
    },
    Autocomplete: {
      defaultProps: {
        size: "sm",
      },
    },
    Switch: {
      defaultProps: {
        size: "sm",
      },
    },
  },
  other: {
    // Custom theme values
    subtitleColor: "dimmed",
    keyColor: "dimmed",
    valueColor: "white",
    borderColor: "#4a4a4a",
    controlBg: "#2a2a2a",
    controlActiveBg: "#60A5FA",
  },
});

// Typography scale for consistent sizing
export const typography = {
  title: {
    h1: { size: "2rem", weight: 700 },
    h2: { size: "1.5rem", weight: 600 },
    h3: { size: "1.25rem", weight: 600 },
    h4: { size: "1.125rem", weight: 600 },
    h5: { size: "1rem", weight: 600 },
    h6: { size: "0.875rem", weight: 600 },
  },
  text: {
    xs: { size: "0.75rem" },
    sm: { size: "0.875rem" },
    md: { size: "1rem" },
    lg: { size: "1.125rem" },
    xl: { size: "1.25rem" },
  },
};

// Spacing scale
export const spacing = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

// Color palette
export const colors = {
  primary: "violet",
  success: "green",
  warning: "yellow",
  error: "red",
  info: "blue",
  muted: "dimmed",
  text: {
    primary: "white",
    secondary: "dimmed",
    muted: "dimmed",
  },
  background: {
    primary: "dark.8",
    secondary: "dark.7",
    tertiary: "dark.6",
  },
};
