/**
 * Demo project — always available in Brahmastra for stakeholder demos.
 * Has all BOQ scopes active so every tool is unlocked.
 */
import type { BrahmastraProject, BOQProject } from '../types';

const DEMO_ID = 'demo_project_beyond_hq';

const boqData: BOQProject = {
  id: DEMO_ID,
  name: 'Beyond HQ — Full Demo',
  client: 'Beyond Alliance',
  location: 'BKC, Mumbai',
  projectCode: 'BA-DEMO-001',
  rooms: [
    { id: 'demo_r0', name: 'Foyer',           order: 0 },
    { id: 'demo_r1', name: 'Living Room',     order: 1 },
    { id: 'demo_r2', name: 'Theatre Room',    order: 2 },
    { id: 'demo_r3', name: 'Master Bedroom',  order: 3 },
    { id: 'demo_r4', name: 'Conference Room', order: 4 },
    { id: 'demo_r5', name: 'Server Room',     order: 5 },
  ],
  lineItems: [
    // Lighting — triggers visual-calibration + thermal-load + airflow + system-responsiveness
    { id: 'di_0',  scope: 'Backend Lighting',     product: 'Dali Tunable',         brand: 'Philips',   modelNumber: 'DALI-T',   specs: '',  notes: '', canonicalKey: 'lighting.dali-tunable',    included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r1', qty: 10 }, { roomId: 'demo_r3', qty: 8 }] },
    { id: 'di_1',  scope: 'Backend Lighting',     product: 'Dali Dimmable',        brand: 'Philips',   modelNumber: 'DALI-D',   specs: '',  notes: '', canonicalKey: 'lighting.dali-dimmable',   included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r4', qty: 6 }] },
    { id: 'di_2',  scope: 'Backend Lighting',     product: 'Fan - Speed Control',  brand: 'Schneider', modelNumber: 'FAN-SC',   specs: '',  notes: '', canonicalKey: 'lighting.fan-speed',       included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r1', qty: 2 }, { roomId: 'demo_r3', qty: 1 }] },
    // AC — triggers thermal-load + airflow + system-responsiveness
    { id: 'di_3',  scope: 'Temp / AC',            product: 'AC',                   brand: 'Daikin',    modelNumber: 'VRV-IV',   specs: '',  notes: '', canonicalKey: 'ac.ac',                    included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r1', qty: 2 }, { roomId: 'demo_r2', qty: 1 }, { roomId: 'demo_r3', qty: 2 }, { roomId: 'demo_r4', qty: 3 }] },
    // Motors
    { id: 'di_4',  scope: 'Motors',               product: 'Roman Blinds',         brand: 'Somfy',     modelNumber: 'RTS',      specs: '',  notes: '', canonicalKey: 'motors.roman-blinds',      included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r1', qty: 3 }, { roomId: 'demo_r3', qty: 2 }] },
    // AV — Theatre: projector + screen + speakers + sub → visual + speaker + av-commissioning
    { id: 'di_5',  scope: 'AV',                   product: 'Projector',            brand: 'Sony',      modelNumber: 'VPL-XW70', specs: '',  notes: '', canonicalKey: 'av.projector',             included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r2', qty: 1 }] },
    { id: 'di_6',  scope: 'AV',                   product: 'Motorized Screen',     brand: 'Screen Int',modelNumber: 'SI-140',   specs: '',  notes: '', canonicalKey: 'av.motorized-screen',      included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r2', qty: 1 }] },
    { id: 'di_7',  scope: 'AV',                   product: 'Projector Lift',       brand: 'Future Auto',modelNumber:'PL-400',   specs: '',  notes: '', canonicalKey: 'av.proj-lift',             included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r2', qty: 1 }] },
    { id: 'di_8',  scope: 'AV',                   product: 'Amplifier',            brand: 'Anthem',    modelNumber: 'MRX-1140', specs: '',  notes: '', canonicalKey: 'av.amplifier',             included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r2', qty: 1 }] },
    { id: 'di_9',  scope: 'AV',                   product: 'Speakers',             brand: 'Triad',     modelNumber: 'OW6',      specs: '',  notes: '', canonicalKey: 'av.speakers',              included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r2', qty: 7 }, { roomId: 'demo_r4', qty: 4 }] },
    { id: 'di_10', scope: 'AV',                   product: 'Woofer / Subwoofer',   brand: 'SVS',       modelNumber: 'SB-4000',  specs: '',  notes: '', canonicalKey: 'av.subwoofer',             included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r2', qty: 2 }] },
    { id: 'di_11', scope: 'AV',                   product: 'AVR / Streamer',       brand: 'Savant',    modelNumber: 'SSR-1',    specs: '',  notes: '', canonicalKey: 'av.avr-streamer',          included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r2', qty: 1 }, { roomId: 'demo_r1', qty: 1 }] },
    { id: 'di_12', scope: 'AV',                   product: 'TV',                   brand: 'Samsung',   modelNumber: 'QN85QN90C',specs: '', notes: '', canonicalKey: 'av.tv',                    included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r1', qty: 1 }, { roomId: 'demo_r3', qty: 1 }, { roomId: 'demo_r4', qty: 2 }] },
    // Networking — triggers network-quality + wifi-signal
    { id: 'di_13', scope: 'Networking',           product: 'Access Point',         brand: 'Ubiquiti',  modelNumber: 'U6-Pro',   specs: '',  notes: '', canonicalKey: 'networking.access-point',  included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r0', qty: 1 }, { roomId: 'demo_r1', qty: 2 }, { roomId: 'demo_r2', qty: 1 }, { roomId: 'demo_r3', qty: 1 }, { roomId: 'demo_r4', qty: 2 }, { roomId: 'demo_r5', qty: 2 }] },
    { id: 'di_14', scope: 'Networking',           product: 'POE Switch',           brand: 'Ubiquiti',  modelNumber: 'USW-Pro-24',specs: '', notes: '', canonicalKey: 'networking.poe-switch',    included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r5', qty: 2 }] },
    { id: 'di_15', scope: 'Networking',           product: 'Dual WAN Firewall',    brand: 'Ubiquiti',  modelNumber: 'UDM-Pro',  specs: '',  notes: '', canonicalKey: 'networking.dual-wan-firewall', included: true, isCustom: false, roomAllocations: [{ roomId: 'demo_r5', qty: 1 }] },
    // Security — CCTV + VDP
    { id: 'di_16', scope: 'Integrated Security',  product: 'CCTV',                 brand: 'Hikvision', modelNumber: 'DS-2CD',   specs: '',  notes: '', canonicalKey: 'security.cctv',            included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r0', qty: 4 }, { roomId: 'demo_r4', qty: 2 }, { roomId: 'demo_r5', qty: 2 }] },
    { id: 'di_17', scope: 'Integrated Security',  product: 'VDP',                  brand: 'Comelit',   modelNumber: 'VIP-900',  specs: '',  notes: '', canonicalKey: 'security.vdp',             included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r0', qty: 1 }] },
    { id: 'di_18', scope: 'Integrated Security',  product: 'Readers',              brand: 'HID',       modelNumber: 'RP40',     specs: '',  notes: '', canonicalKey: 'security.readers',         included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r0', qty: 2 }, { roomId: 'demo_r4', qty: 1 }] },
    // Backend — triggers thermal-load + airflow
    { id: 'di_19', scope: 'Backend Infrastructure', product: 'Networking Rack',    brand: 'APC',       modelNumber: 'AR3150',   specs: '',  notes: '', canonicalKey: 'backend.networking-rack',  included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r5', qty: 1 }] },
    { id: 'di_20', scope: 'Backend Infrastructure', product: 'Automation DB',      brand: 'Rittal',    modelNumber: 'TS-8',     specs: '',  notes: '', canonicalKey: 'backend.automation-db',    included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r5', qty: 1 }] },
    // Processor — triggers system-responsiveness
    { id: 'di_21', scope: 'Processors',           product: 'Crestron',             brand: 'Crestron',  modelNumber: 'CP4',      specs: '',  notes: '', canonicalKey: 'processors.crestron',      included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r5', qty: 1 }] },
    // Front end
    { id: 'di_22', scope: 'Front End',            product: '8 Button Keypad',      brand: 'Basalte',   modelNumber: 'Sentido',  specs: '',  notes: '', canonicalKey: 'frontend.keypad-8btn',     included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r1', qty: 2 }, { roomId: 'demo_r2', qty: 1 }, { roomId: 'demo_r3', qty: 1 }] },
    { id: 'di_23', scope: 'Sensors',              product: 'Motion Sensors',       brand: 'Crestron',  modelNumber: 'CEN-ODT',  specs: '',  notes: '', canonicalKey: 'sensors.motion',           included: true,  isCustom: false, roomAllocations: [{ roomId: 'demo_r1', qty: 2 }, { roomId: 'demo_r2', qty: 1 }] },
  ],
};

export const DEMO_PROJECT: BrahmastraProject = {
  id: DEMO_ID,
  name: 'Beyond HQ — Full Demo',
  client: 'Beyond Alliance',
  location: 'BKC, Mumbai',
  projectCode: 'BA-DEMO-001',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  boqData,
  // All tools — will be re-computed from BOQ but set explicitly so it's always correct
  activeToolIds: [
    'visual-calibration',
    'speaker-calibration',
    'network-quality',
    'wifi-signal',
    'thermal-load',
    'airflow',
    'system-responsiveness',
    'av-commissioning',
    'reliability-score',
  ],
};

/**
 * Ensures the demo project is always present in Brahmastra storage.
 * Call this on app startup. Safe to call multiple times.
 */
export function ensureDemoProject(): void {
  try {
    const raw = localStorage.getItem('brahmastra_projects');
    const projects: BrahmastraProject[] = raw ? JSON.parse(raw) : [];
    const exists = projects.some((p) => p.id === DEMO_ID);
    if (!exists) {
      projects.unshift(DEMO_PROJECT);
      localStorage.setItem('brahmastra_projects', JSON.stringify(projects));
    }
  } catch {
    // ignore
  }
}
