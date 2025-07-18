import { convertLatLngToDiagramCoords, calculateDistance } from '../coordinates';

describe('coordinates utilities', () => {
  describe('convertLatLngToDiagramCoords', () => {
    it('should convert equator and prime meridian to center', () => {
      const result = convertLatLngToDiagramCoords(0, 0);
      expect(result.x).toBe(800);
      expect(result.y).toBe(400);
    });

    it('should convert northern hemisphere coordinates correctly', () => {
      // New York: 40.7128°N, 74.0060°W
      const result = convertLatLngToDiagramCoords(40.7128, -74.0060);
      expect(result.x).toBeCloseTo(471.08, 1);
      expect(result.y).toBeCloseTo(219.05, 1);
    });

    it('should convert southern hemisphere coordinates correctly', () => {
      // Sydney: 33.8688°S, 151.2093°E
      const result = convertLatLngToDiagramCoords(-33.8688, 151.2093);
      expect(result.x).toBeCloseTo(1472.04, 1);
      expect(result.y).toBeCloseTo(550.53, 1);
    });

    it('should handle extreme latitudes', () => {
      // North Pole
      const northPole = convertLatLngToDiagramCoords(90, 0);
      expect(northPole.x).toBe(800);
      expect(northPole.y).toBe(0);

      // South Pole
      const southPole = convertLatLngToDiagramCoords(-90, 0);
      expect(southPole.x).toBe(800);
      expect(southPole.y).toBe(800);
    });

    it('should handle extreme longitudes', () => {
      // International Date Line West
      const westEnd = convertLatLngToDiagramCoords(0, -180);
      expect(westEnd.x).toBe(0);
      expect(westEnd.y).toBe(400);

      // International Date Line East
      const eastEnd = convertLatLngToDiagramCoords(0, 180);
      expect(eastEnd.x).toBe(1600);
      expect(eastEnd.y).toBe(400);
    });

    it('should handle various real city coordinates', () => {
      const cities = [
        { name: 'London', lat: 51.5074, lng: -0.1278, expected: { x: 799.43, y: 171.08 } },
        { name: 'Tokyo', lat: 35.6762, lng: 139.6503, expected: { x: 1420.63, y: 241.44 } },
        { name: 'São Paulo', lat: -23.5505, lng: -46.6333, expected: { x: 592.74, y: 504.67 } },
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777, expected: { x: 1123.90, y: 315.22 } },
      ];

      cities.forEach(city => {
        const result = convertLatLngToDiagramCoords(city.lat, city.lng);
        expect(result.x).toBeCloseTo(city.expected.x, 1);
        expect(result.y).toBeCloseTo(city.expected.y, 1);
      });
    });
  });

  describe('calculateDistance', () => {
    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    it('should calculate distance between New York and Los Angeles', () => {
      // NYC: 40.7128°N, 74.0060°W
      // LA: 34.0522°N, 118.2437°W
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      // Actual distance is approximately 3944 km
      expect(distance).toBeCloseTo(3944, -2); // within 100km
    });

    it('should calculate distance between London and Paris', () => {
      // London: 51.5074°N, 0.1278°W
      // Paris: 48.8566°N, 2.3522°E
      const distance = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
      // Actual distance is approximately 344 km
      expect(distance).toBeCloseTo(344, -1); // within 10km
    });

    it('should calculate distance across hemispheres', () => {
      // New York to Sydney
      const distance = calculateDistance(40.7128, -74.0060, -33.8688, 151.2093);
      // Actual distance is approximately 15,988 km
      expect(distance).toBeCloseTo(15988, -2); // within 100km
    });

    it('should handle antipodal points', () => {
      // Points on opposite sides of Earth
      const distance = calculateDistance(0, 0, 0, 180);
      // Half Earth's circumference ~ 20,037 km
      expect(distance).toBeCloseTo(20037, -2);
    });

    it('should be commutative', () => {
      const distance1 = calculateDistance(40.7128, -74.0060, 51.5074, -0.1278);
      const distance2 = calculateDistance(51.5074, -0.1278, 40.7128, -74.0060);
      expect(distance1).toBe(distance2);
    });

    it('should handle various city pairs', () => {
      const cityPairs = [
        {
          from: { lat: 35.6762, lng: 139.6503 }, // Tokyo
          to: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          expectedDistance: 8280 // km
        },
        {
          from: { lat: -23.5505, lng: -46.6333 }, // São Paulo
          to: { lat: 40.7128, lng: -74.0060 }, // New York
          expectedDistance: 7686 // km
        },
        {
          from: { lat: 19.0760, lng: 72.8777 }, // Mumbai
          to: { lat: 25.2048, lng: 55.2708 }, // Dubai
          expectedDistance: 1951 // km
        }
      ];

      cityPairs.forEach(pair => {
        const distance = calculateDistance(
          pair.from.lat, pair.from.lng,
          pair.to.lat, pair.to.lng
        );
        expect(distance).toBeCloseTo(pair.expectedDistance, -2);
      });
    });

    it('should handle edge cases', () => {
      // North Pole to South Pole
      const poleDistance = calculateDistance(90, 0, -90, 0);
      // Half Earth's circumference through poles
      expect(poleDistance).toBeCloseTo(20037, -2);

      // Equator quarter circumference
      const equatorQuarter = calculateDistance(0, 0, 0, 90);
      expect(equatorQuarter).toBeCloseTo(10018, -2);
    });
  });
});