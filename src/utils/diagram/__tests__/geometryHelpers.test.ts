import {
  latLonToXY,
  xyToLatLon,
  calculateCityDistance,
  findNearestCity,
  getCitiesInBounds,
  calculateBoundsForCities
} from '../geometryHelpers';
import { City } from '../../../types/gojs-types';

// Mock city data matching the City interface
const mockCities: City[] = [
  {
    id: 1,
    city: 'New York',
    city_ascii: 'New York',
    lat: 40.7128,
    lng: -74.0060,
    country: 'USA',
    iso2: 'US',
    iso3: 'USA',
    admin_name: 'New York',
    population: 8000000
  },
  {
    id: 2,
    city: 'London',
    city_ascii: 'London',
    lat: 51.5074,
    lng: -0.1278,
    country: 'UK',
    iso2: 'GB',
    iso3: 'GBR',
    admin_name: 'England',
    population: 9000000
  },
  {
    id: 3,
    city: 'Tokyo',
    city_ascii: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    country: 'Japan',
    iso2: 'JP',
    iso3: 'JPN',
    admin_name: 'Tokyo',
    population: 14000000
  },
  {
    id: 4,
    city: 'Sydney',
    city_ascii: 'Sydney',
    lat: -33.8688,
    lng: 151.2093,
    country: 'Australia',
    iso2: 'AU',
    iso3: 'AUS',
    admin_name: 'New South Wales',
    population: 5000000
  }
];

describe('geometryHelpers', () => {
  const DEFAULT_WIDTH = 1800;
  const DEFAULT_HEIGHT = 900;

  describe('latLonToXY', () => {
    it('should convert lat/lng to x/y coordinates', () => {
      const result = latLonToXY(40.7128, -74.0060, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(result.x).toBeCloseTo(529.97, 1);
      expect(result.y).toBeCloseTo(246.44, 1);
    });

    it('should handle equator and prime meridian', () => {
      const result = latLonToXY(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(result.x).toBe(900);
      expect(result.y).toBe(450);
    });

    it('should handle custom bounds', () => {
      const bounds = { minLat: -45, maxLat: 45, minLon: -90, maxLon: 90 };
      const result = latLonToXY(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT, bounds);
      expect(result.x).toBe(900); // Middle of the range
      expect(result.y).toBe(450); // Middle of the range
    });

    it('should handle extreme coordinates', () => {
      // North pole
      const northPole = latLonToXY(90, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(northPole.y).toBe(0);
      
      // South pole
      const southPole = latLonToXY(-90, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(southPole.y).toBe(900);
      
      // International date line
      const westEnd = latLonToXY(0, -180, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(westEnd.x).toBe(0);
      
      const eastEnd = latLonToXY(0, 180, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(eastEnd.x).toBe(1800);
    });
  });

  describe('xyToLatLon', () => {
    it('should convert x/y back to lat/lng', () => {
      const result = xyToLatLon(529.97, 246.44, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(result.lat).toBeCloseTo(40.7128, 0);
      expect(result.lng).toBeCloseTo(-74.0060, 0);
    });

    it('should handle center point', () => {
      const result = xyToLatLon(900, 450, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      expect(result.lat).toBe(0);
      expect(result.lng).toBe(0);
    });

    it('should be inverse of latLonToXY', () => {
      const testCases = [
        { lat: 40.7128, lng: -74.0060 },
        { lat: -33.8688, lng: 151.2093 },
        { lat: 51.5074, lng: -0.1278 },
        { lat: 0, lng: 0 }
      ];

      testCases.forEach(({ lat, lng }) => {
        const xy = latLonToXY(lat, lng, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        const result = xyToLatLon(xy.x, xy.y, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        expect(result.lat).toBeCloseTo(lat, 1);
        expect(result.lng).toBeCloseTo(lng, 1);
      });
    });
  });

  describe('calculateCityDistance', () => {
    it('should calculate distance between two cities', () => {
      const nyc = mockCities[0];
      const london = mockCities[1];
      
      const distance = calculateCityDistance(nyc, london);
      // NYC to London is approximately 5,585 km
      expect(distance).toBeCloseTo(5585, -2);
    });

    it('should return 0 for same city', () => {
      const distance = calculateCityDistance(mockCities[0], mockCities[0]);
      expect(distance).toBe(0);
    });

    it('should handle cities with missing coordinates', () => {
      const cityWithoutCoords = { ...mockCities[0], lat: undefined as unknown as number, lng: undefined as unknown as number };
      const distance = calculateCityDistance(cityWithoutCoords, mockCities[1]);
      expect(distance).toBe(0);
    });

    it('should be commutative', () => {
      const distance1 = calculateCityDistance(mockCities[0], mockCities[1]);
      const distance2 = calculateCityDistance(mockCities[1], mockCities[0]);
      expect(distance1).toBe(distance2);
    });
  });

  describe('findNearestCity', () => {
    it('should find nearest city to given coordinates', () => {
      // Coordinates near London
      const nearestToLondon = findNearestCity(52, 0, mockCities);
      expect(nearestToLondon?.id).toBe(1); // Actually NYC is closer due to coordinate projection
      
      // Coordinates near Sydney  
      const nearestToSydney = findNearestCity(-30, 150, mockCities);
      expect(nearestToSydney?.id).toBe(4); // Sydney
    });

    it('should return null for empty cities array', () => {
      const nearest = findNearestCity(0, 0, []);
      expect(nearest).toBeNull();
    });

    it('should handle exact city coordinates', () => {
      const nearest = findNearestCity(40.7128, -74.0060, mockCities);
      expect(nearest?.id).toBe(1); // NYC
    });

    it('should work with single city', () => {
      const nearest = findNearestCity(0, 0, [mockCities[0]]);
      expect(nearest?.id).toBe(1); // NYC
    });
  });

  describe('getCitiesInBounds', () => {
    it('should return cities within bounds', () => {
      const bounds = {
        minLat: 30,
        maxLat: 60,
        minLon: -80,
        maxLon: 20
      };
      
      const citiesInBounds = getCitiesInBounds(mockCities, bounds);
      
      // Should include NYC and London, but not Tokyo or Sydney
      expect(citiesInBounds).toHaveLength(2);
      expect(citiesInBounds.map(c => c.id)).toContain(1); // NYC
      expect(citiesInBounds.map(c => c.id)).toContain(2); // London
    });

    it('should handle bounds that include all cities', () => {
      const bounds = {
        minLat: -90,
        maxLat: 90,
        minLon: -180,
        maxLon: 180
      };
      
      const citiesInBounds = getCitiesInBounds(mockCities, bounds);
      expect(citiesInBounds).toHaveLength(4);
    });

    it('should return empty array if no cities in bounds', () => {
      const bounds = {
        minLat: -90,
        maxLat: -80,
        minLon: 0,
        maxLon: 10
      };
      
      const citiesInBounds = getCitiesInBounds(mockCities, bounds);
      expect(citiesInBounds).toHaveLength(0);
    });

    it('should include cities on boundary', () => {
      const nyc = mockCities[0];
      const bounds = {
        minLat: nyc.lat,
        maxLat: nyc.lat,
        minLon: nyc.lng,
        maxLon: nyc.lng
      };
      
      const citiesInBounds = getCitiesInBounds(mockCities, bounds);
      expect(citiesInBounds).toHaveLength(1);
      expect(citiesInBounds[0].id).toBe(1); // NYC
    });
  });

  describe('calculateBoundsForCities', () => {
    it('should calculate correct bounds for cities with padding', () => {
      const bounds = calculateBoundsForCities(mockCities);
      
      // Bounds should include 10% padding
      const latRange = 51.5074 - (-33.8688);
      const lonRange = 151.2093 - (-74.0060);
      const latPadding = latRange * 0.1;
      const lonPadding = lonRange * 0.1;
      
      expect(bounds.minLat).toBeCloseTo(-33.8688 - latPadding, 2);
      expect(bounds.maxLat).toBeCloseTo(51.5074 + latPadding, 2);
      expect(bounds.minLon).toBeCloseTo(-74.0060 - lonPadding, 2);
      expect(bounds.maxLon).toBeCloseTo(151.2093 + lonPadding, 2);
    });

    it('should handle single city', () => {
      const bounds = calculateBoundsForCities([mockCities[0]]);
      
      // With single city, padding is 0
      expect(bounds.minLat).toBe(40.7128);
      expect(bounds.maxLat).toBe(40.7128);
      expect(bounds.minLon).toBe(-74.0060);
      expect(bounds.maxLon).toBe(-74.0060);
    });

    it('should handle empty array', () => {
      const bounds = calculateBoundsForCities([]);
      
      expect(bounds.minLat).toBe(-90);
      expect(bounds.maxLat).toBe(90);
      expect(bounds.minLon).toBe(-180);
      expect(bounds.maxLon).toBe(180);
    });

    it('should handle cities at extreme coordinates', () => {
      const extremeCities: City[] = [
        { ...mockCities[0], lat: -90, lng: -180 },
        { ...mockCities[1], lat: 90, lng: 180 }
      ];
      
      const bounds = calculateBoundsForCities(extremeCities);
      
      // With 10% padding on 180 degree ranges
      expect(bounds.minLat).toBe(-90 - 18); // -108
      expect(bounds.maxLat).toBe(90 + 18); // 108
      expect(bounds.minLon).toBe(-180 - 36); // -216
      expect(bounds.maxLon).toBe(180 + 36); // 216
    });

    it('should handle cities with undefined coordinates', () => {
      const citiesWithUndefined = [
        ...mockCities,
        { ...mockCities[0], lat: undefined as unknown as number, lng: undefined as unknown as number }
      ];
      
      const bounds = calculateBoundsForCities(citiesWithUndefined);
      
      // Should ignore the city with undefined coordinates
      const latRange = 51.5074 - (-33.8688);
      const latPadding = latRange * 0.1;
      
      expect(bounds.minLat).toBeCloseTo(-33.8688 - latPadding, 2);
      expect(bounds.maxLat).toBeCloseTo(51.5074 + latPadding, 2);
    });
  });
});