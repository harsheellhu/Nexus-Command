export interface TrafficEvent {
  time: string;
  source: string;
  message: string;
  impact: number;
  isCritical: boolean;
}

export const CRITICAL_EVENTS: TrafficEvent[] = [
  { time: '08:14:22', source: 'Sensor KUD-01', message: 'Sudden speed drop detected on Kudasan-Sargasan Road.', impact: 1, isCritical: true },
  { time: '08:15:05', source: '108 Dispatch', message: 'Multiple calls reporting collision near Kudasan Crossroad.', impact: 1, isCritical: true },
  { time: '08:16:12', source: 'Camera SG-12', message: 'Visual confirmation: Multi-vehicle pileup, 2 lanes blocked towards Sargasan.', impact: 2, isCritical: true },
  { time: '08:18:30', source: 'Traffic Police', message: 'Unit 4 on scene. Requesting ambulance and heavy tow. Closing 3 lanes.', impact: 3, isCritical: true },
  { time: '08:20:45', source: 'Sensor SAR-02', message: 'Severe backup extending past Sargasan Crossroad.', impact: 4, isCritical: true },
  { time: '08:23:10', source: 'Fire Dept', message: 'Rescue team on scene. Extrication required.', impact: 4, isCritical: true },
  { time: '08:26:00', source: 'EMS', message: 'Two ambulances on scene. Preparing for transport to Civil Hospital.', impact: 4, isCritical: true },
  { time: '08:30:15', source: 'Traffic Police', message: 'Establishing hard closure at Kudasan. Diverting traffic to PDEU and GIFT City.', impact: 5, isCritical: true },
];

export const IMPACT_LINES = [
  // Impact 1: Just the intersection (Kudasan)
  { positions: [[23.1885, 72.6285], [23.1880, 72.6275], [23.1870, 72.6260]] as [number, number][], color: '#ef4444' },
  // Impact 2: Extending towards Sargasan
  { positions: [[23.1870, 72.6260], [23.1860, 72.6240], [23.1850, 72.6220]] as [number, number][], color: '#ef4444' },
  // Impact 3: Extending further to Sargasan Crossroad
  { positions: [[23.1850, 72.6220], [23.1840, 72.6190], [23.1833, 72.6167]] as [number, number][], color: '#f97316' },
];

export function generateMassiveDataset(): TrafficEvent[] {
  const data: TrafficEvent[] = [];
  const SOURCES = ['Sensor KUD-01', 'Sensor SAR-02', 'Camera GC-05', 'Camera PD-02', '108 Dispatch', 'Traffic Police', 'GMC VMS', 'Google Maps API', 'GSRTC Auth', 'Traffic Cam 04', 'Sensor BH-03'];
  const MESSAGES = [
    'Traffic volume nominal on SG Highway.', 'Average speed 40 km/h near GIFT City.', 'Average speed 35 km/h at Sargasan.', 'Average speed 45 km/h near PDEU.',
    'No anomalies detected at Bhaijipura.', 'Pedestrian volume high at Kudasan crosswalk.', 'BRTS lane clear.',
    'Minor congestion cleared near Infocity.', 'Routine patrol active on CH Road.', 'Signal cycle normal at Raksha Shakti.',
    'System heartbeat OK.', 'Camera feed stable.', 'VMS displaying default safety message.',
    'Intersection clear at K-7.', 'Flow rate steady at 800 veh/hr.', 'Weather conditions optimal, visibility clear.'
  ];

  let baseTime = new Date();
  baseTime.setHours(4, 0, 0, 0);

  // Generate 8000 background events
  for (let i = 0; i < 8000; i++) {
    baseTime = new Date(baseTime.getTime() + Math.random() * 2000 + 500);
    data.push({
      time: baseTime.toTimeString().split(' ')[0],
      source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
      message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      impact: 0,
      isCritical: false
    });
  }

  // Inject critical events near the end (starting at index 7855, spaced out by 12 events)
  let criticalIndex = 0;
  for (let i = 7855; i < 7950; i += 12) {
    if (criticalIndex < CRITICAL_EVENTS.length) {
      data[i] = CRITICAL_EVENTS[criticalIndex];
      criticalIndex++;
    }
  }

  return data;
}
