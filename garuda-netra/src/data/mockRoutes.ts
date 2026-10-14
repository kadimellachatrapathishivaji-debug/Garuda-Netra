import { RoutePoint } from '../types';
import { buildRoadRoutePoints } from '../services/roadRoutingService';

// Raw road coordinates following Renigunta Road (NH716), Swarnamukhi Bridge, Naidupeta, and NH48 to Chennai
const rawTirupatiChennaiRoad: [number, number][] = [
  // Tirupati City Center -> Renigunta Road (NH716)
  [13.6288, 79.4192], // Tirupati Central / Railway Station
  [13.6292, 79.4225], // Tilak Road
  [13.6298, 79.4265], // Ramanuja Circle
  [13.6305, 79.4300], // Near RTC Central Bus Stand
  [13.6315, 79.4340], // Korlagunta Junction
  [13.6330, 79.4385], // Leela Mahal Road intersection
  [13.6345, 79.4435], // Leela Mahal Circle
  [13.6355, 79.4485], // Renigunta Road (NH716)
  [13.6365, 79.4545], // Bhavani Nagar
  [13.6372, 79.4605], // Korlagunta East
  [13.6378, 79.4670], // Mangalam / Tirupati Airport Road turning
  [13.6384, 79.4740], // Settipalli Road
  [13.6390, 79.4820], // Karakambadi cross
  [13.6396, 79.4905], // Settipalli Highway Stretch
  [13.6402, 79.4990], // Renigunta Highway Approach
  [13.6408, 79.5075], // Renigunta Town Border
  [13.6415, 79.5150], // Renigunta Railway Overbridge (Over rail tracks, not through them)
  [13.6420, 79.5220], // Renigunta Junction (NH716 / NH71 intersection)
  
  // Renigunta -> Srikalahasti along NH716
  [13.6435, 79.5320], // Renigunta East Bypass
  [13.6455, 79.5440], // Gajulamandyam Industrial Area
  [13.6480, 79.5580], // NH716 4-Lane Highway
  [13.6515, 79.5720], // Tirupati Airport Bypass exit
  [13.6555, 79.5870], // Swarnamukhi Valley Corridor
  [13.6600, 79.6030], // Yerpedu Approach
  [13.6650, 79.6210], // Yerpedu Junction NH716
  [13.6705, 79.6390], // Yerpedu Bypass
  [13.6765, 79.6570], // Towards Swarnamukhi Bridge
  [13.6830, 79.6730], // Swarnamukhi River Bridge Approach
  [13.6890, 79.6890], // Swarnamukhi River Bridge Crossing (Along the road bridge)
  [13.6955, 79.7050], // Rachagunneri West
  [13.7030, 79.7220], // Rachagunneri Center
  [13.7120, 79.7390], // Srikalahasti Highway Stretch
  [13.7220, 79.7560], // Srikalahasti Bypass South
  [13.7320, 79.7730], // Srikalahasti Bypass Central
  [13.7390, 79.7910], // Srikalahasti - Naidupeta Road (NH716)
  [13.7430, 79.8080], // Srikalahasti NH716 Toll Plaza
  [13.7460, 79.8260], // Towards Naidupeta
  [13.7490, 79.8460], // NH716 Highway
  [13.7525, 79.8680], // Tottambedu Road
  [13.7560, 79.8910], // Tottambedu Bypass
  [13.7600, 79.9150], // Kasaram West
  [13.7640, 79.9400], // Kasaram
  [13.7680, 79.9650], // Approaching Golden Quadrilateral
  [13.7715, 79.9920], // Naidupeta Bypass Approach
  [13.7740, 80.0200], // Naidupeta West
  [13.7750, 80.0400], // Naidupeta Grand Trunk Road Junction (Merges onto NH48)
  
  // Golden Quadrilateral (NH48 / AH45) -> Chennai 6-Lane National Highway
  [13.7550, 80.0480], // NH48 Naidupeta South
  [13.7300, 80.0550], // NH48 Naidupeta Toll Plaza
  [13.7000, 80.0630], // Menakuru Industrial Corridor
  [13.6650, 80.0710], // NH48 Pellakur
  [13.6300, 80.0800], // Doravarisatram Bypass
  [13.5950, 80.0890], // Approaching Sullurupeta
  [13.5650, 80.0980], // Sullurupeta / ISRO Spaceport Highway Cross
  [13.5350, 80.1070], // Tada North
  [13.5050, 80.1160], // Tada / Pulicat Lake Elevated Highway Bridge
  [13.4800, 80.1230], // AP - Tamil Nadu Inter-State Border Checkpost
  [13.4500, 80.1310], // Gummidipoondi North
  [13.4200, 80.1390], // Elavur Toll Plaza
  [13.3850, 80.1490], // Gummidipoondi Industrial SIPCOT
  [13.3500, 80.1580], // Gummidipoondi Bypass
  [13.3100, 80.1680], // Kavarapettai
  [13.2700, 80.1760], // Thatchur Junction (Outer Ring Road Cross)
  [13.2300, 80.1830], // Karanodai Kosasthalaiyar River Bridge
  [13.1950, 80.1890], // Red Hills / Puzhal Toll Plaza
  [13.1600, 80.1940], // Puzhal Elevated Highway
  [13.1250, 80.1980], // Surapet / Chennai Bypass Junction
  [13.0950, 80.2030], // Madhavaram Flyover
  [13.0700, 80.2100], // Chennai Koyambedu Central Terminal
];

// Raw road coordinates for Delhi NCR circuit (C-Hexagon -> Mathura Road -> DND Flyway -> Noida -> Ring Road)
const rawDelhiNCRRoad: [number, number][] = [
  [28.6129, 77.2295], // India Gate C-Hexagon
  [28.6110, 77.2320], // C-Hexagon Southeast
  [28.6080, 77.2355], // Dr Zakir Hussain Marg
  [28.6030, 77.2405], // Delhi Golf Club Road
  [28.5975, 77.2455], // Mathura Road (NH44)
  [28.5910, 77.2495], // Sunder Nagar / Nizamuddin Dargah approach
  [28.5840, 77.2530], // Hazrat Nizamuddin Overbridge
  [28.5775, 77.2575], // Barapullah Elevated corridor approach
  [28.5710, 77.2625], // Ashram Chowk Flyover / Underpass
  [28.5685, 77.2720], // Maharani Bagh / Ring Road
  [28.5670, 77.2830], // DND Flyway Delhi Toll Gate approach
  [28.5650, 77.2950], // DND Flyway Yamuna Bridge West
  [28.5630, 77.3070], // DND Flyway Yamuna River Crossing (Directly on the 8-lane road bridge)
  [28.5605, 77.3190], // DND Flyway Yamuna East
  [28.5580, 77.3300], // DND Toll Plaza Noida
  [28.5640, 77.3270], // Noida Sector 15A
  [28.5700, 77.3230], // Noida Sector 18 Commercial Center / Metro corridor
  [28.5750, 77.3170], // Captain Gaur Marg
  [28.5810, 77.3100], // Mayur Vihar Link Road
  [28.5880, 77.3020], // Noida Link Road Flyover
  [28.5960, 77.2910], // Akshardham Highway (NH24 / NH9)
  [28.6040, 77.2780], // Nizamuddin Bridge over Yamuna (NH9)
  [28.6110, 77.2630], // Sarai Kale Khan Ring Road
  [28.6135, 77.2500], // Pragati Maidan Tunnel / Bhairon Marg
  [28.6140, 77.2390], // Tilak Marg
  [28.6129, 77.2295], // Return to India Gate C-Hexagon
];

// Raw road coordinates for Bengaluru Electronic City Expressway
const rawBengaluruRoad: [number, number][] = [
  [12.8399, 77.6770], // Electronic City Toll Gate
  [12.8480, 77.6720], // Electronic City Elevated Highway (Hosur Road NH44)
  [12.8620, 77.6650], // Beratena Agrahara
  [12.8800, 77.6530], // Kudlu Gate Flyover
  [12.8980, 77.6410], // Garebhavipalya
  [12.9120, 77.6320], // Bommanahalli Junction
  [12.9175, 77.6230], // Central Silk Board Junction
];

// Compile into road-following RoutePoints with proper bearings and highway speeds
export const tirupatiChennaiRoute: RoutePoint[] = buildRoadRoutePoints(rawTirupatiChennaiRoad, 58);
export const delhiNCRRoute: RoutePoint[] = buildRoadRoutePoints(rawDelhiNCRRoad, 45);
export const bengaluruLastKnown: RoutePoint[] = buildRoadRoutePoints(rawBengaluruRoad, 0);
export const mumbaiNoGPS: RoutePoint[] = [];

export const vehicleRoutes: Record<string, RoutePoint[]> = {
  'AP03TC4590': tirupatiChennaiRoute,
  'DL04CA8821': delhiNCRRoute,
  'KA01MB1029': bengaluruLastKnown,
  'MH02FZ3311': mumbaiNoGPS,
};
