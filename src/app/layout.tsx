import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MantineProvider, ColorSchemeScript, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const theme = createTheme({
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
  primaryColor: "violet",
  fontFamily: geistSans.style.fontFamily,
  fontFamilyMonospace: geistMono.style.fontFamily,
});

export const metadata: Metadata = {
  title: "World Shipping Network Visualization",
  description:
    "Interactive visualization of global shipping ports and cities using GoJS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider theme={theme} defaultColorScheme="dark">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
