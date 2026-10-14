export interface PoliceUnit {
  id: string;
  name: string;
  type: 'PCR_VAN' | 'CHECKPOST' | 'POLICE_STATION';
  location: { lat: number; lng: number };
  contactNumber: string;
  state: string;
  district: string;
}

export const nearbyPoliceUnits: Record<string, PoliceUnit[]> = {
  'AP03TC4590': [
    {
      id: 'PCR-AP-001',
      name: 'PCR Van #AP-142',
      type: 'PCR_VAN',
      location: { lat: 13.2000, lng: 80.2500 },
      contactNumber: '+91-44-2345-6789',
      state: 'Andhra Pradesh / Tamil Nadu Border',
      district: 'Tiruvallur',
    },
    {
      id: 'CP-AP-001',
      name: 'Tada Highway Checkpost',
      type: 'CHECKPOST',
      location: { lat: 13.1500, lng: 80.1800 },
      contactNumber: '+91-861-234-5678',
      state: 'Andhra Pradesh',
      district: 'SPSR Nellore',
    },
  ],
  'DL04CA8821': [
    {
      id: 'PCR-DL-001',
      name: 'PCR Van #DL-307',
      type: 'PCR_VAN',
      location: { lat: 28.5600, lng: 77.2600 },
      contactNumber: '+91-11-2345-6789',
      state: 'Delhi',
      district: 'South Delhi',
    },
    {
      id: 'PS-DL-001',
      name: 'Nehru Place Police Station',
      type: 'POLICE_STATION',
      location: { lat: 28.5480, lng: 77.2520 },
      contactNumber: '+91-11-2622-0000',
      state: 'Delhi',
      district: 'South East Delhi',
    },
  ],
  'KA01MB1029': [
    {
      id: 'PCR-KA-001',
      name: 'PCR Van #KA-065',
      type: 'PCR_VAN',
      location: { lat: 12.8500, lng: 77.6600 },
      contactNumber: '+91-80-2294-5678',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
    },
    {
      id: 'PS-KA-001',
      name: 'Electronic City Police Station',
      type: 'POLICE_STATION',
      location: { lat: 12.8450, lng: 77.6680 },
      contactNumber: '+91-80-2852-0000',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
    },
  ],
  'MH02FZ3311': [
    {
      id: 'PCR-MH-001',
      name: 'PCR Van #MH-211',
      type: 'PCR_VAN',
      location: { lat: 19.0300, lng: 72.8300 },
      contactNumber: '+91-22-2626-1111',
      state: 'Maharashtra',
      district: 'Mumbai City',
    },
    {
      id: 'PS-MH-001',
      name: 'Bandra Police Station',
      type: 'POLICE_STATION',
      location: { lat: 19.0596, lng: 72.8295 },
      contactNumber: '+91-22-2640-0000',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
    },
  ],
};

export const statePoliceDepartments = [
  'Delhi Police',
  'Maharashtra Police',
  'Karnataka Police',
  'Tamil Nadu Police',
  'Andhra Pradesh Police',
  'Uttar Pradesh Police',
  'Rajasthan Police',
  'Gujarat Police',
  'West Bengal Police',
  'Madhya Pradesh Police',
  'Kerala Police',
  'Telangana Police',
  'Punjab Police',
  'Haryana Police',
  'Bihar Police',
  'Odisha Police',
  'Jharkhand Police',
  'Chhattisgarh Police',
  'Assam Police',
  'Himachal Pradesh Police',
  'Goa Police',
  'CBI (Central Bureau of Investigation)',
  'NIA (National Investigation Agency)',
];
