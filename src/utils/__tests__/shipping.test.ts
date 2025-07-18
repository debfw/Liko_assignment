import { 
  determineShippingMethod, 
  getShippingRoute, 
  createShippingLinks 
} from '../shipping';
import type { City } from '../../types/gojs-types';

// Mock data for testing
const mockCities: City[] = [
  {
    id: 1,
    city: 'New York',
    city_ascii: 'New York',
    lat: 40.7128,
    lng: -74.0060,
    country: 'United States',
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
    country: 'United Kingdom',
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
  },
  {
    id: 5,
    city: 'Miami',
    city_ascii: 'Miami',
    lat: 25.7617,
    lng: -80.1918,
    country: 'United States',
    iso2: 'US',
    iso3: 'USA',
    admin_name: 'Florida',
    population: 500000
  }
];

// Mock Math.random for deterministic tests
let mockRandomValue = 0.5;
const originalRandom = Math.random;

beforeEach(() => {
  Math.random = jest.fn(() => mockRandomValue);
});

afterEach(() => {
  Math.random = originalRandom;
});

describe('shipping utilities', () => {
  describe('determineShippingMethod', () => {
    it('should return truck for same country shipping', () => {
      expect(determineShippingMethod(mockCities[0], mockCities[4])).toBe('truck'); // NYC to Miami
    });

    it('should return ship for different region shipping', () => {
      mockRandomValue = 0.7; // Not express
      expect(determineShippingMethod(mockCities[0], mockCities[1])).toBe('ship'); // NYC to London (different regions)
    });

    it('should return ship-express for different region with express chance', () => {
      mockRandomValue = 0.2; // Express chance (< 0.3)
      expect(determineShippingMethod(mockCities[0], mockCities[1])).toBe('ship-express');
    });

    it('should return ship for cross-region shipping', () => {
      mockRandomValue = 0.7; // Not express
      expect(determineShippingMethod(mockCities[0], mockCities[3])).toBe('ship'); // NYC to Sydney
    });

    it('should return ship-express for cross-region with express chance', () => {
      mockRandomValue = 0.2; // Express chance (< 0.3)
      expect(determineShippingMethod(mockCities[0], mockCities[3])).toBe('ship-express');
    });
  });

  describe('getShippingRoute', () => {
    beforeEach(() => {
      mockRandomValue = 0.5; // Reset to non-express
    });

    it('should create truck shipping route', () => {
      const route = getShippingRoute(mockCities[0], mockCities[4]);
      
      expect(route).toEqual({
        method: 'truck',
        label: 'New York → Miami by Truck',
        style: {
          strokeDashArray: null,
          stroke: 'pink',
          strokeWidth: 4,
          opacity: 1.5
        }
      });
    });

    it('should create ship shipping route for cross-region', () => {
      const route = getShippingRoute(mockCities[0], mockCities[1]);
      
      expect(route.method).toBe('ship');
      expect(route.label).toBe('New York → London by Ship');
      expect(route.style).toEqual({
        strokeDashArray: [2, 4],
        stroke: 'blue',
        strokeWidth: 1,
        opacity: 0.2
      });
    });

    it('should create ship shipping route', () => {
      const route = getShippingRoute(mockCities[0], mockCities[3]);
      
      expect(route.method).toBe('ship');
      expect(route.label).toBe('New York → Sydney by Ship');
      expect(route.style).toEqual({
        strokeDashArray: [2, 4],
        stroke: 'blue',
        strokeWidth: 1,
        opacity: 0.2
      });
    });

    it('should handle express methods', () => {
      mockRandomValue = 0.2; // Express chance

      const shipExpressRoute1 = getShippingRoute(mockCities[0], mockCities[1]);
      expect(shipExpressRoute1.method).toBe('ship-express');
      expect(shipExpressRoute1.label).toBe('New York → London by Express Ship');
      expect(shipExpressRoute1.style.stroke).toBe('gray');

      const shipExpressRoute2 = getShippingRoute(mockCities[0], mockCities[3]);
      expect(shipExpressRoute2.method).toBe('ship-express');
      expect(shipExpressRoute2.label).toBe('New York → Sydney by Express Ship');
      expect(shipExpressRoute2.style.stroke).toBe('gray');
    });
  });

  describe('createShippingLinks', () => {
    beforeEach(() => {
      mockRandomValue = 0.5; // Reset to non-express
    });

    it('should create links based on half-length pairing', () => {
      const cities = mockCities.slice(0, 4); // NYC, LON, TOK, SYD
      const links = createShippingLinks(cities);
      
      // With 4 cities, halfLength = 2
      // Links created: cities[0] to cities[3] (NYC-SYD), cities[1] to cities[2] (LON-TOK)
      expect(links).toHaveLength(2);
      
      const linkPairs = links.map(link => `${link.from}-${link.to}`);
      expect(linkPairs).toContain('1-4'); // NYC to SYD
      expect(linkPairs).toContain('2-3'); // LON to TOK
    });

    it('should determine correct shipping methods', () => {
      const cities = [mockCities[0], mockCities[4], mockCities[1], mockCities[3]]; // NYC, MIA, LON, SYD
      const links = createShippingLinks(cities);
      
      // NYC to SYD (cross-region)
      const nycToSyd = links.find(l => l.from === 1 && l.to === 4);
      expect(nycToSyd?.category).toBe('ship');
      
      // MIA to LON (cross-region)
      const miaToLon = links.find(l => l.from === 5 && l.to === 2);
      expect(miaToLon?.category).toBe('ship');
    });

    it('should create no links for single city', () => {
      const links = createShippingLinks([mockCities[0]]);
      expect(links).toHaveLength(0);
    });

    it('should create no links for empty array', () => {
      const links = createShippingLinks([]);
      expect(links).toHaveLength(0);
    });

    it('should handle odd number of cities', () => {
      const cities = mockCities.slice(0, 3); // NYC, LON, TOK
      const links = createShippingLinks(cities);
      
      // halfLength = Math.floor(3/2) = 1
      // Only creates: cities[0] to cities[2] (NYC-TOK)
      expect(links).toHaveLength(1);
      expect(links[0].from).toBe(1);
      expect(links[0].to).toBe(3);
    });

    it('should set correct visual properties for each shipping method', () => {
      const links = createShippingLinks(mockCities);
      
      links.forEach(link => {
        expect(link).toHaveProperty('text');
        expect(link).toHaveProperty('strokeDashArray');
        expect(link).toHaveProperty('stroke');
        expect(link).toHaveProperty('strokeWidth');
        expect(link).toHaveProperty('opacity');
        
        switch (link.category) {
          case 'truck':
            expect(link.stroke).toBe('pink');
            expect(link.strokeWidth).toBe(4);
            expect(link.strokeDashArray).toBeNull();
            break;
          case 'airplane':
            expect(link.stroke).toBe('brown');
            expect(link.strokeWidth).toBe(2);
            expect(link.strokeDashArray).toEqual([6, 3]);
            break;
          case 'ship':
            expect(link.stroke).toBe('blue');
            expect(link.strokeWidth).toBe(1);
            expect(link.strokeDashArray).toEqual([2, 4]);
            break;
        }
      });
    });

    it('should not create links between same city', () => {
      const cities = [mockCities[0], mockCities[0]]; // Same city twice
      const links = createShippingLinks(cities);
      
      expect(links).toHaveLength(0);
    });

    it('should include correct label text', () => {
      const cities = [mockCities[0], mockCities[1]];
      const links = createShippingLinks(cities);
      
      expect(links[0].text).toMatch(/New York → London by/);
    });
  });
});