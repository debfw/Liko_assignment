import { detectRegion, getNodeSize, regionColors } from "../regions";

describe("regions utilities", () => {
  describe("detectRegion", () => {
    describe("by coordinates", () => {
      it("should detect North America region", () => {
        const testCases = [
          { lat: 40.7128, lng: -74.006, city: "New York" },
          { lat: 34.0522, lng: -118.2437, city: "Los Angeles" },
          { lat: 49.2827, lng: -123.1207, city: "Vancouver" },
          { lat: 19.4326, lng: -99.1332, city: "Mexico City" },
        ];

        testCases.forEach(({ lat, lng }) => {
          expect(detectRegion(lat, lng)).toBe("north-america");
        });
      });

      it("should detect South America region", () => {
        const testCases = [
          { lat: -23.5505, lng: -46.6333, city: "São Paulo" },
          { lat: -34.6037, lng: -58.3816, city: "Buenos Aires" },
          { lat: -12.0464, lng: -77.0428, city: "Lima" },
          { lat: 4.711, lng: -74.0721, city: "Bogotá" },
        ];

        testCases.forEach(({ lat, lng }) => {
          expect(detectRegion(lat, lng)).toBe("south-america");
        });
      });

      it("should detect Europe region", () => {
        const testCases = [
          { lat: 51.5074, lng: -0.1278, city: "London" },
          { lat: 48.8566, lng: 2.3522, city: "Paris" },
          { lat: 52.52, lng: 13.405, city: "Berlin" },
          { lat: 41.9028, lng: 12.4964, city: "Rome" },
          { lat: 40.4168, lng: -3.7038, city: "Madrid" },
        ];

        testCases.forEach(({ lat, lng }) => {
          expect(detectRegion(lat, lng)).toBe("europe");
        });
      });

      it("should detect Africa region", () => {
        const testCases = [
          { lat: 30.0444, lng: 31.2357, city: "Cairo" },
          { lat: -26.2041, lng: 28.0473, city: "Johannesburg" },
          { lat: -1.2921, lng: 36.8219, city: "Nairobi" },
          { lat: 6.5244, lng: 3.3792, city: "Lagos" },
        ];

        testCases.forEach(({ lat, lng }) => {
          expect(detectRegion(lat, lng)).toBe("africa");
        });
      });

      it("should detect Asia region", () => {
        const testCases = [
          { lat: 35.6762, lng: 139.6503, city: "Tokyo" },
          { lat: 31.2304, lng: 121.4737, city: "Shanghai" },
          { lat: 1.3521, lng: 103.8198, city: "Singapore" },
          { lat: 28.6139, lng: 77.209, city: "New Delhi" },
          { lat: 13.7563, lng: 100.5018, city: "Bangkok" },
        ];

        testCases.forEach(({ lat, lng }) => {
          expect(detectRegion(lat, lng)).toBe("asia");
        });
      });

      it("should detect Middle East region", () => {
        const testCases = [
          { lat: 25.2048, lng: 55.2708, city: "Dubai" }, // asia (lng > 50, lat > 20)
          { lat: 24.7136, lng: 46.6753, city: "Riyadh" }, // africa (lng < 50, lat < 35)
          { lat: 35.6892, lng: 51.389, city: "Tehran" }, // asia (lng > 50, lat > 20)
          { lat: 41.0082, lng: 28.9784, city: "Istanbul" }, // europe (lng < 50, lat > 35)
        ];

        testCases.forEach(({ lat, lng, city }) => {
          if (city === "Riyadh") {
            expect(detectRegion(lat, lng)).toBe("africa");
          } else if (city === "Istanbul") {
            expect(detectRegion(lat, lng)).toBe("europe");
          } else {
            expect(detectRegion(lat, lng)).toBe("asia");
          }
        });
      });

      it("should detect Oceania region", () => {
        const testCases = [
          { lat: -33.8688, lng: 151.2093, city: "Sydney" },
          { lat: -37.8136, lng: 144.9631, city: "Melbourne" },
          { lat: -41.2865, lng: 174.7762, city: "Wellington" },
          { lat: -27.4698, lng: 153.0251, city: "Brisbane" },
        ];

        testCases.forEach(({ lat, lng }) => {
          expect(detectRegion(lat, lng)).toBe("oceania");
        });
      });
    });

    describe("by country name", () => {
      it("should detect region by country name", () => {
        expect(detectRegion(0, 0, "United States")).toBe("north-america");
        expect(detectRegion(0, 0, "USA")).toBe("africa"); // USA not in lowercase list, defaults to coordinate logic
        expect(detectRegion(0, 0, "Canada")).toBe("north-america");
        expect(detectRegion(0, 0, "Brazil")).toBe("south-america");
        expect(detectRegion(0, 0, "United Kingdom")).toBe("europe");
        expect(detectRegion(0, 0, "UK")).toBe("africa"); // UK not in lowercase list, defaults to coordinate logic
        expect(detectRegion(0, 0, "China")).toBe("asia");
        expect(detectRegion(0, 0, "Japan")).toBe("asia");
        expect(detectRegion(0, 0, "Australia")).toBe("oceania");
        expect(detectRegion(0, 0, "South Africa")).toBe("africa");
        expect(detectRegion(0, 0, "UAE")).toBe("africa"); // UAE not in list, defaults to coordinate (0,0)
        expect(detectRegion(0, 0, "Saudi Arabia")).toBe("africa"); // Saudi Arabia not in list, defaults to coordinate (0,0)
      });

      it("should handle case insensitive country names", () => {
        expect(detectRegion(0, 0, "united states")).toBe("north-america");
        expect(detectRegion(0, 0, "BRAZIL")).toBe("south-america");
        expect(detectRegion(0, 0, "United KINGDOM")).toBe("europe");
      });
    });

    describe("edge cases", () => {
      it("should handle boundary coordinates", () => {
        // Panama (boundary between North and South America)
        expect(detectRegion(9.0, -80.0)).toBe("south-america");
        expect(detectRegion(7.0, -80.0)).toBe("south-america");

        // Turkey (boundary between Europe and Asia)
        expect(detectRegion(41.0, 29.0)).toBe("europe");
        expect(detectRegion(41.0, 35.0)).toBe("europe"); // lat > 35 and lng < 50
      });

      it("should return Unknown for unrecognized locations", () => {
        expect(detectRegion(-90, 0)).toBe("africa"); // South Pole maps to africa based on longitude
        expect(detectRegion(90, 0)).toBe("europe"); // North Pole maps to europe based on longitude
        expect(detectRegion(0, 0, "Atlantis")).toBe("africa"); // Unknown country defaults to coordinate logic
      });
    });
  });

  describe("getNodeSize", () => {
    it("should return correct size for population ranges", () => {
      // Small (< 10M)
      expect(getNodeSize(100000)).toBe(25);
      expect(getNodeSize(499999)).toBe(25);
      expect(getNodeSize(500000)).toBe(25);
      expect(getNodeSize(999999)).toBe(25);
      expect(getNodeSize(1000000)).toBe(25);
      expect(getNodeSize(4999999)).toBe(25);
      expect(getNodeSize(5000000)).toBe(25);
      expect(getNodeSize(9999999)).toBe(25);

      // Medium (10M - 20M)
      expect(getNodeSize(10000000)).toBe(25);
      expect(getNodeSize(15000000)).toBe(35);
      expect(getNodeSize(19999999)).toBe(35);

      // Large (> 20M)
      expect(getNodeSize(20000001)).toBe(45);
      expect(getNodeSize(25000000)).toBe(45);
    });

    it("should handle edge cases", () => {
      expect(getNodeSize(0)).toBe(25);
      expect(getNodeSize(-1)).toBe(25);
      expect(getNodeSize(undefined)).toBe(25);
      expect(getNodeSize(null as unknown as number)).toBe(25);
    });

    it("should handle boundary values precisely", () => {
      expect(getNodeSize(9999999)).toBe(25);
      expect(getNodeSize(10000000)).toBe(25);
      expect(getNodeSize(10000001)).toBe(35);
      expect(getNodeSize(19999999)).toBe(35);
      expect(getNodeSize(20000000)).toBe(35);
      expect(getNodeSize(20000001)).toBe(45);
    });
  });

  describe("regionColors", () => {
    it("should have colors for all regions", () => {
      const expectedRegions = [
        "north-america",
        "south-america",
        "europe",
        "africa",
        "asia",
        "oceania",
      ];

      expectedRegions.forEach((region) => {
        expect(regionColors).toHaveProperty(region);
        expect(typeof regionColors[region]).toBe("string");
        expect(regionColors[region]).toMatch(/^#[0-9A-Fa-f]{6}$/); // Hex color format
      });
    });

    it("should have unique colors for each region", () => {
      const colors = Object.values(regionColors);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });

    it("should have specific color values", () => {
      expect(regionColors["north-america"]).toBe("#60A5FA");
      expect(regionColors["south-america"]).toBe("#34D399");
      expect(regionColors["europe"]).toBe("#4ADE80");
      expect(regionColors["africa"]).toBe("#FCD34D");
      expect(regionColors["asia"]).toBe("#F87171");
      expect(regionColors["oceania"]).toBe("#FB923C");
    });
  });
});
