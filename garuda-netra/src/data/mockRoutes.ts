import { RoutePoint } from '../types';

// AP03TC4590 - Tata Prima on Tirupati-Chennai Highway (NH48)
export const tirupatiChennaiRoute: RoutePoint[] = [
  { lat: 13.6288, lng: 79.4192, speed: 55, heading: 105 },  // Near Tirupati
  { lat: 13.5900, lng: 79.5200, speed: 62, heading: 110 },
  { lat: 13.5500, lng: 79.6300, speed: 58, heading: 108 },
  { lat: 13.5100, lng: 79.7400, speed: 65, heading: 105 },
  { lat: 13.4700, lng: 79.8500, speed: 60, heading: 100 },
  { lat: 13.4200, lng: 79.9600, speed: 55, heading: 95 },
  { lat: 13.3600, lng: 80.0500, speed: 70, heading: 100 },
  { lat: 13.3000, lng: 80.1400, speed: 45, heading: 105 },  // Approaching Srikalahasti
  { lat: 13.2400, lng: 80.2200, speed: 68, heading: 108 },
  { lat: 13.1800, lng: 80.2800, speed: 55, heading: 115 },
  { lat: 13.1200, lng: 80.2000, speed: 60, heading: 150 },  // Near Tada
  { lat: 13.0600, lng: 80.1600, speed: 50, heading: 165 },
  { lat: 13.0000, lng: 80.1800, speed: 42, heading: 140 },
  { lat: 12.9500, lng: 80.2000, speed: 35, heading: 150 },  // Approaching Chennai
  { lat: 12.9000, lng: 80.2200, speed: 30, heading: 160 },
  { lat: 12.8600, lng: 80.2400, speed: 25, heading: 170 },  // Chennai outskirts
];

// DL04CA8821 - Hyundai Creta in Delhi NCR
export const delhiNCRRoute: RoutePoint[] = [
  { lat: 28.6139, lng: 77.2090, speed: 35, heading: 180 },  // India Gate
  { lat: 28.6000, lng: 77.2200, speed: 40, heading: 150 },
  { lat: 28.5850, lng: 77.2350, speed: 45, heading: 135 },  // Lodhi Road
  { lat: 28.5700, lng: 77.2500, speed: 30, heading: 120 },
  { lat: 28.5600, lng: 77.2700, speed: 50, heading: 100 },  // Near Nehru Place
  { lat: 28.5450, lng: 77.2850, speed: 55, heading: 110 },
  { lat: 28.5300, lng: 77.3000, speed: 60, heading: 120 },  // Noida Expressway approach
  { lat: 28.5200, lng: 77.3200, speed: 70, heading: 100 },
  { lat: 28.5350, lng: 77.3500, speed: 80, heading: 75 },   // DND Flyway
  { lat: 28.5500, lng: 77.3700, speed: 65, heading: 45 },
  { lat: 28.5700, lng: 77.3600, speed: 50, heading: 0 },    // Noida Sector 18
  { lat: 28.5850, lng: 77.3300, speed: 35, heading: 320 },
  { lat: 28.6000, lng: 77.3100, speed: 40, heading: 300 },
  { lat: 28.6200, lng: 77.2800, speed: 45, heading: 310 },  // Back towards Delhi
  { lat: 28.6300, lng: 77.2500, speed: 30, heading: 280 },
  { lat: 28.6139, lng: 77.2090, speed: 20, heading: 250 },  // Loop back to India Gate
];

// KA01MB1029 - Scorpio (GPS Tampered) - Only last known location
export const bengaluruLastKnown: RoutePoint[] = [
  { lat: 12.8399, lng: 77.6770, speed: 0, heading: 0 },  // Electronic City, Bengaluru (stationary, GPS tampered)
];

// MH02FZ3311 - Pulsar (No GPS) - no route data
export const mumbaiNoGPS: RoutePoint[] = [];

export const vehicleRoutes: Record<string, RoutePoint[]> = {
  'AP03TC4590': tirupatiChennaiRoute,
  'DL04CA8821': delhiNCRRoute,
  'KA01MB1029': bengaluruLastKnown,
  'MH02FZ3311': mumbaiNoGPS,
};
