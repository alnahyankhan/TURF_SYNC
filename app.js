// =========================================================================
// TurfSync — Core Logic (3 Portals, Capacity, Duration, Proximity, 200tk Fee)
// Version 2.0
// =========================================================================

// Global Constants & Pricing Rules
const BASE_PLATFORM_FEE = 200; // Flat 200 Taka for 1 single slot
const EXTRA_SLOT_PLATFORM_FEE = 50; // +50 Taka for every slot beyond 1 single slot

// Platform Fee Tier Calculation Engine:
// 1 slot -> 200 Taka
// 2 slots -> 250 Taka
// 3 slots -> 300 Taka
// N slots -> 200 + (N - 1) * 50 Taka
function calculatePlatformFee(slotCount) {
  const count = parseInt(slotCount) || 1;
  if (count <= 1) return BASE_PLATFORM_FEE;
  return BASE_PLATFORM_FEE + (count - 1) * EXTRA_SLOT_PLATFORM_FEE;
}

// Global State
let activePortal = 'customer'; // 'customer', 'turf', 'platform'
let customerLocation = 'Dhanmondi 27, Dhaka';
let selectedTurf = null;
let selectedGround = null;
let selectedDuration = 1.5; // Fixed 1.5-Hour Slots Standard
let selectedSlots = []; // Array of selected slots for single or multi-slot booking
let selectedSlot = null; // Primary slot for backward compatibility
let selectedPaymentMode = 'PARTIAL'; // 'PARTIAL' or 'FULL'
let appliedDiscount = 0; // Discount in BDT
let discountType = 'NONE';
let currentBooking = null;

// Multi-Ground & Capacity Turf Database
const turfsDatabase = [
  {
    id: 'trf_001',
    name: 'Apex Arena & Sports Complex',
    area: 'Dhanmondi',
    address: 'Road 27 (Old 16), Dhanmondi, Dhaka',
    lat: 23.7540,
    lng: 90.3755,
    distanceKm: 1.2,
    driveTime: '4 mins',
    phone: '+880 1711-223344',
    whatsapp: '8801711223344',
    rating: 4.9,
    reviews: 142,
    depositPercent: 40, // 40% advance required by turf management
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    sportsSupported: ['FOOTBALL', 'CRICKET', 'BADMINTON'],
    grounds: [
      {
        id: 'grd_1a',
        name: 'Ground A',
        sport: 'FOOTBALL',
        format: '5v5',
        capacity: 10,
        surface: 'Artificial Turf 50mm',
        price1h: 2000,
        price1_5h: 2800,
        price2h: 3600
      },
      {
        id: 'grd_1b',
        name: 'Ground B (Championship Pitch)',
        sport: 'FOOTBALL',
        format: '7v7',
        capacity: 14,
        surface: 'Monofilament Turf with Shockpad',
        price1h: 3200,
        price1_5h: 4500,
        price2h: 5800
      },
      {
        id: 'grd_1c',
        name: 'Court C (Indoor Badminton)',
        sport: 'BADMINTON',
        format: 'Singles / Doubles',
        capacity: 4,
        surface: 'BWF Certified Synthetic Mat',
        price1h: 1200,
        price1_5h: 1700,
        price2h: 2200
      },
      {
        id: 'grd_1d',
        name: 'Pitch D (Box Cricket with Mat)',
        sport: 'CRICKET',
        format: 'Box Cricket / Short Pitch',
        capacity: 12,
        surface: 'Artificial Turf with Heavy Pitch Carpet',
        price1h: 2400,
        price1_5h: 3400,
        price2h: 4400
      }
    ],
    amenities: ['Lockers & Showers', 'Floodlights', 'Free Wi-Fi', 'Juice Bar & Cafe', 'Ample Parking'],
    gallery: {
      photos: [
        { id: 'ph_101', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80', caption: 'Championship Pitch Night View with 4-Corner Floodlights', format: 'JPEG', sizeKb: 480, isCover: true, uploadedAt: '12 Oct 2026' },
        { id: 'ph_102', url: 'https://images.unsplash.com/photo-1529900241451-b05c5830c848?auto=format&fit=crop&w=800&q=80', caption: 'Ground A 5v5 Premium Artificial Turf 50mm Fiber', format: 'PNG', sizeKb: 620, isCover: false, uploadedAt: '12 Oct 2026' },
        { id: 'ph_103', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80', caption: 'Pitch D Box Cricket Overlay Pitch Mat & Net Enclosure', format: 'JPEG', sizeKb: 510, isCover: false, uploadedAt: '13 Oct 2026' },
        { id: 'ph_104', url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80', caption: 'Indoor Badminton Court 1 BWF Approved Synthetic Mat', format: 'PNG', sizeKb: 590, isCover: false, uploadedAt: '13 Oct 2026' },
        { id: 'ph_105', url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80', caption: 'Player Changing Rooms, Warm Showers & Secure Keyed Lockers', format: 'JPEG', sizeKb: 430, isCover: false, uploadedAt: '14 Oct 2026' }
      ],
      videos: [
        { id: 'vid_101', url: 'https://assets.mixkit.co/videos/preview/mixkit-playing-football-in-a-grass-field-41121-large.mp4', title: '5v5 Match Action & Ball Bounce Surface Test', durationSec: 18, format: 'MP4', sizeMb: 3.8, uploadedAt: '14 Oct 2026' }
      ]
    }
  },
  {
    id: 'trf_002',
    name: 'Green Pitch Turf & Arena',
    area: 'Bashundhara',
    address: 'Block I, Main Boulevard, Bashundhara R/A, Dhaka',
    lat: 23.8160,
    lng: 90.4320,
    distanceKm: 8.5,
    driveTime: '24 mins',
    phone: '+880 1819-556677',
    whatsapp: '8801819556677',
    rating: 4.8,
    reviews: 98,
    depositPercent: 50, // 50% advance required
    coverImage: 'https://images.unsplash.com/photo-1529900244929-8f64585122ea?auto=format&fit=crop&w=800&q=80',
    sportsSupported: ['FOOTBALL', 'CRICKET'],
    grounds: [
      {
        id: 'grd_2a',
        name: 'Pitch 1 (6v6 Arena)',
        sport: 'FOOTBALL',
        format: '6v6',
        capacity: 12,
        surface: 'Rubber Infill FIFA Certified Grass',
        price1h: 2600,
        price1_5h: 3600,
        price2h: 4800
      },
      {
        id: 'grd_2b',
        name: 'Pitch 2 (Full Cricket Pitch)',
        sport: 'CRICKET',
        format: 'Full Pitch Match',
        capacity: 16,
        surface: 'Full 22-Yard Turf Matting & Nets',
        price1h: 3800,
        price1_5h: 5200,
        price2h: 6600
      }
    ],
    amenities: ['Changing Rooms', 'Floodlights', 'CCTV Security', 'Dedicated Parking'],
    gallery: {
      photos: [
        { id: 'ph_201', url: 'https://images.unsplash.com/photo-1529900244929-8f64585122ea?auto=format&fit=crop&w=800&q=80', caption: '6v6 Main Field Day Light Surface', format: 'JPEG', sizeKb: 490, isCover: true, uploadedAt: '10 Oct 2026' },
        { id: 'ph_202', url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80', caption: 'Full Cricket Pitch 22 Yards with Nets', format: 'PNG', sizeKb: 580, isCover: false, uploadedAt: '11 Oct 2026' }
      ],
      videos: [
        { id: 'vid_201', url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-soccer-field-at-night-41584-large.mp4', title: 'Bashundhara Arena Drone Floodlight Tour', durationSec: 25, format: 'MP4', sizeMb: 4.5, uploadedAt: '12 Oct 2026' }
      ]
    }
  },
  {
    id: 'trf_003',
    name: 'KickOff & Smash Sports Hub',
    area: 'Uttara',
    address: 'Sector 11, Avenue 4, Uttara, Dhaka',
    lat: 23.8720,
    lng: 90.3990,
    distanceKm: 14.2,
    driveTime: '36 mins',
    phone: '+880 1912-334455',
    whatsapp: '8801912334455',
    rating: 4.7,
    reviews: 64,
    depositPercent: 30, // 30% advance required
    coverImage: 'https://images.unsplash.com/photo-1518604666864-74239527e774?auto=format&fit=crop&w=800&q=80',
    sportsSupported: ['FOOTBALL', 'BADMINTON', 'OTHER'],
    grounds: [
      {
        id: 'grd_3a',
        name: 'Court A (Fast 4v4)',
        sport: 'FOOTBALL',
        format: '4v4',
        capacity: 8,
        surface: 'Compact Synthetic Turf',
        price1h: 1600,
        price1_5h: 2200,
        price2h: 2800
      },
      {
        id: 'grd_3b',
        name: 'Court B (Wooden Badminton 1 & 2)',
        sport: 'BADMINTON',
        format: 'Doubles',
        capacity: 4,
        surface: 'Wooden Indoor Court',
        price1h: 1000,
        price1_5h: 1400,
        price2h: 1800
      }
    ],
    amenities: ['Indoor Arena', 'Equipment Rental', 'Water Dispenser', 'Seating Gallery'],
    gallery: {
      photos: [
        { id: 'ph_301', url: 'https://images.unsplash.com/photo-1518604666864-74239527e774?auto=format&fit=crop&w=800&q=80', caption: 'Wooden Court 1 Badminton Arena', format: 'JPEG', sizeKb: 420, isCover: true, uploadedAt: '08 Oct 2026' }
      ],
      videos: []
    }
  }
];

// =========================================================================
// GROUND-SPECIFIC & SPORTS FIELD INDEPENDENT SLOT SCHEDULES (REQUIREMENT 7)
// =========================================================================
let activeTurfGroundId = 'grd_1a'; // Active ground tab in Turf Management

// Generates 16 standard 1.5-hour slots for any individual ground/sports field
function create16SlotsForGround(groundId, basePrice = 2800) {
  const slotDefinitions = [
    { num: 1, label: 'Slot 1 : 6 Am - 7:30 AM', time: '6:00 AM – 7:30 AM', tier: 'MORNING' },
    { num: 2, label: 'Slot 2 : 7:30 Am - 9:00 AM', time: '7:30 AM – 9:00 AM', tier: 'MORNING' },
    { num: 3, label: 'Slot 3 : 9:00 Am - 10:30 AM', time: '9:00 AM – 10:30 AM', tier: 'MORNING' },
    { num: 4, label: 'Slot 4 : 10:30 Am - 12:00 PM', time: '10:30 AM – 12:00 PM', tier: 'MORNING' },
    { num: 5, label: 'Slot 5 : 12:00 Pm - 1:30 PM', time: '12:00 PM – 1:30 PM', tier: 'AFTERNOON' },
    { num: 6, label: 'Slot 6 : 1:30 Pm - 3:00 PM', time: '1:30 PM – 3:00 PM', tier: 'AFTERNOON' },
    { num: 7, label: 'Slot 7 : 3:00 Pm - 4:30 PM', time: '3:00 PM – 4:30 PM', tier: 'AFTERNOON' },
    { num: 8, label: 'Slot 8 : 4:30 Pm - 6:00 PM', time: '4:30 PM – 6:00 PM', tier: 'AFTERNOON' },
    { num: 9, label: 'Slot 9 : 6:00 Pm - 7:30 PM', time: '6:00 PM – 7:30 PM', tier: 'EVENING' },
    { num: 10, label: 'Slot 10 : 7:30 Pm - 9:00 PM', time: '7:30 PM – 9:00 PM', tier: 'EVENING' },
    { num: 11, label: 'Slot 11 : 9:00 Pm - 10:30 PM', time: '9:00 PM – 10:30 PM', tier: 'EVENING' },
    { num: 12, label: 'Slot 12 : 10:30 Pm - 12:00 AM', time: '10:30 PM – 12:00 AM', tier: 'EVENING' },
    { num: 13, label: 'Slot 13 : 12:00 Am - 1:30 AM', time: '12:00 AM – 1:30 AM', tier: 'NIGHT' },
    { num: 14, label: 'Slot 14 : 1:30 Am - 3:00 AM', time: '1:30 AM – 3:00 AM', tier: 'NIGHT' },
    { num: 15, label: 'Slot 15 : 3:00 Am - 4:30 AM', time: '3:00 AM – 4:30 AM', tier: 'NIGHT' },
    { num: 16, label: 'Slot 16 : 4:30 Am - 6:00 AM', time: '4:30 AM – 6:00 AM', tier: 'NIGHT' }
  ];

  return slotDefinitions.map(def => ({
    id: `sl_${groundId}_${String(def.num).padStart(2, '0')}`,
    slotNumber: def.num,
    groundId: groundId,
    slotLabel: def.label,
    time: def.time,
    tier: def.tier,
    status: 'AVAILABLE',
    duration: 1.5,
    basePrice: basePrice
  }));
}

// Master Multi-Ground Schedule Dictionary (Each ground maintains its OWN slot occupancy)
const groundSchedules = {
  // Ground A (5v5) - Apex Arena
  'grd_1a': create16SlotsForGround('grd_1a', 2800),
  // Ground B (Championship 7v7) - Apex Arena
  'grd_1b': create16SlotsForGround('grd_1b', 4500),
  // Court C (Badminton) - Apex Arena
  'grd_1c': create16SlotsForGround('grd_1c', 1700),
  // Pitch D (Box Cricket) - Apex Arena
  'grd_1d': create16SlotsForGround('grd_1d', 3400)
};

// Seed Ground A Specific Bookings (Slot 2 & Slot 9)
groundSchedules['grd_1a'][1].status = 'BOOKED';
groundSchedules['grd_1a'][1].customer = 'Mirpur Warriors';
groundSchedules['grd_1a'][1].bookingRef = 'TRF-202610-101';
groundSchedules['grd_1a'][1].advance = 1320;
groundSchedules['grd_1a'][1].due = 1680;

groundSchedules['grd_1a'][8].status = 'BOOKED';
groundSchedules['grd_1a'][8].customer = 'Corporate XI';
groundSchedules['grd_1a'][8].bookingRef = 'TRF-202610-208';
groundSchedules['grd_1a'][8].advance = 3000;
groundSchedules['grd_1a'][8].due = 0;

// Seed Ground B Specific Booking (Slot 4 - Notice Ground A Slot 4 remains AVAILABLE!)
groundSchedules['grd_1b'][3].status = 'BOOKED';
groundSchedules['grd_1b'][3].customer = 'Dhanmondi Strikers';
groundSchedules['grd_1b'][3].bookingRef = 'TRF-202610-102';
groundSchedules['grd_1b'][3].advance = 2000;
groundSchedules['grd_1b'][3].due = 2700;

// Seed Court C Specific Booking (Slot 8 - Badminton)
groundSchedules['grd_1c'][7].status = 'BOOKED';
groundSchedules['grd_1c'][7].customer = 'Apex Smashers Club';
groundSchedules['grd_1c'][7].bookingRef = 'TRF-202610-105';
groundSchedules['grd_1c'][7].advance = 1700;
groundSchedules['grd_1c'][7].due = 0;

// Seed Pitch D Specific Booking (Slot 10 - Box Cricket)
groundSchedules['grd_1d'][9].status = 'BOOKED';
groundSchedules['grd_1d'][9].customer = 'Gulshan Cricketers XI';
groundSchedules['grd_1d'][9].bookingRef = 'TRF-202610-108';
groundSchedules['grd_1d'][9].advance = 1400;
groundSchedules['grd_1d'][9].due = 2000;

// Active Calendar Dates for Turf Schedule and Customer Booking
let activeScheduleDate = '2026-10-14';
let customerBookingDate = '2026-10-14';

// Helper to convert Date object to YYYY-MM-DD
function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format ISO date to "14 Oct 2026"
function formatDateDisplay(isoDate) {
  if (!isoDate) return '14 Oct 2026';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(parts[1], 10) - 1] || 'Oct';
  return `${parseInt(parts[2], 10)} ${monthName} ${parts[0]}`;
}

// Helper to get full formatted string like "Wednesday, 14 Oct 2026"
function getFullFormattedDate(isoDate) {
  if (!isoDate) return 'Wednesday, 14 Oct 2026';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[dateObj.getDay()] || '';
  const monthName = months[parseInt(parts[1], 10) - 1] || '';
  return `${dayName}, ${parseInt(parts[2], 10)} ${monthName} ${parts[0]}`;
}

// Generate upcoming 14 days list from base date 2026-10-14
function getUpcomingDays(baseIso = '2026-10-14', count = 14) {
  const [y, m, d] = baseIso.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const list = [];
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < count; i++) {
    const cur = new Date(base);
    cur.setDate(base.getDate() + i);
    const curIso = toISODate(cur);
    let label = '';
    if (i === 0) label = `Today (${cur.getDate()} ${monthsShort[cur.getMonth()]})`;
    else if (i === 1) label = `Tomorrow (${cur.getDate()} ${monthsShort[cur.getMonth()]})`;
    else label = `${daysShort[cur.getDay()]} (${cur.getDate()} ${monthsShort[cur.getMonth()]})`;

    list.push({
      iso: curIso,
      label: label,
      dayNumber: cur.getDate(),
      monthShort: monthsShort[cur.getMonth()],
      dayShort: daysShort[cur.getDay()],
      dateStr: `${cur.getDate()} ${monthsShort[cur.getMonth()]}`
    });
  }
  return list;
}

// Master Multi-Date Multi-Ground Schedule Storage (Key format: `${groundId}__${dateKey}`)
const dailyGroundSchedules = {
  'grd_1a__2026-10-14': groundSchedules['grd_1a'],
  'grd_1b__2026-10-14': groundSchedules['grd_1b'],
  'grd_1c__2026-10-14': groundSchedules['grd_1c'],
  'grd_1d__2026-10-14': groundSchedules['grd_1d']
};

// Seed Tomorrow (15 Oct 2026) for Ground A
const grd1a_oct15 = create16SlotsForGround('grd_1a', 2800);
grd1a_oct15[2].status = 'BOOKED';
grd1a_oct15[2].customer = 'Dhanmondi Dragons FC';
grd1a_oct15[2].bookingRef = 'TRF-202610-312';
grd1a_oct15[2].advance = 1120;
grd1a_oct15[2].due = 1680;

grd1a_oct15[9].status = 'BOOKED';
grd1a_oct15[9].customer = 'Bashundhara Strikers';
grd1a_oct15[9].bookingRef = 'TRF-202610-315';
grd1a_oct15[9].advance = 2800;
grd1a_oct15[9].due = 0;

grd1a_oct15[6].status = 'MAINTENANCE';
grd1a_oct15[6].maintenanceReason = 'Turf infill brushing & leveling';
dailyGroundSchedules['grd_1a__2026-10-15'] = grd1a_oct15;

// Seed Tomorrow (15 Oct 2026) for Ground B (7v7 Championship)
const grd1b_oct15 = create16SlotsForGround('grd_1b', 4500);
grd1b_oct15[3].status = 'BOOKED';
grd1b_oct15[3].customer = 'Uttara Gladiators 7s';
grd1b_oct15[3].bookingRef = 'TRF-202610-322';
grd1b_oct15[3].advance = 2000;
grd1b_oct15[3].due = 2500;

grd1b_oct15[9].status = 'BOOKED';
grd1b_oct15[9].customer = 'Dhanmondi Superstars';
grd1b_oct15[9].bookingRef = 'TRF-202610-325';
grd1b_oct15[9].advance = 4500;
grd1b_oct15[9].due = 0;
dailyGroundSchedules['grd_1b__2026-10-15'] = grd1b_oct15;

// Seed Tomorrow (15 Oct 2026) for Court C (Badminton)
const grd1c_oct15 = create16SlotsForGround('grd_1c', 1700);
grd1c_oct15[7].status = 'BOOKED';
grd1c_oct15[7].customer = 'Dhaka Shuttlers Club';
grd1c_oct15[7].bookingRef = 'TRF-202610-331';
grd1c_oct15[7].advance = 800;
grd1c_oct15[7].due = 900;
dailyGroundSchedules['grd_1c__2026-10-15'] = grd1c_oct15;

// Seed Tomorrow (15 Oct 2026) for Pitch D (Box Cricket)
const grd1d_oct15 = create16SlotsForGround('grd_1d', 3400);
grd1d_oct15[10].status = 'BOOKED';
grd1d_oct15[10].customer = 'Night Owls Box Cricket';
grd1d_oct15[10].bookingRef = 'TRF-202610-340';
grd1d_oct15[10].advance = 1500;
grd1d_oct15[10].due = 1900;
dailyGroundSchedules['grd_1d__2026-10-15'] = grd1d_oct15;

// Seed Friday Peak Weekend (16 Oct 2026) for Ground A
const grd1a_oct16 = create16SlotsForGround('grd_1a', 2800);
[1, 5, 8, 9, 10].forEach((idx, i) => {
  const teams = ['Dhanmondi United', 'Gulshan Stars', 'Lalmatia FC', 'Mohammadpur Warriors', 'Tejgaon XI'];
  grd1a_oct16[idx].status = 'BOOKED';
  grd1a_oct16[idx].customer = teams[i];
  grd1a_oct16[idx].bookingRef = `TRF-202610-${410 + i * 5}`;
  grd1a_oct16[idx].advance = i === 2 ? 2800 : 1120;
  grd1a_oct16[idx].due = i === 2 ? 0 : 1680;
});
dailyGroundSchedules['grd_1a__2026-10-16'] = grd1a_oct16;

// Seed Friday Weekend (16 Oct 2026) for Ground B
const grd1b_oct16 = create16SlotsForGround('grd_1b', 4500);
[2, 6, 8, 10].forEach((idx, i) => {
  const teams = ['Championship Lions', 'Bashundhara Titans', 'Gulshan United', 'Dhanmondi Prime 7s'];
  grd1b_oct16[idx].status = 'BOOKED';
  grd1b_oct16[idx].customer = teams[i];
  grd1b_oct16[idx].bookingRef = `TRF-202610-${430 + i * 5}`;
  grd1b_oct16[idx].advance = i === 1 ? 4500 : 2000;
  grd1b_oct16[idx].due = i === 1 ? 0 : 2500;
});
dailyGroundSchedules['grd_1b__2026-10-16'] = grd1b_oct16;

// Seed Friday Weekend (16 Oct 2026) for Court C
const grd1c_oct16 = create16SlotsForGround('grd_1c', 1700);
[4, 8, 11].forEach((idx, i) => {
  const teams = ['Smash Masters', 'Ace Badminton Club', 'Apex Shuttlers'];
  grd1c_oct16[idx].status = 'BOOKED';
  grd1c_oct16[idx].customer = teams[i];
  grd1c_oct16[idx].bookingRef = `TRF-202610-${450 + i * 4}`;
  grd1c_oct16[idx].advance = 1700;
  grd1c_oct16[idx].due = 0;
});
dailyGroundSchedules['grd_1c__2026-10-16'] = grd1c_oct16;

// Seed Friday Weekend (16 Oct 2026) for Pitch D
const grd1d_oct16 = create16SlotsForGround('grd_1d', 3400);
[3, 7, 10, 12].forEach((idx, i) => {
  const teams = ['Sixer Kings Club', 'Tape Ball Tigers', 'Gulshan Strikers', 'Midnight Bowlers'];
  grd1d_oct16[idx].status = 'BOOKED';
  grd1d_oct16[idx].customer = teams[i];
  grd1d_oct16[idx].bookingRef = `TRF-202610-${470 + i * 5}`;
  grd1d_oct16[idx].advance = i === 0 ? 3400 : 1500;
  grd1d_oct16[idx].due = i === 0 ? 0 : 1900;
});
dailyGroundSchedules['grd_1d__2026-10-16'] = grd1d_oct16;

// Seed Saturday Weekend (17 Oct 2026) for Ground A
const grd1a_oct17 = create16SlotsForGround('grd_1a', 2800);
[0, 4, 7, 11].forEach((idx, i) => {
  const teams = ['Early Birds FC', 'Apex Youth Club', 'Corporate Blue FC', 'Midnight Strikers'];
  grd1a_oct17[idx].status = 'BOOKED';
  grd1a_oct17[idx].customer = teams[i];
  grd1a_oct17[idx].bookingRef = `TRF-202610-${520 + i * 4}`;
  grd1a_oct17[idx].advance = i === 3 ? 2800 : 1120;
  grd1a_oct17[idx].due = i === 3 ? 0 : 1680;
});
dailyGroundSchedules['grd_1a__2026-10-17'] = grd1a_oct17;

// Seed Saturday Weekend (17 Oct 2026) for Ground B
const grd1b_oct17 = create16SlotsForGround('grd_1b', 4500);
[1, 5, 9].forEach((idx, i) => {
  const teams = ['Gulshan Saturday XI', 'Apex Masters 7s', 'Prime Kickers'];
  grd1b_oct17[idx].status = 'BOOKED';
  grd1b_oct17[idx].customer = teams[i];
  grd1b_oct17[idx].bookingRef = `TRF-202610-${540 + i * 5}`;
  grd1b_oct17[idx].advance = 2000;
  grd1b_oct17[idx].due = 2500;
});
dailyGroundSchedules['grd_1b__2026-10-17'] = grd1b_oct17;

// Seed Sunday (18 Oct 2026) for Ground A
const grd1a_oct18 = create16SlotsForGround('grd_1a', 2800);
[3, 8].forEach((idx, i) => {
  const teams = ['Banani Kickers', 'Uttara Tigers'];
  grd1a_oct18[idx].status = 'BOOKED';
  grd1a_oct18[idx].customer = teams[i];
  grd1a_oct18[idx].bookingRef = `TRF-202610-${610 + i * 8}`;
  grd1a_oct18[idx].advance = 1120;
  grd1a_oct18[idx].due = 1680;
});
dailyGroundSchedules['grd_1a__2026-10-18'] = grd1a_oct18;

// Deterministic slot populator for arbitrary calendar dates chosen by the user
function populateDeterministicDateSlots(slots, groundId, dateIso) {
  const combinedKey = `${groundId}__${dateIso}`;
  let hash = 0;
  for (let i = 0; i < combinedKey.length; i++) {
    hash = ((hash << 5) - hash) + combinedKey.charCodeAt(i);
  }
  hash = Math.abs(hash);

  const sampleTeams = [
    'Dhanmondi Dragons FC',
    'Gulshan Gladiators',
    'Bashundhara Knights',
    'Uttara United SC',
    'Mohammadpur Strikers',
    'Mirpur Thunderbolts',
    'Corporate XI Sports',
    'Banani Kickers Club',
    'Apex Youth Club',
    'Lalmatia FC',
    'Dhaka Shuttlers XI',
    'All-Stars Sports Club'
  ];

  // Number of bookings depends on day
  const dateObj = new Date(dateIso + 'T00:00:00');
  const dayOfWeek = isNaN(dateObj.getDay()) ? 3 : dateObj.getDay();
  const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6); // Fri/Sat
  const numBooked = isWeekend ? ((hash % 3) + 4) : ((hash % 3) + 2); // 4-6 on weekends, 2-4 on weekdays

  const candidateSlots = [
    (hash % 4),                  // Early Morning
    ((hash * 3) % 4) + 4,         // Afternoon
    ((hash * 7) % 4) + 8,         // Prime Evening
    ((hash * 11) % 4) + 12,       // Night
    ((hash * 13) % 4) + 8,        // Another Prime
    ((hash * 17) % 4) + 4         // Another Afternoon
  ];

  const pickedIndices = [];
  for (let idx of candidateSlots) {
    if (!pickedIndices.includes(idx) && pickedIndices.length < numBooked) {
      pickedIndices.push(idx);
    }
  }

  const gTag = groundId === 'grd_1a' ? 'A' : groundId === 'grd_1b' ? 'B' : groundId === 'grd_1c' ? 'C' : 'D';
  const cleanDate = dateIso.replace(/-/g, '').slice(2); // e.g. 261019

  pickedIndices.forEach((idx, i) => {
    if (slots[idx]) {
      const team = sampleTeams[(hash + i * 3) % sampleTeams.length];
      const slotPrice = slots[idx].basePrice || 2800;
      const refNum = `${cleanDate}-${gTag}${100 + ((hash + i * 37) % 899)}`;
      const isFull = (hash + i) % 3 === 0;
      const adv = isFull ? slotPrice : Math.round(slotPrice * 0.4);
      const due = isFull ? 0 : (slotPrice - adv);

      slots[idx].status = 'BOOKED';
      slots[idx].customer = team;
      slots[idx].bookingRef = `TRF-${refNum}`;
      slots[idx].advance = adv;
      slots[idx].due = due;
    }
  });

  // Occasionally mark 1 slot under maintenance
  if (hash % 3 === 0 && slots[6] && slots[6].status === 'AVAILABLE') {
    slots[6].status = 'MAINTENANCE';
    slots[6].maintenanceReason = 'Pitch infill leveling & net check';
  }
}

// Master Bookings Aggregator for any calendar date across all grounds
function getAllBookingsForDate(dateIso) {
  const apexTurf = turfsDatabase[0];
  const list = [];
  if (!apexTurf || !apexTurf.grounds) return list;

  apexTurf.grounds.forEach(ground => {
    const slots = getSlotsForGround(ground.id, ground.price1_5h, dateIso);
    slots.forEach(slot => {
      if (slot.status === 'BOOKED' && slot.bookingRef) {
        const totalFee = slot.basePrice || ground.price1_5h;
        const advance = slot.advance != null ? slot.advance : Math.round(totalFee * 0.4);
        const due = slot.due != null ? slot.due : (totalFee - advance);
        const isPaid = due === 0;

        let phoneHash = 0;
        for (let c = 0; c < slot.bookingRef.length; c++) {
          phoneHash = ((phoneHash << 5) - phoneHash) + slot.bookingRef.charCodeAt(c);
        }
        const phone = '01712-' + String(Math.abs(phoneHash) % 900000 + 100000);

        list.push({
          ref: slot.bookingRef,
          invoiceNo: `INV-${slot.bookingRef.replace('TRF-', '')}`,
          customerName: slot.customer || 'Registered Player',
          customerPhone: phone,
          turfId: apexTurf.id,
          turfName: apexTurf.name,
          groundId: ground.id,
          groundName: `${ground.name} (${ground.format})`,
          slotId: slot.id,
          slotNumber: slot.slotNumber,
          slotTime: `Slot ${slot.slotNumber} : ${slot.time} (1.5h)`,
          totalFee: totalFee,
          platformFee: 200,
          advancePaid: advance,
          dueAmount: due,
          status: isPaid ? 'PAID IN FULL ONLINE' : 'ARRIVING / PENDING DUE',
          settledAt: isPaid ? `${formatDateDisplay(dateIso)}, 05:00 PM` : null,
          dateIso: dateIso
        });
      }
    });
  });

  // Merge any dynamically created customer bookings from deskBookingsQueue matching this date
  deskBookingsQueue.forEach(db => {
    if (db.dateIso === dateIso && !list.some(x => x.ref === db.ref)) {
      list.unshift(db);
    }
  });

  list.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
  return list;
}

// Live Shift Financial Summary Calculator for active schedule ground & date
function renderTurfShiftFinancialSummary(dateIso) {
  const targetDate = dateIso || activeScheduleDate || '2026-10-14';
  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, targetDate);

  const bookedSlots = slots.filter(s => s.status === 'BOOKED');
  const bookedCount = bookedSlots.length;
  const totalSlots = slots.length;
  const occupancyPct = Math.round((bookedCount / totalSlots) * 100);

  const grossRev = bookedSlots.reduce((sum, s) => sum + (s.basePrice || activeGround.price1_5h), 0);
  const totalAdvance = bookedSlots.reduce((sum, s) => sum + (s.advance || 0), 0);
  const totalDue = bookedSlots.reduce((sum, s) => sum + (s.due || 0), 0);

  const dateLabel = document.getElementById('shift-fin-date-label');
  if (dateLabel) dateLabel.textContent = formatDateDisplay(targetDate);

  const subLabel = document.getElementById('shift-fin-sublabel');
  if (subLabel) subLabel.textContent = `Live shift financials for ${activeGround.name} (${activeGround.format}) on ${getFullFormattedDate(targetDate)}.`;

  const bookedEl = document.getElementById('shift-fin-booked-count');
  if (bookedEl) bookedEl.textContent = `${bookedCount} / ${totalSlots} (${occupancyPct}%)`;

  const grossEl = document.getElementById('shift-fin-gross');
  if (grossEl) grossEl.textContent = `৳${grossRev.toLocaleString()}`;

  const advEl = document.getElementById('shift-fin-advance');
  if (advEl) advEl.textContent = `৳${totalAdvance.toLocaleString()}`;

  const dueEl = document.getElementById('shift-fin-due');
  if (dueEl) dueEl.textContent = `৳${totalDue.toLocaleString()}`;
}

// Venue-wide Dynamic Financial Analytics Calculator for active date
function renderTurfFinancialAnalytics(dateIso) {
  const targetDate = dateIso || activeScheduleDate || '2026-10-14';
  const allBookings = getAllBookingsForDate(targetDate);
  const apexTurf = turfsDatabase[0];

  const grossRevenue = allBookings.reduce((sum, b) => sum + b.totalFee, 0);
  const onlineAdvance = allBookings.reduce((sum, b) => sum + b.advancePaid, 0);
  const duesPending = allBookings.reduce((sum, b) => sum + b.dueAmount, 0);
  const counterCash = Math.max(0, grossRevenue - onlineAdvance - duesPending);

  const dateBadgeText = document.getElementById('turf-analytics-date-text');
  if (dateBadgeText) dateBadgeText.textContent = getFullFormattedDate(targetDate);

  const capDate = document.getElementById('turf-analytics-capacity-date');
  if (capDate) capDate.textContent = formatDateDisplay(targetDate);

  const grossEl = document.getElementById('turf-analytics-gross');
  if (grossEl) grossEl.textContent = `৳${grossRevenue.toLocaleString()}`;

  const advEl = document.getElementById('turf-analytics-advance');
  if (advEl) advEl.textContent = `৳${onlineAdvance.toLocaleString()}`;

  const counterEl = document.getElementById('turf-analytics-counter');
  if (counterEl) counterEl.textContent = `৳${counterCash.toLocaleString()}`;

  const duesEl = document.getElementById('turf-analytics-dues');
  if (duesEl) duesEl.textContent = `৳${duesPending.toLocaleString()}`;

  // Breakdown by Ground Capacity for targetDate
  const breakdownContainer = document.getElementById('turf-analytics-capacity-breakdown');
  if (breakdownContainer && apexTurf && apexTurf.grounds) {
    breakdownContainer.innerHTML = '';
    const colors = ['bg-emerald-500', 'bg-teal-400', 'bg-sky-400', 'bg-indigo-400'];

    apexTurf.grounds.forEach((ground, idx) => {
      const groundBookings = allBookings.filter(b => b.groundId === ground.id);
      const groundGross = groundBookings.reduce((sum, b) => sum + b.totalFee, 0);
      const pct = grossRevenue > 0 ? Math.round((groundGross / grossRevenue) * 100) : 0;
      const barColor = colors[idx % colors.length];

      const row = document.createElement('div');
      row.innerHTML = `
        <div class="flex justify-between text-xs mb-1">
          <span class="text-slate-300 font-medium">${ground.name} (${ground.format} • ${ground.capacity}p) — <span class="text-slate-400 font-mono">${groundBookings.length} slots booked</span></span>
          <span class="font-bold text-white font-mono">৳${groundGross.toLocaleString()} (${pct}%)</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div class="${barColor} h-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
      `;
      breakdownContainer.appendChild(row);
    });
  }
}

// Open native calendar picker helper
function openTurfDatePicker() {
  const input = document.getElementById('turf-schedule-date-input');
  if (input) {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
    }
  }
}

// Getter helper to safely retrieve or create independent slots for any ground and calendar date
function getSlotsForGround(groundId, basePrice = 2800, date = null) {
  const dateKey = date || activeScheduleDate || '2026-10-14';
  const storageKey = `${groundId}__${dateKey}`;
  if (!dailyGroundSchedules[storageKey]) {
    const newSlots = create16SlotsForGround(groundId, basePrice);
    populateDeterministicDateSlots(newSlots, groundId, dateKey);
    dailyGroundSchedules[storageKey] = newSlots;
  }
  return dailyGroundSchedules[storageKey];
}

// Backward compatibility alias for single ground operations
let groundSlots = getSlotsForGround('grd_1a', 2800, '2026-10-14');

// =========================================================================
// ENTERPRISE STORES: PROMOS, USER DIRECTORY, TRASH LOG & COUNTER QUEUE
// =========================================================================

// 1. Platform Promotional Discount Codes (% Discount Capped with Max BDT Amount - Requirement 5)
let platformPromoCodes = [
  {
    code: 'PLAY50',
    type: 'PLATFORM_FEE_PERCENTAGE',
    percent: 50,
    capAmount: 100,
    desc: '50% off platform service charge (capped at ৳100)',
    uses: 42,
    active: true
  },
  {
    code: 'SUPER25',
    type: 'TOTAL_PERCENTAGE',
    percent: 25,
    capAmount: 500,
    desc: '25% off entire match booking (capped at ৳500)',
    uses: 18,
    active: true
  },
  {
    code: 'FREEFEE',
    type: 'PLATFORM_FEE_PERCENTAGE',
    percent: 100,
    capAmount: 300,
    desc: '100% Platform fee waiver promotion (capped at ৳300)',
    uses: 89,
    active: true
  }
];

// 2. Registered Customers / Players Directory (Requirement 4)
let registeredCustomers = [
  { id: 'usr_001', name: 'Al Nahyan Khan', phone: '01712345678', email: 'nahyan@example.com', location: 'Dhanmondi, Dhaka', bookings: 6, joined: '01 Oct 2026', status: 'ACTIVE' },
  { id: 'usr_002', name: 'Tanvir Ahmed', phone: '01819334455', email: 'tanvir@gmail.com', location: 'Bashundhara, Dhaka', bookings: 3, joined: '05 Oct 2026', status: 'ACTIVE' },
  { id: 'usr_003', name: 'Mirpur Warriors Club', phone: '01711998877', email: 'warriors@cricketbd.org', location: 'Mirpur, Dhaka', bookings: 12, joined: '15 Sep 2026', status: 'ACTIVE' },
  { id: 'usr_004', name: 'Corporate XI FC', phone: '01912887766', email: 'sports@corporate.com', location: 'Gulshan, Dhaka', bookings: 8, joined: '20 Sep 2026', status: 'ACTIVE' }
];

// 3. Immutable Deleted Records & Trash Log with Mandatory Justification (Requirement 4)
let deletedRecordsLog = [
  {
    id: 'del_001',
    recordType: 'TURF_FACILITY',
    recordId: 'trf_old_09',
    recordName: 'Old DOHS Mini Turf',
    deletedBy: 'Super Admin (admin@turfsync.com)',
    deletedAt: '12 Oct 2026, 03:40 PM',
    reason: 'Permanent closure due to residential land lease termination',
    ip: '103.145.22.01'
  },
  {
    id: 'del_002',
    recordType: 'CUSTOMER',
    recordId: 'usr_992',
    recordName: 'Shakil Hossain (Duplicate)',
    deletedBy: 'Super Admin (admin@turfsync.com)',
    deletedAt: '13 Oct 2026, 11:15 AM',
    reason: 'Duplicate phone account registration detected and merged into master ID',
    ip: '103.145.22.01'
  }
];

// 4. Redesigned Counter Desk Arrivals & Settlement Queue (Requirement 8)
let deskBookingsQueue = [
  {
    ref: 'TRF-202610-101',
    invoiceNo: 'INV-2026-00101',
    customerName: 'Mirpur Warriors (Capt. Farhan)',
    customerPhone: '01712-998877',
    turfId: 'trf_001',
    turfName: 'Apex Arena & Sports Complex',
    groundId: 'grd_1a',
    groundName: 'Ground A (5v5)',
    slotId: 'sl_grd_1a_02',
    slotTime: 'Slot 2 : 7:30 Am - 9:00 AM (1.5h)',
    totalFee: 3000,
    platformFee: 200,
    advancePaid: 1320,
    dueAmount: 1680,
    status: 'ARRIVING / PENDING DUE',
    settledAt: null
  },
  {
    ref: 'TRF-202610-102',
    invoiceNo: 'INV-2026-00102',
    customerName: 'Dhanmondi Strikers (Capt. Hasan)',
    customerPhone: '01819-334455',
    turfId: 'trf_001',
    turfName: 'Apex Arena & Sports Complex',
    groundId: 'grd_1b',
    groundName: 'Ground B (Championship 7v7)',
    slotId: 'sl_grd_1b_04',
    slotTime: 'Slot 4 : 10:30 Am - 12:00 PM (1.5h)',
    totalFee: 4700,
    platformFee: 200,
    advancePaid: 2000,
    dueAmount: 2700,
    status: 'ARRIVING / PENDING DUE',
    settledAt: null
  },
  {
    ref: 'TRF-202610-208',
    invoiceNo: 'INV-2026-00208',
    customerName: 'Corporate XI (Al Nahyan Khan)',
    customerPhone: '01712-345678',
    turfId: 'trf_001',
    turfName: 'Apex Arena & Sports Complex',
    groundId: 'grd_1a',
    groundName: 'Ground A (5v5)',
    slotId: 'sl_grd_1a_09',
    slotTime: 'Slot 9 : 6:00 Pm - 7:30 PM (1.5h)',
    totalFee: 3000,
    platformFee: 200,
    advancePaid: 3000,
    dueAmount: 0,
    status: 'CONFIRMED / PAID FULL ONLINE',
    settledAt: '14 Oct 2026, 05:15 PM'
  }
];

// 5. User Session & Authentication State (Requirement 2)
let currentUser = {
  role: 'CUSTOMER', // 'CUSTOMER', 'TURF', 'ADMIN'
  name: 'Al Nahyan Khan',
  phone: '01712345678',
  email: 'nahyan@example.com',
  location: 'Dhanmondi, Dhaka',
  turfId: 'trf_001',
  verified: true
};

// 6. Geographic Dhaka Locations Dictionary with Coordinates (Requirement 6)
const dhakaLocations = {
  'Dhanmondi': { lat: 23.7540, lng: 90.3755, label: 'Dhanmondi, Dhaka' },
  'Gulshan': { lat: 23.7925, lng: 90.4150, label: 'Gulshan, Dhaka' },
  'Banani': { lat: 23.7937, lng: 90.4043, label: 'Banani, Dhaka' },
  'Uttara': { lat: 23.8680, lng: 90.3980, label: 'Uttara, Dhaka' },
  'Mirpur': { lat: 23.8050, lng: 90.3650, label: 'Mirpur, Dhaka' },
  'Bashundhara': { lat: 23.8150, lng: 90.4250, label: 'Bashundhara R/A, Dhaka' },
  'Mohammadpur': { lat: 23.7650, lng: 90.3580, label: 'Mohammadpur, Dhaka' },
  'Motijheel': { lat: 23.7330, lng: 90.4170, label: 'Motijheel, Dhaka' }
};

let customerCoords = { lat: 23.7540, lng: 90.3755 };


// Multi-Agent System Audit Logs
let auditLogs = [
  {
    id: 'aud_201',
    timestamp: '14 Oct 2026, 04:30 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_COUNTER (Shift A)',
    action: 'FORCED_DISCOUNT_APPLIED',
    category: 'DISCOUNT',
    target: 'Booking: TRF-202610-101',
    diff: { discount_amount: '৳300', new_due: '৳600' },
    reason: 'Rain delay pitch compensation',
    ip: '103.145.22.18'
  },
  {
    id: 'aud_202',
    timestamp: '14 Oct 2026, 05:15 PM',
    actorName: 'System Webhook',
    actorRole: 'PAYMENT_GATEWAY',
    action: 'ONLINE_ADVANCE_COLLECTED',
    category: 'PAYMENT',
    target: 'Booking: TRF-202610-208',
    diff: { turf_advance: '৳1,000', platform_fee: '৳200 (Retained)' },
    reason: 'Instant customer online checkout via bKash',
    ip: '119.30.38.12'
  },
  {
    id: 'aud_203',
    timestamp: '14 Oct 2026, 06:10 PM',
    actorName: 'Tanvir Ahmed',
    actorRole: 'TURF_MANAGER (Shift B)',
    action: 'DEPOSIT_PERCENT_UPDATED',
    category: 'POLICY',
    target: 'Turf: Apex Arena',
    diff: { field: 'deposit_percent', old_val: '30%', new_val: '40%' },
    reason: 'Increased weekend commitment threshold',
    ip: '103.145.22.99'
  }
];

// Customer Match Invoices (Past bookings)
let customerBookings = [
  {
    ref: 'TRF-202610-842',
    turfName: 'Apex Arena & Sports Complex',
    groundName: 'Ground A (5v5 • 10p)',
    slotCount: 1,
    date: '14 Oct, 2026',
    time: 'Slot 10 : 7:30 Pm - 9:00 PM',
    duration: '1.5 Hours (90 mins)',
    turfFee: 2800,
    platformFee: 200,
    advancePaid: 1320,
    dueAmount: 1680,
    status: 'CONFIRMED'
  },
  {
    ref: 'TRF-202610-795',
    turfName: 'Apex Arena & Sports Complex',
    groundName: 'Ground B (7v7 • 14p)',
    slotCount: 2,
    date: '12 Oct, 2026',
    time: 'Slot 9 : 6:00 Pm - 7:30 PM, Slot 10 : 7:30 Pm - 9:00 PM',
    duration: '3.0 Hours (180 mins)',
    turfFee: 9000,
    platformFee: 250, // 200 base + 50 for 2nd slot
    advancePaid: 3850,
    dueAmount: 5400,
    status: 'COMPLETED'
  },
  {
    ref: 'TRF-202610-711',
    turfName: 'Green Pitch Turf',
    groundName: 'Pitch 1 (6v6 • 12p)',
    slotCount: 1,
    date: '10 Oct, 2026',
    time: 'Slot 9 : 6:00 Pm - 7:30 PM',
    duration: '1.5 Hours (90 mins)',
    turfFee: 3600,
    platformFee: 200,
    advancePaid: 2000,
    dueAmount: 1800,
    status: 'COMPLETED'
  }
];

// =========================================================================
// THEME SYSTEM: DARK & LIGHT MODE
// =========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('turfsync_theme') || 'dark'; // Dark mode is default as per requirements
  applyTheme(savedTheme, false);
}

function applyTheme(theme, showFeedback = false) {
  const isLight = theme === 'light';
  const body = document.body;
  const darkIcon = document.getElementById('theme-icon-dark');
  const lightIcon = document.getElementById('theme-icon-light');
  const themeText = document.getElementById('theme-text');

  if (isLight) {
    if (body) body.classList.add('light-mode');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    if (darkIcon) darkIcon.classList.add('hidden');
    if (lightIcon) lightIcon.classList.remove('hidden');
    if (themeText) themeText.textContent = 'Light';
  } else {
    if (body) body.classList.remove('light-mode');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    if (darkIcon) darkIcon.classList.remove('hidden');
    if (lightIcon) lightIcon.classList.add('hidden');
    if (themeText) themeText.textContent = 'Dark';
  }

  localStorage.setItem('turfsync_theme', theme);

  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }

  if (showFeedback && typeof showToast === 'function') {
    showToast(`Switched to ${isLight ? 'Light' : 'Dark'} Mode`, 'info');
  }
}

function toggleTheme() {
  const isCurrentlyLight = document.body ? document.body.classList.contains('light-mode') : false;
  const nextTheme = isCurrentlyLight ? 'dark' : 'light';
  applyTheme(nextTheme, true);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthSession();
  checkSocialReferral();
  renderCustomerTurfs(turfsDatabase);
  renderCustomerInvoicesTable();
  renderTurfGroundPills();
  renderTurfDateChips();
  renderTurfVisualSlotRack();
  renderTurfScheduleTable();
  renderDeskBookingsQueue();
  renderTurfGalleryManager();
  renderPlatformAdminDashboard();
  renderPlatformSettlementsTable();
  renderPlatformAuditLogs();
  renderPlatformUsersTables();
  renderPlatformDeleteLog();
  renderPlatformPromosTable();
  lucide.createIcons();
});


// ---------------------------------------------------------------------------
// 1. THE 3-PORTAL SWITCHER
// ---------------------------------------------------------------------------
function switchPortal(portal) {
  activePortal = portal;
  document.querySelectorAll('.portal-section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.portal-tab').forEach(b => {
    b.classList.remove('active');
    b.classList.add('text-slate-400');
  });

  const activeBtn = document.getElementById(`btn-portal-${portal}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-slate-400');
  }

  const roleTitle = document.getElementById('current-user-title');
  const roleSub = document.getElementById('current-user-sub');
  const guideTitle = document.getElementById('portal-guide-title');
  const guideDesc = document.getElementById('portal-guide-desc');

  if (portal === 'customer') {
    document.getElementById('portal-customer').classList.remove('hidden');
    if (guideTitle) guideTitle.textContent = 'Player Booking Portal';
    if (guideDesc) guideDesc.textContent = '— Search nearby grounds by capacity, pick 1.5-hour standard match slots (e.g. Slot 1 : 6 Am - 7:30 AM), and pay a partial bKash deposit.';
    renderCustomerTurfs(turfsDatabase);
  } else if (portal === 'turf') {
    document.getElementById('portal-turf').classList.remove('hidden');
    if (guideTitle) guideTitle.textContent = 'Turf Operations & Shift Desk';
    if (guideDesc) guideDesc.textContent = '— Manage court capacity pricing, edit slot timings, collect counter cash dues, and view ground occupancy.';
    renderTurfGroundPills();
    renderTurfScheduleTable();
    renderTurfCapacitiesList();
    renderTurfShiftFinancialSummary();
    renderDeskBookingsQueue();
    renderTurfFinancialAnalytics();
  } else if (portal === 'platform') {
    document.getElementById('portal-platform').classList.remove('hidden');
    if (guideTitle) guideTitle.textContent = 'Platform Super Admin Headquarters';
    if (guideDesc) guideDesc.textContent = '— Platform fee collection ledger (৳200/slot), turf payout settlements, and immutable system-wide audit trail.';
    renderPlatformAdminDashboard();
    renderPlatformUsersTables();
    renderPlatformDeleteLog();
    renderPlatformPromosTable();
  }

  updateSessionHeaderUI();
  lucide.createIcons();
}

// Distance Radius Filter
function setDistanceRadius(maxKm) {
  [0, 3, 10].forEach(k => {
    const btn = document.getElementById(`rad-${k}`);
    if (btn) btn.className = 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white';
  });

  const activeBtn = document.getElementById(`rad-${maxKm}`);
  if (activeBtn) activeBtn.className = 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 text-slate-950';

  let filtered = turfsDatabase;
  if (maxKm > 0) {
    filtered = turfsDatabase.filter(t => t.distanceKm <= maxKm);
  }
  renderCustomerTurfs(filtered);
}

// Sub-Tab Switchers
function switchCustomerSubTab(tab) {
  if (tab === 'browse') {
    document.getElementById('cust-content-browse').classList.remove('hidden');
    document.getElementById('cust-content-analytics').classList.add('hidden');
    document.getElementById('cust-subtab-browse').className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md';
    document.getElementById('cust-subtab-analytics').className = 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-800';
  } else {
    document.getElementById('cust-content-browse').classList.add('hidden');
    document.getElementById('cust-content-analytics').classList.remove('hidden');
    document.getElementById('cust-subtab-analytics').className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md';
    document.getElementById('cust-subtab-browse').className = 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-800';
    renderCustomerInvoicesTable();
  }
  lucide.createIcons();
}

function switchTurfSubTab(tab) {
  const allTabs = ['schedule', 'counter', 'settings', 'gallery', 'analytics'];
  allTabs.forEach(t => {
    const el = document.getElementById(`turf-content-${t}`);
    if (el) el.classList.add('hidden');
    const btn = document.getElementById(`turf-subtab-${t}`);
    if (btn) btn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-800';
  });

  const activeContent = document.getElementById(`turf-content-${tab}`);
  if (activeContent) activeContent.classList.remove('hidden');

  const activeBtn = document.getElementById(`turf-subtab-${tab}`);
  if (activeBtn) activeBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md';
  
  if (tab === 'counter') renderDeskBookingsQueue();
  if (tab === 'schedule') {
    renderTurfDateChips();
    renderTurfVisualSlotRack();
    renderTurfScheduleTable();
    renderTurfShiftFinancialSummary();
  }
  if (tab === 'analytics') renderTurfFinancialAnalytics();
  if (tab === 'gallery') renderTurfGalleryManager();
  lucide.createIcons();
}

function switchPlatformSubTab(tab) {
  const allTabs = ['overview', 'pricing', 'settlements', 'users', 'deletelog', 'promos', 'audit'];
  allTabs.forEach(t => {
    const el = document.getElementById(`plat-content-${t}`);
    if (el) el.classList.add('hidden');
    const btn = document.getElementById(`plat-subtab-${t}`);
    if (btn) btn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-800 shrink-0 cursor-pointer';
  });

  const activeContent = document.getElementById(`plat-content-${tab}`);
  if (activeContent) activeContent.classList.remove('hidden');

  const activeBtn = document.getElementById(`plat-subtab-${tab}`);
  if (activeBtn) activeBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer';

  if (tab === 'pricing') initPlatformPricingManager();
  if (tab === 'users') renderPlatformUsersTables();
  if (tab === 'deletelog') renderPlatformDeleteLog();
  if (tab === 'promos') renderPlatformPromosTable();
  if (tab === 'audit') renderPlatformAuditLogs();
  if (tab === 'settlements') renderPlatformSettlementsTable();
  lucide.createIcons();
}


// ---------------------------------------------------------------------------
// 2. CUSTOMER PORTAL LOGIC & PROXIMITY ENGINE
// ---------------------------------------------------------------------------
function renderCustomerTurfs(turfs) {
  const container = document.getElementById('customer-turfs-container');
  if (!container) return;
  container.innerHTML = '';

  turfs.forEach(turf => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl hover:border-emerald-500/40 transition-all flex flex-col group';

    // Grounds list pills
    const groundsPills = turf.grounds.map(g => `
      <span class="text-[10px] bg-slate-800 text-slate-200 font-medium px-2 py-0.5 rounded-md border border-slate-700/60">
        ${g.name} (${g.format} • ${g.capacity}p)
      </span>
    `).join('');

    card.innerHTML = `
      <div class="relative h-48 overflow-hidden">
        <img src="${turf.coverImage}" alt="${turf.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        
        <!-- Distance Badge (Google Map Radar) -->
        <div class="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
          <i data-lucide="navigation" class="w-3.5 h-3.5 animate-pulse"></i>
          <span>${turf.distanceKm} km away</span>
          <span class="text-slate-400 font-normal">(${turf.driveTime})</span>
        </div>

        <div class="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
          ${turf.depositPercent}% Advance
        </div>

        <div class="absolute bottom-3 left-3 right-3">
          <h3 class="text-lg font-black font-heading text-white">${turf.name}</h3>
          <p class="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
            <i data-lucide="map-pin" class="w-3 h-3 text-emerald-400"></i> ${turf.address}
          </p>
        </div>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Multiple Grounds & Capacities:</span>
          <div class="flex flex-wrap gap-1.5">${groundsPills}</div>
        </div>

        <div class="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Deposit Policy:</span>
          <strong class="text-emerald-400">${turf.depositPercent}% Online Deposit + ৳200 Fee</strong>
        </div>

        <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          <div>
            <span class="text-[10px] text-slate-400 block uppercase font-semibold">1.5h Slot Starts At</span>
            <div class="text-lg font-black font-mono text-emerald-400">
              ৳${turf.grounds[0].price1_5h.toLocaleString()} <span class="text-xs font-normal text-slate-400">/ 1.5h</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="openCustomerGalleryModal('${turf.id}')" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition-all cursor-pointer" title="View Photos & Videos">
              <i data-lucide="image" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Gallery (${turf.gallery ? turf.gallery.photos.length : 0})</span>
            </button>
            <button onclick="openBookingModal('${turf.id}')" class="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
              <span>Book Slot</span>
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
  lucide.createIcons();
}

function filterTurfsCustomer() {
  const sport = document.getElementById('cust-filter-sport').value;
  const cap = document.getElementById('cust-filter-capacity').value;
  const sort = document.getElementById('cust-filter-sort').value;

  let filtered = turfsDatabase.filter(t => {
    const matchSport = sport === 'ALL' || t.sportsSupported.includes(sport);
    let matchCap = true;
    if (cap === '5v5') matchCap = t.grounds.some(g => g.format.includes('5v5'));
    if (cap === '7v7') matchCap = t.grounds.some(g => g.format.includes('7v7'));
    if (cap === 'badminton') matchCap = t.grounds.some(g => g.sport === 'BADMINTON');
    return matchSport && matchCap;
  });

  if (sort === 'distance') {
    filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sort === 'price') {
    filtered.sort((a, b) => a.grounds[0].price1h - b.grounds[0].price1h);
  } else if (sort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  renderCustomerTurfs(filtered);
}

function changeCustomerLocation() {
  openCustomerLocationModal();
}

// ---------------------------------------------------------------------------
// TOAST NOTIFICATION ENGINE
// ---------------------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  const isError = type === 'error';
  
  toast.className = `p-3.5 rounded-2xl border text-xs font-semibold shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${
    isSuccess ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-500/20' :
    isError ? 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-500/20' :
    'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-900/40'
  }`;
  
  const icon = isSuccess ? 'check-circle' : isError ? 'alert-triangle' : 'info';
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0 ${isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-blue-400'}"></i>
    <span class="flex-1">${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---------------------------------------------------------------------------
// 4-STEP WIZARD STEPPER PROGRESS TRACKER
// ---------------------------------------------------------------------------
function updateStepperProgress(activeStep) {
  for (let s = 1; s <= 4; s++) {
    const pill = document.getElementById(`step-pill-${s}`);
    if (!pill) continue;
    const badge = pill.querySelector('span:first-child');
    if (s < activeStep) {
      pill.className = 'p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/60 text-emerald-400 flex items-center justify-center gap-1.5 transition-all shadow-sm';
      if (badge) {
        badge.className = 'w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black';
        badge.textContent = '✓';
      }
    } else if (s === activeStep) {
      pill.className = 'p-2 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-white font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30 transition-all';
      if (badge) {
        badge.className = 'w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[9px] font-black animate-pulse';
        badge.textContent = `${s}`;
      }
    } else {
      pill.className = 'p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center gap-1.5 transition-all';
      if (badge) {
        badge.className = 'w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-black';
        badge.textContent = `${s}`;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. INTERACTIVE BOOKING ENGINE (CAPACITY, DURATION & TIERED PLATFORM FEE)
// ---------------------------------------------------------------------------
function openBookingModal(turfId) {
  selectedTurf = turfsDatabase.find(t => t.id === turfId) || turfsDatabase[0];
  selectedGround = selectedTurf.grounds[0];
  selectedDuration = 1.5; // Always standardized to 1.5-Hour Match Slots
  selectedSlots = [];
  selectedSlot = null;
  appliedDiscount = 0;
  discountType = 'NONE';

  document.getElementById('modal-turf-name').textContent = selectedTurf.name;
  document.getElementById('modal-turf-distance').textContent = `${selectedTurf.distanceKm} km from your location (${selectedTurf.driveTime})`;
  document.getElementById('modal-turf-address').innerHTML = `<i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-400"></i> ${selectedTurf.address}`;

  // Reset 4x4 segment navigation
  activeModalSegment = 'ALL';
  updateModalSegmentPills();

  // Populate Grounds & Capacities
  const groundsContainer = document.getElementById('modal-grounds-container');
  groundsContainer.innerHTML = '';
  selectedTurf.grounds.forEach((g, idx) => {
    const btn = document.createElement('button');
    btn.className = `p-2.5 sm:p-3 rounded-2xl border text-xs font-semibold text-left transition-all flex flex-col justify-between ${
      idx === 0 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
    }`;
    btn.onclick = () => selectGround(g, btn);
    btn.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold text-white">${g.name}</span>
        <span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400 font-mono">${g.format}</span>
      </div>
      <div class="text-[11px] text-slate-400 mt-1">Capacity: <strong>${g.capacity} Players</strong></div>
      <div class="text-[10px] text-emerald-400 font-mono mt-0.5">৳${g.price1_5h.toLocaleString()} / 1.5h</div>
    `;
    groundsContainer.appendChild(btn);
  });

  const priceDisplay = document.getElementById('modal-slot-price-display');
  if (priceDisplay) priceDisplay.textContent = `৳${selectedGround.price1_5h.toLocaleString()}`;

  renderCustomerDateChips();
  updateModalEmergencyBanner();
  renderModalSlots();
  updateSelectedSlotsSummaryUI();
  document.getElementById('quote-card').classList.add('hidden');
  updateStepperProgress(1);

  document.getElementById('booking-modal').classList.remove('hidden');
  document.getElementById('booking-modal').classList.add('flex');
  lucide.createIcons();
}

function renderCustomerDateChips() {
  const container = document.getElementById('modal-date-cards-container') || document.getElementById('modal-date-chips-container');
  if (!container) return;
  container.innerHTML = '';

  const dateInput = document.getElementById('modal-match-date-input');
  if (dateInput) dateInput.value = customerBookingDate;

  const dateDisplay = document.getElementById('modal-active-date-display');
  if (dateDisplay) dateDisplay.textContent = getFullFormattedDate(customerBookingDate);

  const days = getUpcomingDays('2026-10-14', 14);
  days.forEach((day, idx) => {
    const isSelected = day.iso === customerBookingDate;
    const isWeekend = (day.dayShort === 'Fri' || day.dayShort === 'Sat');
    let subLabel = day.dayShort.toUpperCase();
    if (idx === 0) subLabel = 'TODAY';
    else if (idx === 1) subLabel = 'TMRW';

    const card = document.createElement('button');
    card.type = 'button';
    card.id = `cust-date-card-${day.iso}`;
    card.className = `date-tile flex flex-col items-center justify-between p-2 rounded-2xl border transition-all cursor-pointer shrink-0 min-w-[64px] sm:min-w-[72px] h-[72px] sm:h-[78px] ${
      isSelected 
        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300 scale-[1.03]' 
        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
    }`;
    card.onclick = () => handleCustomerSelectBookingDate(day.iso);
    card.innerHTML = `
      <span class="text-[9px] font-bold uppercase tracking-wider ${
        isSelected ? 'text-slate-950/80 font-black' : (isWeekend ? 'text-amber-400' : 'text-slate-400')
      }">${subLabel}</span>
      <span class="text-base sm:text-lg font-black font-mono leading-none my-0.5 ${
        isSelected ? 'text-slate-950' : 'text-white'
      }">${day.dayNumber}</span>
      <span class="text-[9px] font-bold uppercase font-mono ${
        isSelected ? 'text-slate-950/80' : 'text-slate-500'
      }">${day.monthShort}</span>
    `;
    container.appendChild(card);
  });
}

function scrollDateCarousel(type, direction) {
  const containerId = type === 'customer' ? 'modal-date-cards-container' : 'turf-date-cards-container';
  const container = document.getElementById(containerId);
  if (container) {
    const scrollAmount = direction * 220;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

function handleCustomerSelectBookingDate(newDateIso) {
  if (!newDateIso) return;
  customerBookingDate = newDateIso;
  selectedSlots = [];
  selectedSlot = null;
  renderCustomerDateChips();
  renderModalSlots();
  updateSelectedSlotsSummaryUI();
  const quoteCard = document.getElementById('quote-card');
  if (quoteCard) quoteCard.classList.add('hidden');
  const quickBar = document.getElementById('modal-quick-selection-bar');
  if (quickBar) quickBar.classList.add('hidden');
  updateStepperProgress(2);
  showToast(`Match date set to ${getFullFormattedDate(customerBookingDate)}`, 'info');
}

function updateModalEmergencyBanner() {
  const banner = document.getElementById('modal-emergency-banner');
  const titleEl = document.getElementById('modal-emergency-title');
  const descEl = document.getElementById('modal-emergency-desc');
  if (!banner || !titleEl || !descEl) return;

  const groundUnder = selectedGround && selectedGround.isUnderMaintenance;
  const turfUnder = selectedTurf && selectedTurf.isUnderMaintenance;

  if (groundUnder || turfUnder) {
    banner.classList.remove('hidden');
    if (turfUnder) {
      titleEl.textContent = `⚠️ Facility Under Emergency Closure`;
      descEl.textContent = selectedTurf.closureReason || 'Entire venue is temporarily closed today. All ground slots are suspended.';
    } else {
      titleEl.textContent = `⚠️ ${selectedGround.name} Closed for Maintenance`;
      descEl.textContent = selectedGround.closureReason || 'This ground is temporarily closed for maintenance. Slots cannot be booked today.';
    }
  } else {
    banner.classList.add('hidden');
  }
}

function selectGround(ground, clickedBtn) {
  selectedGround = ground;
  selectedSlots = [];
  selectedSlot = null;
  updateSelectedSlotsSummaryUI();

  document.querySelectorAll('#modal-grounds-container button').forEach(b => {
    b.className = 'p-2.5 sm:p-3 rounded-2xl border text-xs font-semibold text-left transition-all flex flex-col justify-between bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
  });
  clickedBtn.className = 'p-2.5 sm:p-3 rounded-2xl border text-xs font-semibold text-left transition-all flex flex-col justify-between bg-emerald-500/10 border-emerald-500 text-emerald-400';

  const priceDisplay = document.getElementById('modal-slot-price-display');
  if (priceDisplay) priceDisplay.textContent = `৳${selectedGround.price1_5h.toLocaleString()}`;

  updateModalEmergencyBanner();
  renderModalSlots();
  updateStepperProgress(2);
  const quoteCard = document.getElementById('quote-card');
  if (quoteCard) quoteCard.classList.add('hidden');
}

function selectDuration(dur) {
  selectedDuration = 1.5;
  updateStepperProgress(3);
  if (selectedSlots.length > 0) calculateQuote();
}

function updateDurationButtonsPricing() {
  if (!selectedGround) return;
  const priceDisplay = document.getElementById('modal-slot-price-display');
  if (priceDisplay) priceDisplay.textContent = `৳${selectedGround.price1_5h.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// 4X4 SEGMENT CONFIGURATION & TIME SLOTS ENGINE (16 STANDARDIZED SLOTS)
// ---------------------------------------------------------------------------
let activeModalSegment = 'ALL';

const MODAL_SEGMENTS_DEF = [
  {
    key: 'MORNING',
    num: 1,
    name: 'Morning Segment',
    range: '6:00 AM – 12:00 PM',
    icon: '🌅',
    colorText: 'text-amber-400',
    colorBorder: 'border-amber-500/30',
    slotNums: [1, 2, 3, 4]
  },
  {
    key: 'AFTERNOON',
    num: 2,
    name: 'Afternoon Segment',
    range: '12:00 PM – 6:00 PM',
    icon: '☀️',
    colorText: 'text-emerald-400',
    colorBorder: 'border-emerald-500/30',
    slotNums: [5, 6, 7, 8]
  },
  {
    key: 'EVENING',
    num: 3,
    name: 'Evening Segment',
    range: '6:00 PM – 12:00 AM',
    icon: '🌇',
    colorText: 'text-sky-400',
    colorBorder: 'border-sky-500/30',
    slotNums: [9, 10, 11, 12]
  },
  {
    key: 'NIGHT',
    num: 4,
    name: 'Night / Dawn Segment',
    range: '12:00 AM – 6:00 AM',
    icon: '🌙',
    colorText: 'text-indigo-400',
    colorBorder: 'border-indigo-500/30',
    slotNums: [13, 14, 15, 16]
  }
];

function filterModalSegment(segKey) {
  activeModalSegment = segKey;
  updateModalSegmentPills();
  renderModalSlots();
}

function updateModalSegmentPills() {
  const keys = ['ALL', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  keys.forEach(k => {
    const pill = document.getElementById(`seg-pill-${k}`);
    if (pill) {
      if (k === activeModalSegment) {
        pill.className = 'px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm whitespace-nowrap';
      } else {
        pill.className = 'px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer bg-slate-900 border-slate-800 text-slate-400 hover:text-white whitespace-nowrap';
      }
    }
  });
}

function renderModalSlots() {
  const grid = document.getElementById('modal-slots-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const price1_5 = selectedGround ? selectedGround.price1_5h : 2800;
  const currentSlots = selectedGround 
    ? getSlotsForGround(selectedGround.id, selectedGround.price1_5h, customerBookingDate) 
    : getSlotsForGround('grd_1a', 2800, customerBookingDate);

  const segmentsToRender = activeModalSegment === 'ALL'
    ? MODAL_SEGMENTS_DEF
    : MODAL_SEGMENTS_DEF.filter(s => s.key === activeModalSegment);

  segmentsToRender.forEach(seg => {
    // 1. Render Segment Header spanning full 4 columns
    const headerEl = document.createElement('div');
    headerEl.className = `slot-segment-header col-span-2 md:col-span-4 flex items-center justify-between text-[11px] font-bold ${seg.colorText} pt-2 pb-0.5 border-t border-slate-800/60 first:border-0 first:pt-0`;
    headerEl.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span class="text-sm">${seg.icon}</span>
        <span class="uppercase tracking-wider font-extrabold text-[11px]">${seg.name} • ${seg.range}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] text-slate-400 font-mono font-normal">Row ${seg.num} (Slots ${seg.slotNums[0]}–${seg.slotNums[seg.slotNums.length - 1]})</span>
      </div>
    `;
    grid.appendChild(headerEl);

    // 2. Render 4 Slots in this Segment
    seg.slotNums.forEach(slotNum => {
      const slot = currentSlots.find(s => s.slotNumber === slotNum) || currentSlots[slotNum - 1];
      if (!slot) return;

      const isAvail = slot.status === 'AVAILABLE';
      const isMaintenance = slot.status === 'MAINTENANCE';
      const isClosed = slot.status === 'CLOSED';
      const isSelected = selectedSlots.some(s => s.id === slot.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.disabled = !isAvail;

      let containerStyle = '';
      let badgeText = '';
      let badgeStyle = '';
      let dotStyle = '';
      let subText = seg.name.split(' ')[0]; // 'Morning', 'Afternoon', 'Evening', 'Night'

      if (isSelected) {
        containerStyle = 'ring-2 ring-emerald-400 bg-emerald-500/20 border-emerald-400 text-white shadow-md shadow-emerald-500/20';
        badgeText = '✓ Selected';
        badgeStyle = 'bg-emerald-500 text-slate-950 border border-emerald-400 font-black';
        dotStyle = 'bg-emerald-300 ring-2 ring-emerald-400 animate-pulse';
      } else if (isAvail) {
        containerStyle = 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800 text-slate-200 cursor-pointer shadow-sm';
        badgeText = 'Available';
        badgeStyle = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
        dotStyle = 'bg-emerald-400';
      } else if (isMaintenance) {
        containerStyle = 'bg-amber-950/20 border-amber-500/30 text-amber-300 cursor-not-allowed opacity-80';
        badgeText = '🛠️ Maint';
        badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
        dotStyle = 'bg-amber-400';
        subText = slot.maintenanceReason ? slot.maintenanceReason : 'Under Repair';
      } else if (isClosed) {
        containerStyle = 'bg-rose-950/20 border-rose-500/30 text-rose-300 cursor-not-allowed opacity-80';
        badgeText = '🚫 Closed';
        badgeStyle = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
        dotStyle = 'bg-rose-400';
        subText = slot.maintenanceReason ? slot.maintenanceReason : 'Day Closed';
      } else {
        // BOOKED
        containerStyle = 'bg-slate-950/60 border-slate-800/50 text-slate-500 cursor-not-allowed opacity-60';
        badgeText = 'Booked';
        badgeStyle = 'bg-slate-800 text-slate-500 border border-slate-700';
        dotStyle = 'bg-slate-600';
      }

      btn.className = `p-2 sm:p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${containerStyle}`;
      btn.onclick = () => toggleSlotSelection(slot);
      btn.innerHTML = `
        <div class="flex items-center justify-between w-full mb-1">
          <span class="font-mono font-bold text-xs ${isAvail ? 'text-white' : isMaintenance ? 'text-amber-200' : isClosed ? 'text-rose-200' : 'text-slate-500'} flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full ${dotStyle}"></span>
            Slot ${slot.slotNumber}
          </span>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${badgeStyle}">
            ${badgeText}
          </span>
        </div>
        <div class="font-mono font-bold text-[11px] ${isSelected ? 'text-emerald-300' : isAvail ? 'text-slate-200' : isMaintenance ? 'text-amber-300' : isClosed ? 'text-rose-300' : 'text-slate-500'} mb-1">
          ${slot.time}
        </div>
        <div class="flex items-center justify-between w-full text-[10px] pt-1 border-t border-slate-800/60">
          <span class="text-[9px] truncate max-w-[80px] ${isMaintenance ? 'text-amber-400/90 italic font-medium' : isClosed ? 'text-rose-400/90 italic font-medium' : 'text-slate-400'}">${subText}</span>
          <span class="font-mono font-bold ${isSelected ? 'text-emerald-300' : isAvail ? 'text-emerald-400' : isMaintenance ? 'text-amber-400' : isClosed ? 'text-rose-400' : 'text-slate-600'}">৳${price1_5.toLocaleString()}</span>
        </div>
      `;
      grid.appendChild(btn);
    });
  });
}

function toggleSlotSelection(slot) {
  const index = selectedSlots.findIndex(s => s.id === slot.id);
  if (index > -1) {
    selectedSlots.splice(index, 1);
  } else {
    selectedSlots.push(slot);
  }
  // Sort slots by slot number so they stay chronological
  selectedSlots.sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
  selectedSlot = selectedSlots[0] || null;

  renderModalSlots();
  updateSelectedSlotsSummaryUI();

  if (selectedSlots.length > 0) {
    updateStepperProgress(4);
    calculateQuote(false); // FALSE: Don't scroll to quote breakdown automatically! Customer can select multiple slots freely.
  } else {
    updateStepperProgress(3);
    const quoteCard = document.getElementById('quote-card');
    if (quoteCard) quoteCard.classList.add('hidden');
    const quickBar = document.getElementById('modal-quick-selection-bar');
    if (quickBar) quickBar.classList.add('hidden');
  }
}

function clearSelectedSlots() {
  selectedSlots = [];
  selectedSlot = null;
  renderModalSlots();
  updateSelectedSlotsSummaryUI();
  updateStepperProgress(3);
  const quoteCard = document.getElementById('quote-card');
  if (quoteCard) quoteCard.classList.add('hidden');
  const quickBar = document.getElementById('modal-quick-selection-bar');
  if (quickBar) quickBar.classList.add('hidden');
}

function scrollToQuoteBreakdown() {
  const quoteCard = document.getElementById('quote-card');
  if (quoteCard) {
    quoteCard.classList.remove('hidden');
    quoteCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateSelectedSlotsSummaryUI() {
  const countBadge = document.getElementById('selected-slots-count-badge');
  const clearBtn = document.getElementById('btn-clear-slots');
  const feeRatePill = document.getElementById('platform-fee-rate-pill');
  const count = selectedSlots.length;

  if (count === 0) {
    if (countBadge) {
      countBadge.textContent = '0 Slots Selected';
      countBadge.className = 'text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full whitespace-nowrap';
    }
    if (clearBtn) clearBtn.classList.add('hidden');
    if (feeRatePill) feeRatePill.textContent = '৳200 Base Fee';
  } else {
    const fee = calculatePlatformFee(count);
    const totalHours = (count * 1.5).toFixed(1);
    if (countBadge) {
      countBadge.textContent = `${count} Slot${count > 1 ? 's' : ''} Selected (${totalHours}h • ৳${fee} platform fee)`;
      countBadge.className = 'text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm';
    }
    if (clearBtn) clearBtn.classList.remove('hidden');
    if (feeRatePill) feeRatePill.textContent = `৳${fee} Fee (${count} slot${count > 1 ? 's' : ''})`;
  }
}

// Fallback alias for direct slot selection
function selectSlot(slot, btn) {
  toggleSlotSelection(slot);
}

function calculateQuote(shouldScroll = false) {
  if (!selectedGround || selectedSlots.length === 0) return;

  const numSlots = selectedSlots.length;
  const slotPricePer1_5h = selectedGround.price1_5h || 2800;
  const grossSlotsTotal = selectedSlots.reduce((sum, s) => sum + (s.basePrice || slotPricePer1_5h), 0);
  const currentPlatformFee = calculatePlatformFee(numSlots);
  const totalDurationHours = (numSlots * 1.5).toFixed(1);

  const netTurfPrice = Math.max(0, grossSlotsTotal - appliedDiscount);
  const grandTotal = netTurfPrice + currentPlatformFee;

  // Turf Management Deposit Percentage (30%, 40%, 50%)
  const depositPercent = selectedTurf.depositPercent || 40;
  const turfAdvanceRequired = Math.round((netTurfPrice * depositPercent) / 100);
  const onlineAdvanceToPay = turfAdvanceRequired + currentPlatformFee;
  const remainingDueAtCounter = netTurfPrice - turfAdvanceRequired;

  // DOM Updates: Description
  const slotsNamesStr = selectedSlots.map(s => s.slotLabel).join(' + ');
  const descEl = document.getElementById('quote-ground-desc');
  if (numSlots === 1) {
    descEl.textContent = `${selectedGround.name} (${selectedGround.format} • ${selectedGround.capacity}p) — ${selectedSlots[0].slotLabel} (1.5 Hours)`;
  } else {
    descEl.textContent = `${selectedGround.name} (${selectedGround.format} • ${selectedGround.capacity}p) — ${numSlots} Slots (${totalDurationHours}h): ${slotsNamesStr}`;
  }

  // DOM Updates: Gross Slot Rate
  const grossEl = document.getElementById('quote-gross-slot-fee');
  if (numSlots === 1) {
    grossEl.textContent = `৳${grossSlotsTotal.toLocaleString()}`;
  } else {
    grossEl.textContent = `৳${grossSlotsTotal.toLocaleString()} (${numSlots} × ৳${slotPricePer1_5h.toLocaleString()})`;
  }

  // DOM Updates: Discount
  document.getElementById('quote-discount-val').textContent = `-৳${appliedDiscount.toLocaleString()}`;

  // DOM Updates: Platform Fee with Dynamic Multi-Slot Breakdown
  const platFeeLabel = document.getElementById('quote-platform-fee-label');
  if (platFeeLabel) {
    if (numSlots === 1) {
      platFeeLabel.textContent = `Website Management Platform Fee (1 Single Slot: ৳200 Flat)`;
    } else {
      const extraSlots = numSlots - 1;
      platFeeLabel.textContent = `Website Management Platform Fee (${numSlots} Slots: ৳200 base + ৳${extraSlots * 50} for ${extraSlots} extra slot${extraSlots > 1 ? 's' : ''})`;
    }
  }
  const platFeeVal = document.getElementById('quote-platform-fee-val');
  if (platFeeVal) platFeeVal.textContent = `৳${currentPlatformFee.toLocaleString()}`;

  // DOM Updates: Grand Total, Advance & Due
  document.getElementById('quote-grand-total').textContent = `৳${grandTotal.toLocaleString()}`;
  document.getElementById('quote-deposit-percent-badge').textContent = `${depositPercent}% Advance Required by Turf`;

  document.getElementById('quote-advance-pay-val').textContent = `৳${onlineAdvanceToPay.toLocaleString()}`;
  document.getElementById('quote-due-pay-val').textContent = `৳${remainingDueAtCounter.toLocaleString()}`;
  document.getElementById('quote-full-pay-val').textContent = `৳${grandTotal.toLocaleString()}`;

  const payAmount = selectedPaymentMode === 'PARTIAL' ? onlineAdvanceToPay : grandTotal;
  document.getElementById('btn-pay-text').textContent = `Pay ৳${payAmount.toLocaleString()} Online via bKash (${numSlots} Slot${numSlots > 1 ? 's' : ''})`;

  // Dynamic Explainer Box
  const explainerBox = document.getElementById('quote-explainer-box');
  if (explainerBox) {
    if (selectedPaymentMode === 'PARTIAL') {
      explainerBox.className = 'mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-slate-300 flex items-start gap-2.5';
      explainerBox.innerHTML = `
        <i data-lucide="info" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
        <div>
          <strong class="text-white block mb-0.5">💡 Multi-Slot Payment Breakdown (${numSlots} Match Slot${numSlots > 1 ? 's' : ''} • ${totalDurationHours} Hours):</strong>
          You only pay <span class="text-emerald-400 font-bold">৳${onlineAdvanceToPay.toLocaleString()}</span> online today via bKash (${depositPercent}% Turf deposit of ৳${turfAdvanceRequired.toLocaleString()} + ৳${currentPlatformFee.toLocaleString()} Platform fee [৳200 base + ৳${(numSlots - 1) * 50} for additional slots]). The remaining balance of <span class="text-amber-400 font-bold">৳${remainingDueAtCounter.toLocaleString()}</span> is paid in cash at the counter before kickoff for <strong>${slotsNamesStr}</strong>. Guaranteed no clashes!
        </div>
      `;
    } else {
      explainerBox.className = 'mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-xs text-slate-200 flex items-start gap-2.5';
      explainerBox.innerHTML = `
        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
        <div>
          <strong class="text-white block mb-0.5">💡 100% Full Payment Selected (${numSlots} Match Slot${numSlots > 1 ? 's' : ''} • ${totalDurationHours} Hours):</strong>
          You are paying the full amount of <span class="text-emerald-400 font-bold">৳${grandTotal.toLocaleString()}</span> online today via bKash (includes ৳${currentPlatformFee.toLocaleString()} Platform fee). You will have <span class="text-emerald-300 font-bold">৳0 due</span> at the counter. Flash your instant QR invoice at check-in for <strong>${slotsNamesStr}</strong>!
        </div>
      `;
    }
  }

  const quoteCard = document.getElementById('quote-card');
  if (quoteCard) {
    quoteCard.classList.remove('hidden');
    if (shouldScroll) {
      quoteCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Update Live Multi-Slot Quick Action Floating Bar
  const quickBar = document.getElementById('modal-quick-selection-bar');
  if (quickBar) {
    quickBar.classList.remove('hidden');
    const countEl = document.getElementById('quick-bar-count');
    const titleEl = document.getElementById('quick-bar-title');
    const durEl = document.getElementById('quick-bar-duration');
    const advEl = document.getElementById('quick-bar-advance');
    const totEl = document.getElementById('quick-bar-total');
    if (countEl) countEl.textContent = `${numSlots}`;
    if (titleEl) titleEl.textContent = `${numSlots} Match Slot${numSlots > 1 ? 's' : ''} Selected`;
    if (durEl) durEl.textContent = `(${totalDurationHours}h total)`;
    if (advEl) advEl.textContent = `৳${onlineAdvanceToPay.toLocaleString()}`;
    if (totEl) totEl.textContent = `৳${grandTotal.toLocaleString()}`;
  }
  lucide.createIcons();
}

function selectPaymentMode(mode) {
  selectedPaymentMode = mode;
  document.querySelectorAll('.payment-option-card').forEach(c => {
    c.classList.remove('active', 'border-emerald-500', 'bg-emerald-500/10');
    c.classList.add('border-slate-800', 'bg-slate-900/60');
  });
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active', 'border-emerald-500', 'bg-emerald-500/10');
    event.currentTarget.classList.remove('border-slate-800', 'bg-slate-900/60');
  }
  calculateQuote();
}

function applyPromoCode() {
  const inputEl = document.getElementById('promo-code-input');
  if (!inputEl) return;
  const code = inputEl.value.trim().toUpperCase();
  if (!code) {
    showToast('Please enter a promotional code.', 'error');
    return;
  }

  const numSlots = selectedSlots.length || 1;
  const slotPricePer1_5h = selectedGround ? (selectedGround.price1_5h || 2800) : 2800;
  const grossSlotsTotal = selectedSlots.reduce((sum, s) => sum + (s.basePrice || slotPricePer1_5h), 0) || slotPricePer1_5h;
  const currentPlatformFee = calculatePlatformFee(numSlots);

  const promo = platformPromoCodes.find(p => p.code.toUpperCase() === code && p.active);
  if (promo) {
    let calcDiscount = 0;
    let isCapped = false;
    if (promo.type === 'PLATFORM_FEE_PERCENTAGE') {
      const raw = Math.round((currentPlatformFee * promo.percent) / 100);
      calcDiscount = Math.min(raw, promo.capAmount);
      isCapped = raw >= promo.capAmount;
    } else {
      const raw = Math.round((grossSlotsTotal * promo.percent) / 100);
      calcDiscount = Math.min(raw, promo.capAmount);
      isCapped = raw >= promo.capAmount;
    }
    appliedDiscount = calcDiscount;
    discountType = 'PROMO_CODE';
    promo.uses = (promo.uses || 0) + 1;
    
    const capMsg = isCapped ? ` (Reached ৳${promo.capAmount} max cap)` : '';
    showToast(`Promo ${promo.code} applied! ${promo.percent}% off${capMsg}. Saved ৳${calcDiscount}!`, 'success');
    calculateQuote();
  } else if (code === 'TURF200') {
    appliedDiscount = 200;
    discountType = 'PROMO_CODE';
    showToast('Promo code TURF200 applied! ৳200 discount deducted.', 'success');
    calculateQuote();
  } else {
    showToast(`Invalid promo code "${code}". Try "PLAY50" (50% fee off, cap ৳100) or "SUPER25".`, 'error');
  }
}


function closeBookingModal() {
  document.getElementById('booking-modal').classList.add('hidden');
  document.getElementById('booking-modal').classList.remove('flex');
}

// ---------------------------------------------------------------------------
// 4. BKASH GATEWAY PAYMENT & AUTOMATED INVOICE ISSUANCE
// ---------------------------------------------------------------------------
function openPaymentGatewayModal() {
  if (selectedSlots.length === 0) return;

  const numSlots = selectedSlots.length;
  const slotPricePer1_5h = selectedGround.price1_5h || 2800;
  const grossSlotsTotal = selectedSlots.reduce((sum, s) => sum + (s.basePrice || slotPricePer1_5h), 0);
  const currentPlatformFee = calculatePlatformFee(numSlots);
  const netTurfPrice = Math.max(0, grossSlotsTotal - appliedDiscount);
  const depositPercent = selectedTurf.depositPercent || 40;
  const turfAdvanceRequired = Math.round((netTurfPrice * depositPercent) / 100);
  const onlineAdvanceToPay = turfAdvanceRequired + currentPlatformFee;
  const grandTotal = netTurfPrice + currentPlatformFee;

  const chargeAmount = selectedPaymentMode === 'PARTIAL' ? onlineAdvanceToPay : grandTotal;
  document.getElementById('pg-amount-display').textContent = `৳${chargeAmount.toLocaleString()}`;

  const feeNoteEl = document.getElementById('pg-fee-note');
  if (feeNoteEl) {
    if (numSlots === 1) {
      feeNoteEl.textContent = `Includes ৳200 Flat Website Management Platform Fee (1 Slot)`;
    } else {
      feeNoteEl.textContent = `Includes ৳${currentPlatformFee} Platform Fee (${numSlots} Slots: ৳200 base + ৳${(numSlots - 1) * 50} for ${numSlots - 1} extra)`;
    }
  }

  document.getElementById('payment-gateway-modal').classList.remove('hidden');
  document.getElementById('payment-gateway-modal').classList.add('flex');
  lucide.createIcons();
}

function closePaymentGatewayModal() {
  document.getElementById('payment-gateway-modal').classList.add('hidden');
  document.getElementById('payment-gateway-modal').classList.remove('flex');
}

function executeSimulatedPayment() {
  const btn = document.getElementById('btn-confirm-payment');
  btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Reconciling with bKash API...`;
  btn.disabled = true;

  setTimeout(() => {
    closePaymentGatewayModal();
    closeBookingModal();

    const numSlots = selectedSlots.length;
    const slotPricePer1_5h = selectedGround.price1_5h || 2800;
    const grossSlotsTotal = selectedSlots.reduce((sum, s) => sum + (s.basePrice || slotPricePer1_5h), 0);
    const currentPlatformFee = calculatePlatformFee(numSlots);
    const netTurfPrice = Math.max(0, grossSlotsTotal - appliedDiscount);
    const depositPercent = selectedTurf.depositPercent || 40;
    const turfAdvanceRequired = Math.round((netTurfPrice * depositPercent) / 100);
    const onlineAdvanceToPay = turfAdvanceRequired + currentPlatformFee;
    const grandTotal = netTurfPrice + currentPlatformFee;

    const isFull = selectedPaymentMode === 'FULL';
    const advancePaid = isFull ? grandTotal : onlineAdvanceToPay;
    const dueBalance = isFull ? 0 : (netTurfPrice - turfAdvanceRequired);

    const randomRef = Math.floor(1000 + Math.random() * 9000);
    const slotsListStr = selectedSlots.map(s => s.slotLabel).join(', ');
    const totalHoursStr = `${(numSlots * 1.5).toFixed(1)} Hours (${numSlots * 90} mins)`;

    currentBooking = {
      ref: `TRF-202610-${randomRef}`,
      invoiceNo: `INV-2026-00${randomRef}`,
      turf: selectedTurf,
      ground: selectedGround,
      slotCount: numSlots,
      slots: [...selectedSlots],
      duration: totalHoursStr,
      date: formatDateDisplay(customerBookingDate),
      time: slotsListStr,
      grossTurf: grossSlotsTotal,
      discount: appliedDiscount,
      netTurf: netTurfPrice,
      platformFee: currentPlatformFee,
      totalAmount: grandTotal,
      advancePaid: advancePaid,
      dueAmount: dueBalance,
      customerName: (currentUser && currentUser.name) ? currentUser.name : 'Al Nahyan Khan',
      customerPhone: (currentUser && currentUser.phone) ? currentUser.phone : '01712345678',
      isFullPaid: isFull
    };

    // Mark ALL selected slots as booked in this specific ground's independent schedule for chosen date
    const groundSlotsList = getSlotsForGround(selectedGround.id, selectedGround.price1_5h, customerBookingDate);
    selectedSlots.forEach(s => {
      s.status = 'BOOKED';
      s.customer = currentBooking.customerName;
      s.bookingRef = currentBooking.ref;
      s.advance = Math.round(advancePaid / numSlots);
      s.due = Math.round(dueBalance / numSlots);

      const targetInGround = groundSlotsList.find(x => x.id === s.id);
      if (targetInGround) {
        targetInGround.status = 'BOOKED';
        targetInGround.customer = currentBooking.customerName;
        targetInGround.bookingRef = currentBooking.ref;
        targetInGround.advance = Math.round(advancePaid / numSlots);
        targetInGround.due = Math.round(dueBalance / numSlots);
      }
    });

    // Enqueue to counter check-in desk arrivals
    deskBookingsQueue.unshift({
      ref: currentBooking.ref,
      invoiceNo: currentBooking.invoiceNo,
      customerName: `${currentBooking.customerName} (${currentBooking.customerPhone})`,
      customerPhone: currentBooking.customerPhone,
      turfId: selectedTurf.id,
      turfName: selectedTurf.name,
      groundId: selectedGround.id,
      groundName: `${selectedGround.name} (${selectedGround.format || '5v5'})`,
      slotId: selectedSlots[0].id,
      slotTime: slotsListStr,
      totalFee: grandTotal,
      platformFee: currentPlatformFee,
      advancePaid: advancePaid,
      dueAmount: dueBalance,
      status: dueBalance === 0 ? 'CONFIRMED / PAID FULL ONLINE' : 'ARRIVING / PENDING DUE',
      settledAt: dueBalance === 0 ? `${formatDateDisplay(customerBookingDate)}, 09:35 PM` : null,
      dateIso: customerBookingDate
    });

    // Log to multi-agent audit trail
    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: `${formatDateDisplay(customerBookingDate)}, 09:35 PM`,
      actorName: 'bKash Webhook',
      actorRole: 'SYSTEM_GATEWAY',
      action: 'ONLINE_ADVANCE_CONFIRMED',
      category: 'PAYMENT',
      target: `Booking: ${currentBooking.ref} (${numSlots} Slot${numSlots > 1 ? 's' : ''}) [${currentBooking.date}]`,
      diff: {
        match_date: currentBooking.date,
        slots_booked: slotsListStr,
        slot_count: `${numSlots} Slots`,
        advance_received: `৳${advancePaid}`,
        platform_fee: `৳${currentPlatformFee} (${numSlots === 1 ? '1 slot' : '৳200 base + ৳' + ((numSlots - 1) * 50) + ' for ' + (numSlots - 1) + ' extra slots'})`,
        due_counter: `৳${dueBalance}`
      },
      reason: 'Online bKash tokenized advance checkout',
      ip: '119.30.38.12'
    });

    // Add to Customer booking history
    customerBookings.unshift({
      ref: currentBooking.ref,
      turfName: selectedTurf.name,
      groundName: `${selectedGround.name} (${selectedGround.capacity}p)`,
      date: currentBooking.date,
      time: slotsListStr,
      duration: currentBooking.duration,
      turfFee: netTurfPrice,
      platformFee: currentPlatformFee,
      advancePaid: advancePaid,
      dueAmount: dueBalance,
      status: 'CONFIRMED'
    });

    renderDigitalInvoice(currentBooking);
    renderTurfVisualSlotRack();
    renderTurfScheduleTable();
    renderTurfShiftFinancialSummary();
    renderDeskBookingsQueue();
    renderTurfFinancialAnalytics();
    showToast(`Payment confirmed via bKash! Booking ${currentBooking.ref} (${numSlots} slots) for ${currentBooking.date} secured.`, 'success');


    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i> <span>Confirm Payment & Generate Invoice</span>`;
  }, 1000);
}

function renderDigitalInvoice(b) {
  document.getElementById('inv-turf-name').textContent = b.turf.name;
  document.getElementById('inv-turf-address').textContent = b.turf.address;
  document.getElementById('inv-number').textContent = b.invoiceNo;
  document.getElementById('inv-booking-ref').textContent = `REF: ${b.ref}`;

  document.getElementById('inv-customer-name').textContent = b.customerName;
  document.getElementById('inv-customer-phone').textContent = b.customerPhone;
  document.getElementById('inv-ground-name').textContent = `${b.ground.name} (${b.ground.capacity}p)`;
  document.getElementById('inv-duration').textContent = b.duration;
  document.getElementById('inv-time').textContent = b.time;

  document.getElementById('inv-item-slot-desc').textContent = `${b.ground.name} (${b.duration})`;
  document.getElementById('inv-item-slot-price').textContent = `৳${b.grossTurf.toFixed(2)}`;
  document.getElementById('inv-item-discount').textContent = `-৳${b.discount.toFixed(2)}`;
  document.getElementById('inv-total-amount').textContent = `৳${b.totalAmount.toFixed(2)}`;
  document.getElementById('inv-advance-paid').textContent = `৳${b.advancePaid.toFixed(2)}`;
  document.getElementById('inv-due-balance').textContent = `৳${b.dueAmount.toFixed(2)}`;

  // Dynamic Platform Fee Breakdown in Invoice
  const invPlatDesc = document.getElementById('inv-item-platform-desc');
  const invPlatFee = document.getElementById('inv-item-platform-fee');
  const slotCount = b.slotCount || 1;
  if (invPlatDesc) {
    if (slotCount === 1) {
      invPlatDesc.textContent = `Platform Convenience Fee (Website Management • 1 Single Slot)`;
    } else {
      const extraSlots = slotCount - 1;
      invPlatDesc.textContent = `Platform Convenience Fee (Website Management • ${slotCount} Slots: ৳200 base + ৳${extraSlots * 50} for ${extraSlots} extra slot${extraSlots > 1 ? 's' : ''})`;
    }
  }
  if (invPlatFee) {
    invPlatFee.textContent = `৳${(b.platformFee || 200).toFixed(2)}`;
  }

  // Stamp Seal
  const stamp = document.getElementById('invoice-stamp');
  if (b.isFullPaid || b.dueAmount <= 0) {
    stamp.innerHTML = `<div class="stamp-seal-paid">PAID IN FULL</div>`;
  } else {
    stamp.innerHTML = `<div class="stamp-seal-advance">ADVANCE PAID — DUE ৳${b.dueAmount.toLocaleString()}</div>`;
  }

  // QR Code
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';
  new QRCode(qrContainer, {
    text: `TURFSYNC:${b.ref}:${b.dueAmount}:৳${b.platformFee || 200}FEE`,
    width: 80,
    height: 80,
    colorDark: "#022c22",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });

  document.getElementById('invoice-modal').classList.remove('hidden');
  document.getElementById('invoice-modal').classList.add('flex');
}

function closeInvoiceModal() {
  document.getElementById('invoice-modal').classList.add('hidden');
  document.getElementById('invoice-modal').classList.remove('flex');
}

// ---------------------------------------------------------------------------
// 5. CUSTOMER INVOICES & FINANCIAL HISTORY
// ---------------------------------------------------------------------------
function renderCustomerInvoicesTable() {
  const tbody = document.getElementById('cust-invoices-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  customerBookings.forEach(b => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40';
    tr.innerHTML = `
      <td class="py-3 font-mono font-bold text-emerald-400">${b.ref}</td>
      <td class="py-3">
        <div class="font-bold text-white">${b.turfName}</div>
        <div class="text-[10px] text-slate-400">${b.groundName}</div>
      </td>
      <td class="py-3 text-slate-300">${b.date} • ${b.time.split('–')[0]}</td>
      <td class="py-3 font-mono text-slate-300">${b.duration}</td>
      <td class="py-3 font-mono text-white">৳${b.turfFee}</td>
      <td class="py-3 font-mono text-emerald-400">৳${b.platformFee}</td>
      <td class="py-3 font-mono text-emerald-400">৳${b.advancePaid}</td>
      <td class="py-3 font-mono ${b.dueAmount > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}">৳${b.dueAmount}</td>
      <td class="py-3 text-right">
        <button onclick="viewCustomerHistoricalInvoice('${b.ref}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold">
          View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

function viewCustomerHistoricalInvoice(ref) {
  const b = customerBookings.find(x => x.ref === ref);
  if (!b) return;

  renderDigitalInvoice({
    ref: b.ref,
    invoiceNo: `INV-2026-${b.ref.split('-')[2]}`,
    turf: { name: b.turfName, address: 'Road 27, Dhanmondi, Dhaka' },
    ground: { name: b.groundName, capacity: 10 },
    slotCount: b.slotCount || 1,
    duration: b.duration,
    date: b.date,
    time: b.time,
    grossTurf: b.turfFee,
    discount: 0,
    netTurf: b.turfFee,
    platformFee: b.platformFee,
    totalAmount: b.turfFee + b.platformFee,
    advancePaid: b.advancePaid,
    dueAmount: b.dueAmount,
    customerName: 'Al Nahyan Khan',
    customerPhone: '01712345678',
    isFullPaid: b.dueAmount <= 0
  });
}

// ---------------------------------------------------------------------------
// 6. TURF MANAGEMENT PORTAL LOGIC & SHIFT OPERATIONS
// ---------------------------------------------------------------------------
function renderTurfGroundPills() {
  const container = document.getElementById('turf-grounds-pill-list');
  if (!container) return;
  container.innerHTML = '';

  const apexTurf = turfsDatabase[0];
  apexTurf.grounds.forEach((g, idx) => {
    const pill = document.createElement('button');
    pill.className = `px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
      idx === 0 ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
    }`;
    pill.textContent = `${g.name} (${g.format} • ${g.capacity}p)`;
    pill.onclick = () => {
      activeTurfGroundId = g.id;
      document.querySelectorAll('#turf-grounds-pill-list button').forEach(b => b.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-900 text-slate-400 hover:text-white border border-slate-800');
      pill.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-500 text-slate-950 shadow-md';
      document.getElementById('turf-schedule-ground-title').innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> ${g.name} (${g.format} • ${g.capacity} Players Capacity) — Schedule <span class="text-emerald-400 font-mono text-xs ml-1">(${formatDateDisplay(activeScheduleDate)})</span>`;
      renderTurfDateChips();
      renderTurfVisualSlotRack();
      renderTurfScheduleTable();
      renderTurfShiftFinancialSummary();
    };
    container.appendChild(pill);
  });
}

function renderTurfDateChips() {
  const container = document.getElementById('turf-date-cards-container') || document.getElementById('turf-date-chips-container');
  if (!container) return;
  container.innerHTML = '';

  const dateInput = document.getElementById('turf-schedule-date-input');
  if (dateInput) dateInput.value = activeScheduleDate;

  const dateLabel = document.getElementById('active-schedule-date-label');
  if (dateLabel) dateLabel.textContent = getFullFormattedDate(activeScheduleDate);

  const rackBadge = document.getElementById('rack-date-badge');
  if (rackBadge) rackBadge.textContent = formatDateDisplay(activeScheduleDate);

  const days = getUpcomingDays('2026-10-14', 14);
  days.forEach((day, idx) => {
    const isSelected = day.iso === activeScheduleDate;
    const isWeekend = (day.dayShort === 'Fri' || day.dayShort === 'Sat');
    let subLabel = day.dayShort.toUpperCase();
    if (idx === 0) subLabel = 'TODAY';
    else if (idx === 1) subLabel = 'TMRW';

    // Check if ground or slots are closed on this day
    const storageKey = `${activeTurfGroundId}__${day.iso}`;
    const daySchedule = dailyGroundSchedules[storageKey];
    const hasClosures = daySchedule && daySchedule.some(s => s.status === 'MAINTENANCE' || s.status === 'CLOSED');

    const card = document.createElement('button');
    card.type = 'button';
    card.id = `turf-date-card-${day.iso}`;
    card.className = `date-tile flex flex-col items-center justify-between p-2 rounded-2xl border transition-all cursor-pointer shrink-0 min-w-[64px] sm:min-w-[72px] h-[72px] sm:h-[78px] ${
      isSelected 
        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300 scale-[1.03]' 
        : 'bg-slate-950/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
    }`;
    card.onclick = () => handleSelectTurfDate(day.iso);
    card.innerHTML = `
      <div class="flex items-center gap-1">
        <span class="text-[9px] font-bold uppercase tracking-wider ${
          isSelected ? 'text-slate-950/80 font-black' : (isWeekend ? 'text-amber-400' : 'text-slate-400')
        }">${subLabel}</span>
        ${hasClosures ? `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-950' : 'bg-rose-400 animate-pulse'}"></span>` : ''}
      </div>
      <span class="text-base sm:text-lg font-black font-mono leading-none my-0.5 ${
        isSelected ? 'text-slate-950' : 'text-white'
      }">${day.dayNumber}</span>
      <span class="text-[9px] font-bold uppercase font-mono ${
        isSelected ? 'text-slate-950/80' : 'text-slate-500'
      }">${day.monthShort}</span>
    `;
    container.appendChild(card);
  });
}

function handleSelectTurfDate(newDateIso) {
  if (!newDateIso) return;
  activeScheduleDate = newDateIso;

  const dateInput = document.getElementById('turf-schedule-date-input');
  if (dateInput) dateInput.value = activeScheduleDate;

  const labelEl = document.getElementById('active-schedule-date-label');
  if (labelEl) labelEl.textContent = getFullFormattedDate(activeScheduleDate);

  const rackBadge = document.getElementById('rack-date-badge');
  if (rackBadge) rackBadge.textContent = formatDateDisplay(activeScheduleDate);

  renderTurfDateChips();
  renderTurfScheduleTable();
  renderTurfVisualSlotRack();
  renderTurfShiftFinancialSummary();
  renderDeskBookingsQueue();
  renderTurfFinancialAnalytics();
  showToast(`Schedule & Financials loaded for ${getFullFormattedDate(activeScheduleDate)}`, 'info');
}

function updateRackToolbarCounts() {
  const checked = document.querySelectorAll('.rack-slot-chk:checked').length;
  const badgeDisable = document.getElementById('rack-selected-count-badge-disable');
  const badgeOpen = document.getElementById('rack-selected-count-badge-open');
  if (badgeDisable) {
    if (checked > 0) {
      badgeDisable.textContent = `${checked}`;
      badgeDisable.classList.remove('hidden');
    } else {
      badgeDisable.classList.add('hidden');
    }
  }
  if (badgeOpen) {
    if (checked > 0) {
      badgeOpen.textContent = `${checked}`;
      badgeOpen.classList.remove('hidden');
    } else {
      badgeOpen.classList.add('hidden');
    }
  }
}

function renderTurfVisualSlotRack() {
  const grid = document.getElementById('turf-slot-rack-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);

  const selectAll = document.getElementById('rack-select-all-checkbox');
  if (selectAll) selectAll.checked = false;
  updateRackToolbarCounts();

  // Segment Color Schemes (Morning, Afternoon, Evening, Night)
  const segmentConfig = {
    MORNING: {
      label: 'Morning',
      icon: '🌅',
      borderClass: 'border-amber-500/40 hover:border-amber-400',
      bgClass: 'bg-amber-950/20',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      timeText: 'text-amber-200'
    },
    AFTERNOON: {
      label: 'Afternoon',
      icon: '☀️',
      borderClass: 'border-sky-500/40 hover:border-sky-400',
      bgClass: 'bg-sky-950/20',
      badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      timeText: 'text-sky-200'
    },
    EVENING: {
      label: 'Evening',
      icon: '🌇',
      borderClass: 'border-purple-500/40 hover:border-purple-400',
      bgClass: 'bg-purple-950/20',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      timeText: 'text-purple-200'
    },
    NIGHT: {
      label: 'Night',
      icon: '🌙',
      borderClass: 'border-indigo-500/40 hover:border-indigo-400',
      bgClass: 'bg-indigo-950/20',
      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      timeText: 'text-indigo-200'
    }
  };

  slots.forEach(slot => {
    const isAvail = slot.status === 'AVAILABLE';
    const isMaintenance = slot.status === 'MAINTENANCE';
    const isClosed = slot.status === 'CLOSED';
    const isBooked = slot.status === 'BOOKED';

    // Parse Start & End Time
    const timeParts = slot.time.split('–').map(t => t.trim());
    const startTime = timeParts[0] || '6:00 AM';
    const endTime = timeParts[1] || '7:30 AM';

    // Identify Segment by Slot Number (1-4: Morning, 5-8: Afternoon, 9-12: Evening, 13-16: Night)
    const tierKey = slot.slotNumber <= 4 ? 'MORNING' 
                  : (slot.slotNumber <= 8 ? 'AFTERNOON' 
                  : (slot.slotNumber <= 12 ? 'EVENING' : 'NIGHT'));
    const tier = segmentConfig[tierKey];

    let cardBorder = tier.borderClass;
    let cardBg = tier.bgClass;
    let badgeHtml = '';
    let toggleBtnHtml = '';

    if (isAvail) {
      badgeHtml = '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">OPEN</span>';
      toggleBtnHtml = `
        <button onclick="toggleSlotStatusQuick('${slot.id}', 'MAINTENANCE')" title="Disable slot for ${formatDateDisplay(activeScheduleDate)}" class="w-full mt-2 py-1 px-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer">
          <i data-lucide="power" class="w-3 h-3 text-rose-400"></i> Close
        </button>
      `;
    } else if (isMaintenance || isClosed) {
      cardBg = isClosed ? 'bg-rose-950/25' : 'bg-amber-950/25';
      cardBorder = isClosed ? 'border-rose-500/50' : 'border-amber-500/50';
      badgeHtml = isClosed 
        ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">CLOSED</span>'
        : '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">MAINT.</span>';
      toggleBtnHtml = `
        <button onclick="toggleSlotStatusQuick('${slot.id}', 'AVAILABLE')" title="Re-open this slot for public bookings" class="w-full mt-2 py-1 px-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer">
          <i data-lucide="check-circle" class="w-3 h-3 text-emerald-400"></i> Re-Open
        </button>
      `;
    } else {
      // BOOKED
      cardBg = 'bg-slate-900/90';
      cardBorder = 'border-slate-800 opacity-90';
      badgeHtml = '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">BOOKED</span>';
      toggleBtnHtml = `
        <div class="w-full mt-2 py-1 text-center text-[10px] text-emerald-400 font-mono font-bold truncate bg-slate-950/60 rounded border border-slate-800/80" title="${slot.customer || slot.bookingRef}">
          ${slot.customer ? slot.customer : (slot.bookingRef || 'Reserved')}
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = `p-2.5 rounded-2xl border flex flex-col justify-between text-xs transition-all shadow-sm ${cardBorder} ${cardBg}`;
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" value="${slot.id}" onchange="updateRackToolbarCounts()" ${isBooked ? 'disabled' : ''} class="rack-slot-chk rounded text-emerald-500 ${isBooked ? 'opacity-30 cursor-not-allowed' : ''}">
            <span class="font-mono font-black text-white text-[11px]">S-${slot.slotNumber}</span>
          </label>
          <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${tier.badgeClass} flex items-center gap-0.5">
            <span>${tier.icon}</span>
            <span>${tier.label}</span>
          </span>
        </div>

        <div class="flex items-center justify-between mb-1">
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          ${badgeHtml}
        </div>

        <!-- Start & End Time (NO Price Display) -->
        <div class="mt-1.5 pt-1.5 border-t border-slate-800/60 space-y-0.5">
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-slate-400 font-medium">Start Time:</span>
            <span class="font-mono font-bold text-white">${startTime}</span>
          </div>
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-slate-400 font-medium">End Time:</span>
            <span class="font-mono font-bold text-white">${endTime}</span>
          </div>
        </div>
      </div>

      <div>
        ${toggleBtnHtml}
      </div>
    `;
    grid.appendChild(card);
  });
  lucide.createIcons();
}

function toggleSlotStatusQuick(slotId, targetStatus, customReason) {
  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  const oldStatus = slot.status;
  const newStatus = targetStatus || (oldStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE');

  slot.status = newStatus;
  if (newStatus === 'MAINTENANCE' || newStatus === 'CLOSED') {
    slot.maintenanceReason = customReason || `Disabled by management for ${formatDateDisplay(activeScheduleDate)}`;
  } else {
    slot.maintenanceReason = '';
  }

  // Audit Log
  const isDisable = (newStatus === 'MAINTENANCE' || newStatus === 'CLOSED');
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:56 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: isDisable ? 'SLOT_MAINTENANCE_DISABLED' : 'SLOT_REOPENED',
    category: 'MAINTENANCE',
    target: `Slot: ${slot.slotLabel} [${formatDateDisplay(activeScheduleDate)}]`,
    diff: {
      status: `${oldStatus} -> ${newStatus}`,
      calendarDate: activeScheduleDate,
      reason: slot.maintenanceReason || 'Slot toggled by manager'
    },
    reason: isDisable ? (customReason || 'Manual slot disable for specific calendar date') : 'Restored slot to public availability',
    ip: '103.145.22.18'
  });

  renderTurfVisualSlotRack();
  renderTurfScheduleTable();
  if (typeof renderPlatformAuditLogs === 'function') renderPlatformAuditLogs();

  // If customer booking modal is open, refresh slots
  const bookingModal = document.getElementById('booking-modal');
  if (bookingModal && !bookingModal.classList.contains('hidden')) {
    renderModalSlots();
  }

  if (isDisable) {
    showToast(`Slot ${slot.slotNumber} DISABLED for ${formatDateDisplay(activeScheduleDate)}.`, 'warning');
  } else {
    showToast(`Slot ${slot.slotNumber} RE-OPENED for ${formatDateDisplay(activeScheduleDate)}!`, 'success');
  }
}

function toggleSelectAllRackSlots(isChecked) {
  document.querySelectorAll('.rack-slot-chk').forEach(chk => {
    if (!chk.disabled) chk.checked = isChecked;
  });
}

function bulkDisableSelectedSlots() {
  const checkedBoxes = Array.from(document.querySelectorAll('.rack-slot-chk:checked'));
  if (checkedBoxes.length === 0) {
    showToast('Please select at least one slot checkbox to disable.', 'warning');
    return;
  }

  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);

  let affectedCount = 0;
  checkedBoxes.forEach(chk => {
    const slot = slots.find(s => s.id === chk.value);
    if (slot && slot.status !== 'BOOKED') {
      slot.status = 'MAINTENANCE';
      slot.maintenanceReason = `Bulk disabled for ${formatDateDisplay(activeScheduleDate)}`;
      affectedCount++;
    }
  });

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:57 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: 'SLOT_MAINTENANCE_DISABLED',
    category: 'MAINTENANCE',
    target: `Ground: ${activeGround.name} [${formatDateDisplay(activeScheduleDate)}]`,
    diff: {
      action: 'BULK_DISABLE_SLOTS',
      slotsCount: `${affectedCount} slots disabled`,
      calendarDate: activeScheduleDate
    },
    reason: `Batch slot closure for calendar date ${formatDateDisplay(activeScheduleDate)}`,
    ip: '103.145.22.18'
  });

  renderTurfVisualSlotRack();
  renderTurfScheduleTable();
  if (typeof renderPlatformAuditLogs === 'function') renderPlatformAuditLogs();
  showToast(`${affectedCount} slots have been DISABLED for ${formatDateDisplay(activeScheduleDate)}.`, 'warning');
}

function bulkOpenSelectedSlots() {
  const checkedBoxes = Array.from(document.querySelectorAll('.rack-slot-chk:checked'));
  if (checkedBoxes.length === 0) {
    showToast('Please select at least one slot checkbox to open.', 'warning');
    return;
  }

  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);

  let restoredCount = 0;
  checkedBoxes.forEach(chk => {
    const slot = slots.find(s => s.id === chk.value);
    if (slot && (slot.status === 'MAINTENANCE' || slot.status === 'CLOSED')) {
      slot.status = 'AVAILABLE';
      slot.maintenanceReason = '';
      restoredCount++;
    }
  });

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:58 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: 'SLOT_REOPENED',
    category: 'MAINTENANCE',
    target: `Ground: ${activeGround.name} [${formatDateDisplay(activeScheduleDate)}]`,
    diff: {
      action: 'BULK_OPEN_SLOTS',
      slotsCount: `${restoredCount} slots restored to AVAILABLE`,
      calendarDate: activeScheduleDate
    },
    reason: `Batch slot re-opening for calendar date ${formatDateDisplay(activeScheduleDate)}`,
    ip: '103.145.22.18'
  });

  renderTurfVisualSlotRack();
  renderTurfScheduleTable();
  if (typeof renderPlatformAuditLogs === 'function') renderPlatformAuditLogs();
  showToast(`${restoredCount} slots are now OPEN for ${formatDateDisplay(activeScheduleDate)}!`, 'success');
}

function bulkToggleTierSlots(tier, targetStatus) {
  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);

  let affectedCount = 0;
  slots.forEach(slot => {
    if (tier === 'ALL' || slot.tier === tier) {
      if (targetStatus === 'AVAILABLE' && (slot.status === 'MAINTENANCE' || slot.status === 'CLOSED')) {
        slot.status = 'AVAILABLE';
        slot.maintenanceReason = '';
        affectedCount++;
      } else if (targetStatus !== 'AVAILABLE' && slot.status !== 'BOOKED') {
        slot.status = targetStatus;
        slot.maintenanceReason = `${tier} slots closed for ${formatDateDisplay(activeScheduleDate)}`;
        affectedCount++;
      }
    }
  });

  renderTurfVisualSlotRack();
  renderTurfScheduleTable();
  if (typeof renderPlatformAuditLogs === 'function') renderPlatformAuditLogs();
  showToast(`${affectedCount} ${tier} slots updated for ${formatDateDisplay(activeScheduleDate)}.`, 'success');
}

function renderTurfScheduleTable() {
  const tbody = document.getElementById('turf-slots-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);
  groundSlots = slots; // maintain backward-compatibility alias

  const titleEl = document.getElementById('turf-schedule-ground-title');
  if (titleEl) {
    titleEl.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> ${activeGround.name} (${activeGround.format} • ${activeGround.capacity} Players Capacity) — Schedule <span class="text-emerald-400 font-mono text-xs ml-1">(${formatDateDisplay(activeScheduleDate)})</span>`;
  }

  // Update Emergency Banner in Schedule Header
  const groundBanner = document.getElementById('ground-emergency-banner');
  const groundBannerText = document.getElementById('ground-emergency-text');
  if (groundBanner && groundBannerText) {
    if (activeGround.isUnderMaintenance || apexTurf.isUnderMaintenance) {
      groundBanner.classList.remove('hidden');
      const note = activeGround.closureReason || apexTurf.closureReason || 'Ground under emergency maintenance today.';
      groundBannerText.textContent = `⚠️ ${activeGround.name}: ${note}`;
    } else {
      groundBanner.classList.add('hidden');
    }
  }

  slots.forEach(slot => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors';

    let statusBadge = '';
    if (slot.status === 'AVAILABLE') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">AVAILABLE</span>';
    } else if (slot.status === 'MAINTENANCE') {
      statusBadge = `<div class="flex flex-col"><span class="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">🛠️ MAINTENANCE</span>${slot.maintenanceReason ? `<span class="text-[10px] text-amber-400/80 italic mt-0.5 max-w-[140px] truncate">${slot.maintenanceReason}</span>` : ''}</div>`;
    } else if (slot.status === 'CLOSED') {
      statusBadge = `<div class="flex flex-col"><span class="px-2.5 py-1 rounded-full text-[10px] bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30">🚫 CLOSED</span>${slot.maintenanceReason ? `<span class="text-[10px] text-rose-400/80 italic mt-0.5 max-w-[140px] truncate">${slot.maintenanceReason}</span>` : ''}</div>`;
    } else {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold border border-slate-700">BOOKED</span>';
    }

    const fin = slot.status === 'BOOKED'
      ? `<div class="text-[11px]"><span class="text-emerald-400 font-mono font-bold">Adv: ৳${(slot.advance || 0).toLocaleString()}</span> | <span class="${(slot.due || 0) > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'} font-mono">Due: ৳${(slot.due || 0).toLocaleString()}</span></div>`
      : (slot.status === 'MAINTENANCE' || slot.status === 'CLOSED')
      ? `<span class="text-amber-400/80 text-[10px] font-mono italic">Disabled</span>`
      : '<span class="text-slate-500 font-mono">—</span>';

    const slotPrice = slot.basePrice || (activeGround ? activeGround.price1_5h : 2800);

    let actionButtons = '';
    if (slot.status === 'AVAILABLE') {
      actionButtons += `
        <button onclick="toggleSlotStatusQuick('${slot.id}', 'MAINTENANCE')" title="Close/disable slot for ${formatDateDisplay(activeScheduleDate)}" class="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-500/30 flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="power" class="w-3 h-3 text-rose-400"></i> Close
        </button>
      `;
    } else if (slot.status === 'MAINTENANCE' || slot.status === 'CLOSED') {
      actionButtons += `
        <button onclick="toggleSlotStatusQuick('${slot.id}', 'AVAILABLE')" title="Re-open slot for public bookings on ${formatDateDisplay(activeScheduleDate)}" class="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="check-circle" class="w-3 h-3 text-emerald-400"></i> Open
        </button>
      `;
    }

    if (slot.status === 'BOOKED' && (slot.due || 0) > 0) {
      actionButtons += `
        <button onclick="quickCollectCashTurf('${slot.id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] rounded-lg shadow-sm cursor-pointer">
          Collect Cash
        </button>
      `;
    }

    actionButtons += `
      <button onclick="openEditSlotModal('${slot.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer">
        <i data-lucide="edit-3" class="w-3 h-3 text-emerald-400"></i> Edit Slot
      </button>
    `;

    tr.innerHTML = `
      <td class="py-3 font-mono font-bold text-white flex items-center gap-2">
        <span class="w-2 h-2 rounded-full ${slot.tier === 'MORNING' ? 'bg-amber-400' : slot.tier === 'AFTERNOON' ? 'bg-blue-400' : slot.tier === 'EVENING' ? 'bg-emerald-400' : 'bg-indigo-400'}"></span>
        <span>${slot.slotLabel || slot.time}</span>
      </td>
      <td class="py-3 text-slate-300 font-medium">1.5 Hours</td>
      <td class="py-3 font-mono text-emerald-400 font-bold">৳${slotPrice.toLocaleString()}</td>
      <td class="py-3">${statusBadge}</td>
      <td class="py-3">${slot.bookingRef ? `<span class="font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">${slot.bookingRef}</span>` : '<span class="text-slate-500 font-mono">—</span>'}</td>
      <td class="py-3">${fin}</td>
      <td class="py-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          ${actionButtons}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

function renderTurfCapacitiesList() {
  const container = document.getElementById('turf-capacities-list');
  if (!container) return;
  container.innerHTML = '';

  const apexTurf = turfsDatabase[0];
  apexTurf.grounds.forEach(g => {
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-3';
    item.innerHTML = `
      <div>
        <div class="font-bold text-white flex items-center gap-2">
          ${g.name}
          <span class="px-2 py-0.2 rounded bg-slate-800 text-[9px] text-emerald-400 font-mono">${g.format}</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">Capacity: <strong class="text-emerald-400">${g.capacity} Players</strong> (${g.surface})</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right font-mono text-[11px]">
          <div class="text-white font-bold">1h: ৳${g.price1h} | 1.5h: ৳${g.price1_5h}</div>
          <div class="text-slate-400">2h: ৳${g.price2h}</div>
        </div>
        <button onclick="openEditCapacityPricingModal('${g.id}')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1">
          <i data-lucide="sliders" class="w-3 h-3 text-emerald-400"></i> Edit Rates
        </button>
      </div>
    `;
    container.appendChild(item);
  });
  lucide.createIcons();
}

// ---------------------------------------------------------------------------
// 6.1 GROUND REGISTRATION & CAPACITY/TIMING MUTATION LOGIC
// ---------------------------------------------------------------------------
function openRegisterGroundModal() {
  document.getElementById('register-ground-modal').classList.remove('hidden');
  document.getElementById('register-ground-modal').classList.add('flex');
  lucide.createIcons();
}

function closeRegisterGroundModal() {
  document.getElementById('register-ground-modal').classList.add('hidden');
  document.getElementById('register-ground-modal').classList.remove('flex');
}

function handleRegisterNewGround(e) {
  e.preventDefault();
  const name = document.getElementById('new-ground-name').value.trim();
  const sport = document.getElementById('new-ground-sport').value;
  const format = document.getElementById('new-ground-format').value.trim();
  const capacity = parseInt(document.getElementById('new-ground-capacity').value) || 10;
  const surface = document.getElementById('new-ground-surface').value.trim();
  const p1h = parseInt(document.getElementById('new-ground-p1h').value) || 2000;
  const p1_5h = parseInt(document.getElementById('new-ground-p1_5h').value) || 2800;
  const p2h = parseInt(document.getElementById('new-ground-p2h').value) || 3600;

  const newGroundId = `grd_${Date.now()}`;
  const newGround = {
    id: newGroundId,
    name: name,
    sport: sport,
    format: format,
    capacity: capacity,
    surface: surface,
    price1h: p1h,
    price1_5h: p1_5h,
    price2h: p2h
  };

  // Add to active turf
  turfsDatabase[0].grounds.push(newGround);
  if (!turfsDatabase[0].sportsSupported.includes(sport)) {
    turfsDatabase[0].sportsSupported.push(sport);
  }

  // Generate standardized 1.5-hour slots for this new ground
  const standardSlots = [
    { slotNumber: 1, label: 'Slot 1 : 6 Am - 7:30 AM', time: '6:00 AM – 7:30 AM', tier: 'MORNING' },
    { slotNumber: 2, label: 'Slot 2 : 7:30 Am - 9:00 AM', time: '7:30 AM – 9:00 AM', tier: 'MORNING' },
    { slotNumber: 3, label: 'Slot 3 : 9:00 Am - 10:30 AM', time: '9:00 AM – 10:30 AM', tier: 'MORNING' },
    { slotNumber: 4, label: 'Slot 4 : 10:30 Am - 12:00 PM', time: '10:30 AM – 12:00 PM', tier: 'MORNING' },
    { slotNumber: 5, label: 'Slot 5 : 12:00 Pm - 1:30 PM', time: '12:00 PM – 1:30 PM', tier: 'AFTERNOON' },
    { slotNumber: 6, label: 'Slot 6 : 1:30 Pm - 3:00 PM', time: '1:30 PM – 3:00 PM', tier: 'AFTERNOON' },
    { slotNumber: 7, label: 'Slot 7 : 3:00 Pm - 4:30 PM', time: '3:00 PM – 4:30 PM', tier: 'AFTERNOON' },
    { slotNumber: 8, label: 'Slot 8 : 4:30 Pm - 6:00 PM', time: '4:30 PM – 6:00 PM', tier: 'AFTERNOON' },
    { slotNumber: 9, label: 'Slot 9 : 6:00 Pm - 7:30 PM', time: '6:00 PM – 7:30 PM', tier: 'EVENING' },
    { slotNumber: 10, label: 'Slot 10 : 7:30 Pm - 9:00 PM', time: '7:30 PM – 9:00 PM', tier: 'EVENING' },
    { slotNumber: 11, label: 'Slot 11 : 9:00 Pm - 10:30 PM', time: '9:00 PM – 10:30 PM', tier: 'EVENING' },
    { slotNumber: 12, label: 'Slot 12 : 10:30 Pm - 12:00 AM', time: '10:30 PM – 12:00 AM', tier: 'EVENING' },
    { slotNumber: 13, label: 'Slot 13 : 12:00 Am - 1:30 AM', time: '12:00 AM – 1:30 AM', tier: 'NIGHT' },
    { slotNumber: 14, label: 'Slot 14 : 1:30 Am - 3:00 AM', time: '1:30 AM – 3:00 AM', tier: 'NIGHT' },
    { slotNumber: 15, label: 'Slot 15 : 3:00 Am - 4:30 AM', time: '3:00 AM – 4:30 AM', tier: 'NIGHT' },
    { slotNumber: 16, label: 'Slot 16 : 4:30 Am - 6:00 AM', time: '4:30 AM – 6:00 AM', tier: 'NIGHT' }
  ];
  standardSlots.forEach(s => {
    groundSlots.push({
      id: `sl_${Date.now()}_${s.slotNumber}`,
      slotNumber: s.slotNumber,
      groundId: newGroundId,
      slotLabel: s.label,
      time: s.time,
      tier: s.tier,
      status: 'AVAILABLE',
      basePrice: p1_5h,
      duration: 1.5
    });
  });

  // Log in multi-agent audit trail
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:50 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_ADMIN (Shift A)',
    action: 'GROUND_REGISTERED',
    category: 'FACILITY',
    target: `Turf: Apex Arena -> ${name}`,
    diff: {
      sport: sport,
      format: format,
      capacity: `${capacity} Players`,
      rates: `1.5h: ৳${p1_5h}`
    },
    reason: 'New court/ground facility onboarding with standard 1.5h slots',
    ip: '103.145.22.18'
  });

  closeRegisterGroundModal();
  renderTurfGroundPills();
  renderTurfCapacitiesList();
  renderTurfScheduleTable();
  renderCustomerTurfs(turfsDatabase);

  showToast(`Ground "${name}" registered with 16 standard 1.5-hour slots! Live now.`, 'success');
}

function toggleEditSlotMaintenanceFields(val) {
  const box = document.getElementById('edit-slot-maintenance-box');
  if (!box) return;
  if (val === 'MAINTENANCE' || val === 'CLOSED') {
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
}

function openEditSlotModal(slotId) {
  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  document.getElementById('edit-slot-id').value = slot.id;
  const parts = slot.time.split('–').map(x => x.trim());
  document.getElementById('edit-slot-start').value = parts[0] || '06:00 AM';
  document.getElementById('edit-slot-end').value = parts[1] || '07:30 AM';
  document.getElementById('edit-slot-price').value = slot.basePrice || 2800;

  const statusSelect = document.getElementById('edit-slot-status');
  if (statusSelect) {
    statusSelect.value = slot.status || 'AVAILABLE';
    toggleEditSlotMaintenanceFields(statusSelect.value);
  }
  const reasonInput = document.getElementById('edit-slot-maintenance-reason');
  if (reasonInput) {
    reasonInput.value = slot.maintenanceReason || '';
  }

  document.getElementById('edit-slot-modal').classList.remove('hidden');
  document.getElementById('edit-slot-modal').classList.add('flex');
  lucide.createIcons();
}

function closeEditSlotModal() {
  document.getElementById('edit-slot-modal').classList.add('hidden');
  document.getElementById('edit-slot-modal').classList.remove('flex');
}

function handleSaveSlotTimingAndPrice(e) {
  e.preventDefault();
  const slotId = document.getElementById('edit-slot-id').value;
  const start = document.getElementById('edit-slot-start').value.trim();
  const end = document.getElementById('edit-slot-end').value.trim();
  const price = parseInt(document.getElementById('edit-slot-price').value) || 2800;
  const reason = document.getElementById('edit-slot-reason').value.trim();
  const statusSelect = document.getElementById('edit-slot-status');
  const newStatus = statusSelect ? statusSelect.value : 'AVAILABLE';
  const maintenanceReason = document.getElementById('edit-slot-maintenance-reason') ? document.getElementById('edit-slot-maintenance-reason').value.trim() : '';

  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  const oldTime = slot.time;
  const oldPrice = slot.basePrice || 2800;
  const oldStatus = slot.status || 'AVAILABLE';

  slot.time = `${start} – ${end}`;
  slot.slotLabel = `Slot ${slot.slotNumber || 1} : ${start} - ${end}`;
  slot.basePrice = price;
  slot.duration = 1.5;
  slot.status = newStatus;
  slot.maintenanceReason = (newStatus === 'MAINTENANCE' || newStatus === 'CLOSED') ? (maintenanceReason || `Emergency maintenance for ${formatDateDisplay(activeScheduleDate)}`) : '';

  // Log in multi-agent audit trail
  const isStatusChange = newStatus !== oldStatus;
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:52 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: isStatusChange ? 'SLOT_MAINTENANCE_TOGGLED' : 'SLOT_TIMING_PRICE_UPDATED',
    category: isStatusChange ? 'MAINTENANCE' : 'PRICING',
    target: `Slot: ${slot.slotLabel} [${formatDateDisplay(activeScheduleDate)}]`,
    diff: {
      timing: `${oldTime} -> ${slot.time}`,
      price: `৳${oldPrice} -> ৳${price}`,
      status: `${oldStatus} -> ${slot.status}`,
      calendarDate: activeScheduleDate,
      maintenanceNote: slot.maintenanceReason || 'None'
    },
    reason: reason || maintenanceReason || 'Slot parameters update',
    ip: '103.145.22.18'
  });

  closeEditSlotModal();
  renderTurfVisualSlotRack();
  renderTurfScheduleTable();
  if (typeof renderPlatformAuditLogs === 'function') renderPlatformAuditLogs();
  showToast(`Slot "${slot.slotLabel}" saved for ${formatDateDisplay(activeScheduleDate)}! Status: ${slot.status}.`, 'success');
}

function quickDisableSlotForMaintenance(slotId) {
  toggleSlotStatusQuick(slotId, 'MAINTENANCE');
}

function quickReopenSlot(slotId) {
  toggleSlotStatusQuick(slotId, 'AVAILABLE');
}

// ---------------------------------------------------------------------------
// 6.1b EMERGENCY WHOLE-DAY / FACILITY CLOSURE & DISASTER RECOVERY
// ---------------------------------------------------------------------------
function openEmergencyClosureModal() {
  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const hintEl = document.getElementById('closure-ground-name-hint');
  if (hintEl) hintEl.textContent = `${activeGround.name} (${activeGround.format})`;

  const dateTargetEl = document.getElementById('closure-target-date-display');
  if (dateTargetEl) dateTargetEl.textContent = getFullFormattedDate(activeScheduleDate);

  const modal = document.getElementById('emergency-closure-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
  }
}

function closeEmergencyClosureModal() {
  const modal = document.getElementById('emergency-closure-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleExecuteEmergencyClosure(e) {
  e.preventDefault();
  const scopeEl = document.querySelector('input[name="closure_scope"]:checked');
  const scope = scopeEl ? scopeEl.value : 'CLOSE_GROUND';
  const category = document.getElementById('closure-category').value;
  const note = document.getElementById('closure-note').value.trim() || 'Facility under maintenance.';

  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];

  if (scope === 'CLOSE_GROUND') {
    activeGround.isUnderMaintenance = true;
    activeGround.closureCategory = category;
    activeGround.closureReason = `${category}: ${note}`;

    const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);
    let affectedCount = 0;
    slots.forEach(s => {
      if (s.status !== 'BOOKED') {
        s.status = 'MAINTENANCE';
        s.maintenanceReason = `${category} (${note})`;
        affectedCount++;
      }
    });

    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: '14 Oct 2026, 09:58 PM',
      actorName: 'Robiul Islam',
      actorRole: 'TURF_ADMIN (Shift A)',
      action: 'GROUND_EMERGENCY_CLOSURE_APPLIED',
      category: 'MAINTENANCE',
      target: `Ground: ${activeGround.name} [${formatDateDisplay(activeScheduleDate)}]`,
      diff: {
        isUnderMaintenance: true,
        calendarDate: activeScheduleDate,
        category: category,
        reason: note,
        affectedSlots: `${affectedCount} slots set to MAINTENANCE`
      },
      reason: note,
      ip: '103.145.22.18'
    });

    showToast(`Emergency closure applied to ${activeGround.name} for ${formatDateDisplay(activeScheduleDate)}. ${affectedCount} slots disabled.`, 'warning');

  } else if (scope === 'CLOSE_ALL_GROUNDS') {
    apexTurf.isUnderMaintenance = true;
    apexTurf.closureCategory = category;
    apexTurf.closureReason = `${category}: ${note}`;

    let totalAffected = 0;
    apexTurf.grounds.forEach(g => {
      g.isUnderMaintenance = true;
      g.closureCategory = category;
      g.closureReason = `${category}: ${note}`;
      const slots = getSlotsForGround(g.id, g.price1_5h, activeScheduleDate);
      slots.forEach(s => {
        if (s.status !== 'BOOKED') {
          s.status = 'MAINTENANCE';
          s.maintenanceReason = `${category} (${note})`;
          totalAffected++;
        }
      });
    });

    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: '14 Oct 2026, 09:58 PM',
      actorName: 'Robiul Islam',
      actorRole: 'TURF_ADMIN (Shift A)',
      action: 'FACILITY_EMERGENCY_CLOSURE_APPLIED',
      category: 'MAINTENANCE',
      target: `Facility: Apex Arena (All Grounds) [${formatDateDisplay(activeScheduleDate)}]`,
      diff: {
        facilityUnderMaintenance: true,
        calendarDate: activeScheduleDate,
        category: category,
        reason: note,
        totalAffectedSlots: `${totalAffected} slots set to MAINTENANCE`
      },
      reason: note,
      ip: '103.145.22.18'
    });

    showToast(`Entire Apex Arena facility is closed for ${formatDateDisplay(activeScheduleDate)}! All grounds disabled.`, 'error');

  } else if (scope === 'REOPEN_GROUND') {
    activeGround.isUnderMaintenance = false;
    activeGround.closureCategory = '';
    activeGround.closureReason = '';

    const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);
    let restoredCount = 0;
    slots.forEach(s => {
      if (s.status === 'MAINTENANCE' || s.status === 'CLOSED') {
        s.status = 'AVAILABLE';
        s.maintenanceReason = '';
        restoredCount++;
      }
    });

    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: '14 Oct 2026, 09:59 PM',
      actorName: 'Robiul Islam',
      actorRole: 'TURF_ADMIN (Shift A)',
      action: 'GROUND_REOPENED',
      category: 'MAINTENANCE',
      target: `Ground: ${activeGround.name} [${formatDateDisplay(activeScheduleDate)}]`,
      diff: {
        isUnderMaintenance: false,
        calendarDate: activeScheduleDate,
        restoredSlots: `${restoredCount} slots restored to AVAILABLE`
      },
      reason: 'Emergency resolved; ground re-opened',
      ip: '103.145.22.18'
    });

    showToast(`${activeGround.name} re-opened for ${formatDateDisplay(activeScheduleDate)}! ${restoredCount} slots restored.`, 'success');

  } else if (scope === 'REOPEN_ALL') {
    apexTurf.isUnderMaintenance = false;
    apexTurf.closureCategory = '';
    apexTurf.closureReason = '';

    let totalRestored = 0;
    apexTurf.grounds.forEach(g => {
      g.isUnderMaintenance = false;
      g.closureCategory = '';
      g.closureReason = '';
      const slots = getSlotsForGround(g.id, g.price1_5h, activeScheduleDate);
      slots.forEach(s => {
        if (s.status === 'MAINTENANCE' || s.status === 'CLOSED') {
          s.status = 'AVAILABLE';
          s.maintenanceReason = '';
          totalRestored++;
        }
      });
    });

    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      timestamp: '14 Oct 2026, 09:59 PM',
      actorName: 'Robiul Islam',
      actorRole: 'TURF_ADMIN (Shift A)',
      action: 'FACILITY_REOPENED',
      category: 'MAINTENANCE',
      target: `Facility: Apex Arena (All Grounds) [${formatDateDisplay(activeScheduleDate)}]`,
      diff: {
        facilityUnderMaintenance: false,
        calendarDate: activeScheduleDate,
        restoredSlots: `${totalRestored} slots restored to AVAILABLE`
      },
      reason: 'All maintenance activities concluded; facility re-opened',
      ip: '103.145.22.18'
    });

    showToast(`Apex Arena facility re-opened for ${formatDateDisplay(activeScheduleDate)}! All grounds & ${totalRestored} slots restored.`, 'success');
  }

  closeEmergencyClosureModal();
  renderTurfDateChips();
  renderTurfVisualSlotRack();
  renderTurfScheduleTable();
  if (typeof renderPlatformAuditLogs === 'function') renderPlatformAuditLogs();
}

function openEditCapacityPricingModal(groundId) {
  const ground = turfsDatabase[0].grounds.find(g => g.id === groundId);
  if (!ground) return;

  document.getElementById('edit-capacity-ground-id').value = ground.id;
  document.getElementById('edit-capacity-ground-name').textContent = ground.name;
  document.getElementById('edit-capacity-players').value = ground.capacity;
  document.getElementById('edit-capacity-format').value = ground.format;
  document.getElementById('edit-capacity-p1h').value = ground.price1h;
  document.getElementById('edit-capacity-p1_5h').value = ground.price1_5h;
  document.getElementById('edit-capacity-p2h').value = ground.price2h;

  document.getElementById('edit-capacity-pricing-modal').classList.remove('hidden');
  document.getElementById('edit-capacity-pricing-modal').classList.add('flex');
  lucide.createIcons();
}

function closeEditCapacityPricingModal() {
  document.getElementById('edit-capacity-pricing-modal').classList.add('hidden');
  document.getElementById('edit-capacity-pricing-modal').classList.remove('flex');
}

function handleSaveCapacityPricing(e) {
  e.preventDefault();
  const groundId = document.getElementById('edit-capacity-ground-id').value;
  const cap = parseInt(document.getElementById('edit-capacity-players').value) || 10;
  const fmt = document.getElementById('edit-capacity-format').value.trim();
  const p1h = parseInt(document.getElementById('edit-capacity-p1h').value) || 2000;
  const p1_5h = parseInt(document.getElementById('edit-capacity-p1_5h').value) || 2800;
  const p2h = parseInt(document.getElementById('edit-capacity-p2h').value) || 3600;
  const reason = document.getElementById('edit-capacity-reason').value.trim();

  const ground = turfsDatabase[0].grounds.find(g => g.id === groundId);
  if (!ground) return;

  const oldCap = ground.capacity;
  const old1h = ground.price1h;

  ground.capacity = cap;
  ground.format = fmt;
  ground.price1h = p1h;
  ground.price1_5h = p1_5h;
  ground.price2h = p2h;

  // Log in multi-agent audit trail
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:55 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_ADMIN (Shift A)',
    action: 'CAPACITY_PRICING_UPDATED',
    category: 'CAPACITY',
    target: `Ground: ${ground.name}`,
    diff: {
      capacity: `${oldCap} Players -> ${cap} Players`,
      format: fmt,
      new_rates: `1h: ৳${p1h} | 1.5h: ৳${p1_5h} | 2h: ৳${p2h}`
    },
    reason: reason,
    ip: '103.145.22.18'
  });

  closeEditCapacityPricingModal();
  renderTurfCapacitiesList();
  renderTurfGroundPills();
  renderTurfScheduleTable();
  renderCustomerTurfs(turfsDatabase);

  showToast(`Ground "${ground.name}" capacity updated to ${cap} players! Rates synced.`, 'success');
}

function setTurfDepositPercent(pct) {
  [30, 40, 50].forEach(p => {
    const btn = document.getElementById(`dep-btn-${p}`);
    if (btn) btn.className = 'p-3 rounded-xl border border-slate-800 bg-slate-950 font-mono font-bold text-sm text-slate-300 hover:border-emerald-500';
  });
  document.getElementById(`dep-btn-${pct}`).className = 'p-3 rounded-xl border border-emerald-500 bg-emerald-500/10 font-mono font-bold text-sm text-emerald-400';

  turfsDatabase[0].depositPercent = pct;

  // Log in Audit Trail
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:40 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: 'DEPOSIT_PERCENT_UPDATED',
    category: 'POLICY',
    target: 'Turf: Apex Arena',
    diff: { new_deposit_percent: `${pct}%` },
    reason: 'Updated turf advance deposit rule',
    ip: '103.145.22.18'
  });

  showToast(`Deposit policy updated to ${pct}%! (${pct}% online deposit + ৳200 fee).`, 'success');
}

function openForcedDiscountModal() {
  document.getElementById('forced-discount-modal').classList.remove('hidden');
  document.getElementById('forced-discount-modal').classList.add('flex');
}

function closeForcedDiscountModal() {
  document.getElementById('forced-discount-modal').classList.add('hidden');
  document.getElementById('forced-discount-modal').classList.remove('flex');
}

function confirmForcedDiscount() {
  const ref = document.getElementById('discount-booking-ref').value;
  const amt = parseInt(document.getElementById('forced-discount-amount').value) || 300;
  const reason = document.getElementById('forced-discount-reason').value;

  const slot = groundSlots.find(s => s.bookingRef === ref);
  if (slot) {
    slot.due = Math.max(0, slot.due - amt);
  }

  // Audit log entry
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 09:42 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: 'FORCED_DISCOUNT_APPLIED',
    category: 'DISCOUNT',
    target: `Booking: ${ref}`,
    diff: { discount_deducted: `৳${amt}`, updated_counter_due: `৳${slot ? slot.due : 0}` },
    reason: reason,
    ip: '103.145.22.18'
  });

  closeForcedDiscountModal();
  renderTurfScheduleTable();
  showToast(`Forced discount of ৳${amt} applied to ${ref}! Balance due reduced.`, 'success');
}

function quickCollectCashTurf(slotId) {
  const apexTurf = turfsDatabase[0];
  const activeGround = apexTurf.grounds.find(g => g.id === activeTurfGroundId) || apexTurf.grounds[0];
  const slots = getSlotsForGround(activeGround.id, activeGround.price1_5h, activeScheduleDate);
  const slot = slots.find(s => s.id === slotId) || (groundSlots ? groundSlots.find(s => s.id === slotId) : null);
  if (!slot) return;
  const collected = slot.due || 0;
  slot.due = 0;

  // Also update desk queue if matching bookingRef exists
  if (slot.bookingRef) {
    const b = deskBookingsQueue.find(x => x.ref === slot.bookingRef);
    if (b) {
      b.dueAmount = 0;
      b.status = 'COMPLETED / PAID IN FULL AT COUNTER';
      b.settledAt = `${formatDateDisplay(activeScheduleDate)}, 05:30 PM`;
    }
  }

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: `${formatDateDisplay(activeScheduleDate)}, 05:30 PM`,
    actorName: 'Robiul Islam',
    actorRole: 'TURF_COUNTER (Shift A)',
    action: 'COUNTER_CASH_COLLECTED',
    category: 'PAYMENT',
    target: `Booking: ${slot.bookingRef}`,
    diff: { cash_received: `৳${collected.toLocaleString()}`, counter_due: '৳0 (CLEARED)' },
    reason: 'Player arrived, counter desk collected balance cash',
    ip: '103.145.22.18'
  });

  renderTurfScheduleTable();
  renderTurfShiftFinancialSummary();
  renderDeskBookingsQueue();
  renderTurfFinancialAnalytics();
  showToast(`Received ৳${collected.toLocaleString()} cash for ${slot.bookingRef}. Status cleared!`, 'success');
}

function openCounterCheckInModal() {
  document.getElementById('counter-checkin-modal').classList.remove('hidden');
  document.getElementById('counter-checkin-modal').classList.add('flex');
}

function closeCounterCheckInModal() {
  document.getElementById('counter-checkin-modal').classList.add('hidden');
  document.getElementById('counter-checkin-modal').classList.remove('flex');
}

function lookupBookingForCheckIn() {
  const ref = document.getElementById('checkin-lookup-ref').value;
  showToast(`Booking ${ref} verified! Player: Al Nahyan Khan (Due: ৳1,200).`, 'info');
}

function confirmCounterCashCollection() {
  closeCounterCheckInModal();
  showToast('Cash of ৳1,200 collected! Booking marked PAID IN FULL.', 'success');
}

// ---------------------------------------------------------------------------
// 7. PLATFORM ADMIN PORTAL LOGIC & REVENUE REPORTS
// ---------------------------------------------------------------------------
function renderPlatformAdminDashboard() {
  const tbody = document.getElementById('plat-turfs-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const turfMetrics = [
    { name: 'Apex Arena & Sports Complex', location: 'Dhanmondi', bookings: 98, gross: 235200, fee: 98 * BASE_PLATFORM_FEE, status: 'Settled' },
    { name: 'Green Pitch Turf & Arena', location: 'Bashundhara', bookings: 74, gross: 192400, fee: 74 * BASE_PLATFORM_FEE, status: 'Settled' },
    { name: 'KickOff & Smash Sports Hub', location: 'Uttara', bookings: 42, gross: 92400, fee: 42 * BASE_PLATFORM_FEE, status: 'Pending Payout' },
    { name: 'Mirpur Super Turf', location: 'Mirpur', bookings: 29, gross: 63800, fee: 29 * BASE_PLATFORM_FEE, status: 'Settled' }
  ];

  turfMetrics.forEach(m => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40';
    tr.innerHTML = `
      <td class="py-3 font-bold text-white">${m.name}</td>
      <td class="py-3 text-slate-300">${m.location}</td>
      <td class="py-3 font-mono text-white">${m.bookings} slots</td>
      <td class="py-3 font-mono font-bold text-white">৳${m.gross.toLocaleString()}</td>
      <td class="py-3 font-mono font-bold text-emerald-400">৳${m.fee.toLocaleString()}</td>
      <td class="py-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'Settled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
          ${m.status}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =========================================================================
// 7. PLATFORM ADMIN: USER-FRIENDLY TURF PAYOUTS & ESCROW SETTLEMENT HUB
// =========================================================================
let payoutStatusFilter = 'ALL';
let activeDisbursingSettlementId = null;

let platformSettlements = [
  {
    id: 'SET-202610-A',
    turfId: 'trf_001',
    turfName: 'Apex Arena & Sports Complex',
    area: 'Dhanmondi, Dhaka',
    accountType: 'BANK',
    accountDetails: 'City Bank (A/C: 1102938491) • Dhanmondi Br.',
    period: '01 Oct – 10 Oct 2026',
    matchesCount: 98,
    onlineCollected: 94000,
    feeRetained: 19600,
    netPayable: 74400,
    status: 'DISBURSED',
    disbursedAt: '12 Oct 2026, 04:15 PM',
    channel: 'bKash Merchant B2B Disburse',
    txnRef: 'TXN-BK-993821'
  },
  {
    id: 'SET-202610-B',
    turfId: 'trf_002',
    turfName: 'Green Pitch Turf & Arena',
    area: 'Bashundhara, Dhaka',
    accountType: 'BANK',
    accountDetails: 'BRAC Bank (A/C: 2209182390) • Gulshan Br.',
    period: '01 Oct – 10 Oct 2026',
    matchesCount: 74,
    onlineCollected: 76000,
    feeRetained: 14800,
    netPayable: 61200,
    status: 'DISBURSED',
    disbursedAt: '12 Oct 2026, 05:00 PM',
    channel: 'BEFTN Bank Clearing',
    txnRef: 'TXN-BRAC-102938'
  },
  {
    id: 'SET-202610-C',
    turfId: 'trf_003',
    turfName: 'KickOff & Smash Sports Hub',
    area: 'Uttara, Dhaka',
    accountType: 'BANK',
    accountDetails: 'Eastern Bank Ltd (A/C: 1048291039) • Uttara Br.',
    period: '05 Oct – 14 Oct 2026',
    matchesCount: 52,
    onlineCollected: 58000,
    feeRetained: 10400,
    netPayable: 47600,
    status: 'PENDING',
    disbursedAt: null,
    channel: 'bKash Merchant B2B Disburse',
    txnRef: null
  },
  {
    id: 'SET-202610-D',
    turfId: 'trf_004',
    turfName: 'Mirpur Super Turf',
    area: 'Mirpur Section 2, Dhaka',
    accountType: 'BKASH_MERCHANT',
    accountDetails: 'bKash Merchant Wallet: 01711998877',
    period: '08 Oct – 14 Oct 2026',
    matchesCount: 38,
    onlineCollected: 42000,
    feeRetained: 7600,
    netPayable: 34400,
    status: 'PENDING',
    disbursedAt: null,
    channel: 'bKash Merchant B2B Disburse',
    txnRef: null
  },
  {
    id: 'SET-202610-E',
    turfId: 'trf_005',
    turfName: 'Bashundhara Knights Arena',
    area: 'Bashundhara Block I, Dhaka',
    accountType: 'BANK',
    accountDetails: 'Dutch-Bangla Bank (A/C: 1528392019) • Bashundhara Br.',
    period: '08 Oct – 14 Oct 2026',
    matchesCount: 31,
    onlineCollected: 36000,
    feeRetained: 6200,
    netPayable: 29800,
    status: 'PROCESSING',
    disbursedAt: null,
    channel: 'NPSB Instant Bank Settlement',
    txnRef: 'TXN-NPSB-883920'
  },
  {
    id: 'SET-202610-F',
    turfId: 'trf_006',
    turfName: 'Dhanmondi Club Court',
    area: 'Dhanmondi Road 27, Dhaka',
    accountType: 'BKASH_MERCHANT',
    accountDetails: 'bKash Merchant Wallet: 01819334455',
    period: '08 Oct – 14 Oct 2026',
    matchesCount: 43,
    onlineCollected: 48000,
    feeRetained: 8600,
    netPayable: 39400,
    status: 'PENDING',
    disbursedAt: null,
    channel: 'bKash Merchant B2B Disburse',
    txnRef: null
  }
];

function filterSettlementsByStatus(status) {
  payoutStatusFilter = status;
  ['ALL', 'PENDING', 'PROCESSING', 'DISBURSED'].forEach(s => {
    const pill = document.getElementById(`payout-pill-${s}`);
    if (pill) {
      if (s === status) {
        pill.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 cursor-pointer shadow-sm';
      } else {
        pill.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-slate-300 hover:text-white border border-slate-800 cursor-pointer';
      }
    }
  });
  renderPlatformSettlementsTable();
}

function renderPlatformSettlementsTable() {
  const tbody = document.getElementById('plat-settlements-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const searchInput = document.getElementById('payout-search-input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let totalGross = 0;
  let totalFees = 0;
  let readyDisburse = 0;
  let totalDisbursed = 0;

  platformSettlements.forEach(s => {
    totalGross += s.onlineCollected;
    totalFees += s.feeRetained;
    if (s.status === 'PENDING' || s.status === 'PROCESSING') {
      readyDisburse += s.netPayable;
    } else if (s.status === 'DISBURSED') {
      totalDisbursed += s.netPayable;
    }
  });

  const grossEl = document.getElementById('payout-stat-online-gross');
  const feeEl = document.getElementById('payout-stat-fees-retained');
  const readyEl = document.getElementById('payout-stat-ready-disburse');
  const disbEl = document.getElementById('payout-stat-total-disbursed');

  if (grossEl) grossEl.textContent = `৳${totalGross.toLocaleString()}`;
  if (feeEl) feeEl.textContent = `৳${totalFees.toLocaleString()}`;
  if (readyEl) readyEl.textContent = `৳${readyDisburse.toLocaleString()}`;
  if (disbEl) disbEl.textContent = `৳${totalDisbursed.toLocaleString()}`;

  const filtered = platformSettlements.filter(s => {
    const matchesStatus = (payoutStatusFilter === 'ALL' || s.status === payoutStatusFilter);
    const matchesQuery = !query || 
      s.id.toLowerCase().includes(query) || 
      s.turfName.toLowerCase().includes(query) || 
      s.area.toLowerCase().includes(query) ||
      s.accountDetails.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  if (filtered.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="9" class="py-8 text-center text-slate-500 text-xs">No payout records found matching your filter criteria.</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  filtered.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors text-xs';

    let statusPill = '';
    if (s.status === 'DISBURSED') {
      statusPill = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> DISBURSED</span>`;
    } else if (s.status === 'PROCESSING') {
      statusPill = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1 w-max"><span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-spin"></span> PROCESSING</span>`;
    } else {
      statusPill = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> PENDING</span>`;
    }

    let actionBtn = '';
    if (s.status !== 'DISBURSED') {
      actionBtn = `
        <button onclick="openAdminDisburseModal('${s.id}')" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer">
          <i data-lucide="send" class="w-3 h-3"></i>
          <span>Disburse</span>
        </button>
      `;
    } else {
      actionBtn = `
        <button onclick="openSettlementReceiptModal('${s.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs border border-slate-700 flex items-center gap-1 transition-all cursor-pointer">
          <i data-lucide="receipt" class="w-3 h-3 text-emerald-400"></i>
          <span>Voucher</span>
        </button>
      `;
    }

    tr.innerHTML = `
      <td class="py-3 font-mono font-bold text-white">
        <div>${s.id}</div>
        <div class="text-[10px] text-slate-500 font-sans font-normal">${s.disbursedAt || 'Pending Release'}</div>
      </td>
      <td class="py-3 font-bold text-white">
        <div class="flex items-center gap-1.5">
          <span>${s.turfName}</span>
        </div>
        <div class="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]" title="${s.accountDetails}">
          ${s.accountDetails}
        </div>
      </td>
      <td class="py-3 text-slate-300 font-mono">${s.period}</td>
      <td class="py-3 font-mono text-slate-200">${s.matchesCount} slots</td>
      <td class="py-3 font-mono text-white font-bold">৳${s.onlineCollected.toLocaleString()}</td>
      <td class="py-3 font-mono text-rose-300 font-bold">-৳${s.feeRetained.toLocaleString()}</td>
      <td class="py-3 font-mono font-black text-emerald-400 text-sm">৳${s.netPayable.toLocaleString()}</td>
      <td class="py-3">${statusPill}</td>
      <td class="py-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          ${actionBtn}
          <button onclick="openSettlementReceiptModal('${s.id}')" title="View Full Breakdown Voucher" class="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

function openAdminDisburseModal(settlementId) {
  const s = platformSettlements.find(x => x.id === settlementId);
  if (!s) return;
  activeDisbursingSettlementId = settlementId;

  document.getElementById('disburse-modal-id').textContent = s.id;
  document.getElementById('disburse-modal-turf').textContent = s.turfName;
  document.getElementById('disburse-modal-acc').textContent = s.accountDetails;
  document.getElementById('disburse-modal-amount').textContent = `৳${s.netPayable.toLocaleString()}`;
  document.getElementById('disburse-txn-ref').value = `TXN-BK-${Math.floor(100000 + Math.random() * 900000)}`;

  const modal = document.getElementById('admin-disburse-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeAdminDisburseModal() {
  const modal = document.getElementById('admin-disburse-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  activeDisbursingSettlementId = null;
}

function handleConfirmDisbursement(e) {
  e.preventDefault();
  if (!activeDisbursingSettlementId) return;

  const s = platformSettlements.find(x => x.id === activeDisbursingSettlementId);
  if (!s) return;

  const channel = document.getElementById('disburse-channel').value;
  const txnRef = document.getElementById('disburse-txn-ref').value.trim();
  const memo = document.getElementById('disburse-memo').value.trim();

  s.status = 'DISBURSED';
  s.channel = channel;
  s.txnRef = txnRef;
  s.disbursedAt = '14 Oct 2026, 10:45 PM';

  // Audit trail entry
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:45 PM',
    actorName: 'Super Admin',
    actorRole: 'PLATFORM_ADMIN',
    action: 'TURF_ESCROW_PAYOUT_DISBURSED',
    category: 'SETTLEMENT',
    target: `Settlement: ${s.id} (${s.turfName})`,
    diff: {
      amount_disbursed: `৳${s.netPayable.toLocaleString()}`,
      destination: s.accountDetails,
      payment_channel: channel,
      transaction_ref: txnRef
    },
    reason: memo || 'Authorized escrow payout release to turf management',
    ip: '103.145.22.01'
  });

  closeAdminDisburseModal();
  renderPlatformSettlementsTable();
  showToast(`Payout of ৳${s.netPayable.toLocaleString()} disbursed to ${s.turfName}! Ref: ${txnRef}`, 'success');
}

function openSettlementReceiptModal(settlementId) {
  const s = platformSettlements.find(x => x.id === settlementId);
  if (!s) return;

  document.getElementById('receipt-modal-title').textContent = `Settlement Voucher — ${s.id}`;
  document.getElementById('receipt-turf-name').textContent = s.turfName;
  document.getElementById('receipt-turf-acc').textContent = s.accountDetails;
  document.getElementById('receipt-settlement-id').textContent = s.id;
  document.getElementById('receipt-date').textContent = s.disbursedAt || 'Pending Disbursement';
  document.getElementById('receipt-gross-adv').textContent = `৳${s.onlineCollected.toLocaleString()}`;
  document.getElementById('receipt-plat-fees').textContent = `-৳${s.feeRetained.toLocaleString()}`;
  document.getElementById('receipt-net-paid').textContent = `৳${s.netPayable.toLocaleString()}`;
  document.getElementById('receipt-channel').textContent = s.channel || 'bKash Merchant B2B Disburse API';
  document.getElementById('receipt-txn-id').textContent = s.txnRef || 'PENDING_RELEASE';

  const badge = document.getElementById('receipt-status-badge');
  if (badge) {
    if (s.status === 'DISBURSED') {
      badge.textContent = 'SETTLED & DISBURSED';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    } else {
      badge.textContent = s.status;
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
  }

  const modal = document.getElementById('admin-settlement-receipt-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeSettlementReceiptModal() {
  const modal = document.getElementById('admin-settlement-receipt-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function handleBatchDisbursement() {
  const pending = platformSettlements.filter(s => s.status === 'PENDING' || s.status === 'PROCESSING');
  if (pending.length === 0) {
    showToast('No pending settlements ready for batch release.', 'info');
    return;
  }

  let totalAmount = 0;
  pending.forEach(s => {
    s.status = 'DISBURSED';
    s.disbursedAt = '14 Oct 2026, 10:48 PM';
    s.txnRef = `BATCH-BK-${Math.floor(100000 + Math.random() * 900000)}`;
    totalAmount += s.netPayable;
  });

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:48 PM',
    actorName: 'Super Admin',
    actorRole: 'PLATFORM_ADMIN',
    action: 'BATCH_PAYOUT_DISBURSED',
    category: 'SETTLEMENT',
    target: `Batch Settlement (${pending.length} Turf Facilities)`,
    diff: { total_disbursed: `৳${totalAmount.toLocaleString()}`, batches_count: `${pending.length}` },
    reason: 'Executed bulk B2B merchant disbursement via API gateway',
    ip: '103.145.22.01'
  });

  renderPlatformSettlementsTable();
  showToast(`Batch disbursement of ৳${totalAmount.toLocaleString()} released across ${pending.length} venues!`, 'success');
}

function exportSettlementsCSV() {
  let csv = 'SettlementID,TurfName,AccountDetails,Period,Matches,GrossOnlineAdvance,PlatformFeeRetained,NetPayable,Status,DisbursedAt\n';
  platformSettlements.forEach(s => {
    csv += `"${s.id}","${s.turfName}","${s.accountDetails}","${s.period}",${s.matchesCount},${s.onlineCollected},${s.feeRetained},${s.netPayable},"${s.status}","${s.disbursedAt || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TurfSync_Settlements_${Date.now()}.csv`;
  a.click();
  showToast('Settlements CSV exported successfully!', 'success');
}

// =========================================================================
// 8. PLATFORM ADMIN: USER-FRIENDLY AUDIT TRAILS HUB
// =========================================================================
function renderPlatformAuditLogs() {
  const list = document.getElementById('plat-audit-list');
  if (!list) return;
  list.innerHTML = '';

  const searchInput = document.getElementById('plat-audit-search-input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const catFilterEl = document.getElementById('plat-audit-filter');
  const catFilter = catFilterEl ? catFilterEl.value : 'ALL';

  const roleFilterEl = document.getElementById('plat-audit-role-filter');
  const roleFilter = roleFilterEl ? roleFilterEl.value : 'ALL';

  const filtered = auditLogs.filter(log => {
    const matchesCat = (catFilter === 'ALL' || log.category === catFilter);
    const matchesRole = (roleFilter === 'ALL' || (log.actorRole && log.actorRole.includes(roleFilter)));
    const matchesQuery = !query || 
      log.actorName.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      (log.target && log.target.toLowerCase().includes(query)) ||
      (log.reason && log.reason.toLowerCase().includes(query)) ||
      (log.ip && log.ip.includes(query));
    return matchesCat && matchesRole && matchesQuery;
  });

  const badge = document.getElementById('audit-total-count-badge');
  if (badge) badge.textContent = `Total Events: ${filtered.length}`;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
        No audit events matching query "${query || catFilter}".
      </div>
    `;
    return;
  }

  // Category Icon & Badge Config
  const categoryStyles = {
    PRICING: { icon: 'tag', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
    SETTLEMENT: { icon: 'banknote', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/25' },
    MAINTENANCE: { icon: 'wrench', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
    REVENUE: { icon: 'dollar-sign', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
    DELETION: { icon: 'trash-2', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/25' },
    PROMOTIONS: { icon: 'ticket', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/25' },
    AUTH: { icon: 'smartphone', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/25' },
    FACILITY: { icon: 'shield', bg: 'bg-sky-500/10 text-sky-300 border-sky-500/25' }
  };

  filtered.forEach(log => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900/80 hover:bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs';

    const catStyle = categoryStyles[log.category] || { icon: 'info', bg: 'bg-slate-800 text-slate-300 border-slate-700' };

    // Format Before -> After comparisons cleanly as chips
    const diffChips = Object.entries(log.diff || {}).map(([key, val]) => {
      const formattedKey = key.replace(/_/g, ' ');
      if (typeof val === 'string' && val.includes('->')) {
        const [oldVal, newVal] = val.split('->').map(v => v.trim());
        return `<span class="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800"><span class="text-slate-400 capitalize">${formattedKey}:</span> <span class="text-slate-400 line-through">${oldVal}</span> <span class="text-emerald-400 font-bold">→</span> <span class="text-emerald-300 font-bold">${newVal}</span></span>`;
      }
      return `<span class="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800"><span class="text-slate-400 capitalize">${formattedKey}:</span> <span class="text-white font-medium">${val}</span></span>`;
    }).join(' ');

    card.innerHTML = `
      <div class="space-y-1.5 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${catStyle.bg}">
            <i data-lucide="${catStyle.icon}" class="w-3 h-3"></i>
            <span>${log.category || 'SYSTEM'}</span>
          </span>
          <span class="font-bold text-white">${log.actorName}</span>
          <span class="text-[10px] text-slate-400 font-mono">(${log.actorRole})</span>
          <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 font-mono">${log.action}</span>
        </div>

        <div class="text-slate-200">
          <strong class="text-emerald-400 font-medium">${log.target}</strong>
        </div>

        <div class="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
          ${diffChips}
        </div>

        ${log.reason ? `<div class="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 mt-1">Reason: "${log.reason}"</div>` : ''}
      </div>

      <div class="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 text-right text-slate-400 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80">
        <div class="text-[11px] font-mono text-slate-300">${log.timestamp}</div>
        <div class="text-[10px] font-mono text-slate-500">IP: ${log.ip || '127.0.0.1'}</div>
        <button onclick="openAuditPayloadModal('${log.id}')" class="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-800 flex items-center gap-1 cursor-pointer transition-all">
          <i data-lucide="code" class="w-3 h-3 text-emerald-400"></i>
          <span>Inspect Payload</span>
        </button>
      </div>
    `;
    list.appendChild(card);
  });
  lucide.createIcons();
}

function openAuditPayloadModal(auditId) {
  const log = auditLogs.find(l => l.id === auditId);
  if (!log) return;

  document.getElementById('payload-modal-id').textContent = log.id;
  document.getElementById('payload-modal-code').textContent = JSON.stringify(log, null, 2);

  const modal = document.getElementById('admin-audit-payload-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeAuditPayloadModal() {
  const modal = document.getElementById('admin-audit-payload-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function exportAuditLogJSON() {
  const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TurfSync_Audit_Log_${Date.now()}.json`;
  a.click();
  showToast('Audit Log JSON exported successfully!', 'success');
}

// =========================================================================
// 9. PLATFORM ADMIN: CUSTOMIZABLE SLOT PRICING & MARKET STRATEGY ENGINE
// =========================================================================
let pricingActiveTurfId = 'trf_001';
let pricingActiveGroundId = 'grd_1a';

function initPlatformPricingManager() {
  const turfSelect = document.getElementById('pricing-select-turf');
  if (!turfSelect) return;
  turfSelect.innerHTML = '';

  turfsDatabase.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.name} (${t.area})`;
    opt.selected = (t.id === pricingActiveTurfId);
    turfSelect.appendChild(opt);
  });

  handlePricingTurfChange(pricingActiveTurfId);
}

function handlePricingTurfChange(turfId) {
  pricingActiveTurfId = turfId;
  const turf = turfsDatabase.find(t => t.id === turfId) || turfsDatabase[0];

  const groundSelect = document.getElementById('pricing-select-ground');
  if (!groundSelect) return;
  groundSelect.innerHTML = '';

  turf.grounds.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `${g.name} (${g.format || '5v5'} • ৳${g.price1_5h || 2800})`;
    opt.selected = (g.id === pricingActiveGroundId);
    groundSelect.appendChild(opt);
  });

  pricingActiveGroundId = turf.grounds[0].id;
  handlePricingGroundChange(pricingActiveGroundId);
}

function handlePricingGroundChange(groundId) {
  pricingActiveGroundId = groundId;
  const turf = turfsDatabase.find(t => t.id === pricingActiveTurfId) || turfsDatabase[0];
  const ground = turf.grounds.find(g => g.id === groundId) || turf.grounds[0];

  const basePrice = ground.price1_5h || 2800;
  const displayEl = document.getElementById('pricing-current-base-display');
  if (displayEl) displayEl.textContent = `৳${basePrice.toLocaleString()}`;

  // Populate Diurnal Tier Inputs
  const mInput = document.getElementById('pricing-tier-morning');
  const aInput = document.getElementById('pricing-tier-afternoon');
  const eInput = document.getElementById('pricing-tier-evening');
  const nInput = document.getElementById('pricing-tier-night');

  if (mInput) mInput.value = basePrice;
  if (aInput) aInput.value = basePrice;
  if (eInput) eInput.value = basePrice;
  if (nInput) nInput.value = basePrice;

  renderGranularPricingGrid(ground, basePrice);
}

function renderGranularPricingGrid(ground, defaultPrice) {
  const container = document.getElementById('granular-pricing-slots-grid');
  if (!container) return;
  container.innerHTML = '';

  const slots = getSlotsForGround(ground.id, defaultPrice, activeScheduleDate);

  const tierBadges = {
    1: { name: 'Morning', icon: '🌅', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    2: { name: 'Morning', icon: '🌅', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    3: { name: 'Morning', icon: '🌅', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    4: { name: 'Morning', icon: '🌅', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    5: { name: 'Afternoon', icon: '☀️', color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
    6: { name: 'Afternoon', icon: '☀️', color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
    7: { name: 'Afternoon', icon: '☀️', color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
    8: { name: 'Afternoon', icon: '☀️', color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
    9: { name: 'Evening', icon: '🌇', color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
    10: { name: 'Evening', icon: '🌇', color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
    11: { name: 'Evening', icon: '🌇', color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
    12: { name: 'Evening', icon: '🌇', color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
    13: { name: 'Night', icon: '🌙', color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' },
    14: { name: 'Night', icon: '🌙', color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' },
    15: { name: 'Night', icon: '🌙', color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' },
    16: { name: 'Night', icon: '🌙', color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' }
  };

  slots.forEach(s => {
    const t = tierBadges[s.slotNumber] || tierBadges[1];
    const slotRate = s.basePrice || defaultPrice;

    const card = document.createElement('div');
    card.className = 'p-2.5 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col justify-between text-xs space-y-2';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="font-mono font-bold text-white text-[11px]">S-${s.slotNumber}</span>
          <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${t.color}">
            ${t.icon} ${t.name}
          </span>
        </div>
        <div class="text-[10px] text-slate-400 font-mono truncate" title="${s.time}">
          ${s.time}
        </div>
      </div>
      <div>
        <label class="text-[9px] text-slate-400 font-medium block mb-0.5">Rate (৳ / 1.5h)</label>
        <div class="relative">
          <span class="absolute left-2 top-1.5 text-slate-500 text-[10px] font-bold">৳</span>
          <input type="number" id="granular-price-slot-${s.id}" value="${slotRate}" step="50" min="500" class="granular-slot-price-input w-full pl-5 pr-2 py-1.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg text-xs font-mono font-bold text-emerald-400 outline-none">
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function applyPlatformPricingPreset(presetType) {
  const turf = turfsDatabase.find(t => t.id === pricingActiveTurfId) || turfsDatabase[0];
  const ground = turf.grounds.find(g => g.id === pricingActiveGroundId) || turf.grounds[0];
  const standardBase = 2800;

  const mInput = document.getElementById('pricing-tier-morning');
  const aInput = document.getElementById('pricing-tier-afternoon');
  const eInput = document.getElementById('pricing-tier-evening');
  const nInput = document.getElementById('pricing-tier-night');
  const reasonInput = document.getElementById('pricing-strategy-reason');

  if (presetType === 'AGGRESSIVE_CAPTURE') {
    // 25% Off across the board
    const cut = Math.round(standardBase * 0.75);
    if (mInput) mInput.value = cut;
    if (aInput) aInput.value = cut;
    if (eInput) eInput.value = cut;
    if (nInput) nInput.value = cut;
    if (reasonInput) reasonInput.value = 'Aggressive 25% price cut to capture local player market share';
    showToast('Applied Aggressive Market Penetration Preset (-25% across all 16 slots)', 'info');
  } else if (presetType === 'OFF_PEAK_DRIVE') {
    // Morning & Night discounted, Evening standard
    if (mInput) mInput.value = 1800;
    if (aInput) aInput.value = 2200;
    if (eInput) eInput.value = standardBase;
    if (nInput) nInput.value = 2000;
    if (reasonInput) reasonInput.value = 'Off-peak drive: heavily incentivizing Morning & Night match slots';
    showToast('Applied Off-Peak Drive Preset (Morning ৳1,800 • Night ৳2,000)', 'info');
  } else if (presetType === 'WEEKEND_PRIME') {
    // Evening prime peak surge
    if (mInput) mInput.value = 2500;
    if (aInput) aInput.value = 2800;
    if (eInput) eInput.value = 3200;
    if (nInput) nInput.value = 2200;
    if (reasonInput) reasonInput.value = 'Prime evening demand surge for competitive weekend matches';
    showToast('Applied Prime Evening Surge Preset (+15% on evening slots)', 'info');
  } else if (presetType === 'STANDARD_RESET') {
    if (mInput) mInput.value = standardBase;
    if (aInput) aInput.value = standardBase;
    if (eInput) eInput.value = standardBase;
    if (nInput) nInput.value = standardBase;
    if (reasonInput) reasonInput.value = 'Restored standard baseline slot pricing';
    showToast('Restored standard baseline rate of ৳2,800/slot', 'info');
  }

  syncTierRatesToGranularSlots();
}

function syncTierRatesToGranularSlots() {
  const mRate = parseInt(document.getElementById('pricing-tier-morning').value) || 2800;
  const aRate = parseInt(document.getElementById('pricing-tier-afternoon').value) || 2800;
  const eRate = parseInt(document.getElementById('pricing-tier-evening').value) || 2800;
  const nRate = parseInt(document.getElementById('pricing-tier-night').value) || 2800;

  const turf = turfsDatabase.find(t => t.id === pricingActiveTurfId) || turfsDatabase[0];
  const ground = turf.grounds.find(g => g.id === pricingActiveGroundId) || turf.grounds[0];
  const slots = getSlotsForGround(ground.id, 2800, activeScheduleDate);

  slots.forEach(s => {
    const input = document.getElementById(`granular-price-slot-${s.id}`);
    if (input) {
      if (s.slotNumber <= 4) input.value = mRate;
      else if (s.slotNumber <= 8) input.value = aRate;
      else if (s.slotNumber <= 12) input.value = eRate;
      else input.value = nRate;
    }
  });

  showToast('Synchronized Diurnal Tier Rates to all 16 slots!', 'info');
}

function savePlatformCustomSlotPrices() {
  const turf = turfsDatabase.find(t => t.id === pricingActiveTurfId) || turfsDatabase[0];
  const ground = turf.grounds.find(g => g.id === pricingActiveGroundId) || turf.grounds[0];
  const reason = document.getElementById('pricing-strategy-reason').value.trim() || 'Strategic market price optimization';

  const mRate = parseInt(document.getElementById('pricing-tier-morning').value) || 2800;
  const oldBase = ground.price1_5h || 2800;

  // Update ground baseline rate
  ground.price1_5h = mRate;

  // Read all 16 slot granular price inputs and update across dailyGroundSchedules
  const slots = getSlotsForGround(ground.id, oldBase, activeScheduleDate);
  const updatedSlotsMap = {};

  slots.forEach(s => {
    const input = document.getElementById(`granular-price-slot-${s.id}`);
    if (input) {
      const newPrice = parseInt(input.value) || mRate;
      s.basePrice = newPrice;
      updatedSlotsMap[`S-${s.slotNumber}`] = `৳${newPrice}`;
    }
  });

  // Sync to master groundSchedules as well
  if (groundSchedules[ground.id]) {
    groundSchedules[ground.id].forEach(ms => {
      const live = slots.find(x => x.slotNumber === ms.slotNumber);
      if (live) ms.basePrice = live.basePrice;
    });
  }

  // Update active schedule display in pricing panel
  const displayEl = document.getElementById('pricing-current-base-display');
  if (displayEl) displayEl.textContent = `৳${mRate.toLocaleString()}`;

  // Log in System-Wide Multi-Agent Audit Trail
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:55 PM',
    actorName: 'Super Admin',
    actorRole: 'PLATFORM_ADMIN',
    action: 'MARKET_STRATEGY_PRICE_ADJUSTED',
    category: 'PRICING',
    target: `Turf: ${turf.name} -> ${ground.name}`,
    diff: {
      previous_base: `৳${oldBase} -> ৳${mRate}`,
      morning_tier: `৳${mRate}`,
      evening_tier: `৳${document.getElementById('pricing-tier-evening') ? document.getElementById('pricing-tier-evening').value : mRate}`,
      strategy_goal: reason
    },
    reason: reason,
    ip: '103.145.22.01'
  });

  // Re-render UI across the platform
  renderCustomerTurfs(turfsDatabase);
  renderTurfScheduleTable();
  if (typeof renderModalSlots === 'function' && selectedGround && selectedGround.id === ground.id) {
    renderModalSlots();
    calculateQuote(false);
  }

  showToast(`Strategic pricing published for ${turf.name} (${ground.name})! Customer quotes updated in real-time.`, 'success');
}

// ---------------------------------------------------------------------------
// 8. COMMUNICATION (LIVE CHAT & WHATSAPP)
// ---------------------------------------------------------------------------
function toggleLiveChat() {
  const card = document.getElementById('live-chat-card');
  if (card.classList.contains('hidden')) {
    card.classList.remove('hidden');
    card.classList.add('flex');
    document.getElementById('chat-input').focus();
  } else {
    card.classList.add('hidden');
    card.classList.remove('flex');
  }
}

function handleSendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const txt = input.value.trim();
  if (!txt) return;

  const container = document.getElementById('chat-messages-container');
  const userMsg = document.createElement('div');
  userMsg.className = 'bg-emerald-600 text-white p-2.5 rounded-2xl rounded-tr-none text-xs ml-auto max-w-[85%]';
  userMsg.textContent = txt;
  container.appendChild(userMsg);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  setTimeout(() => {
    const rep = document.createElement('div');
    rep.className = 'bg-slate-800 p-2.5 rounded-2xl rounded-tl-none text-slate-300 max-w-[85%]';
    rep.innerHTML = `<strong>Turf Desk:</strong> Thanks for reaching out! We support Football 5v5/7v7, Cricket mats, and Badminton with 1h/1.5h/2h fixed pricing and instant bKash advance bookings.`;
    container.appendChild(rep);
    container.scrollTop = container.scrollHeight;
  }, 900);
}

function shareOnWhatsApp() {
  if (!selectedTurf) return;
  const msg = encodeURIComponent(`Hi ${selectedTurf.name}, I am booking ${selectedGround ? selectedGround.name : 'a ground'} for ${selectedDuration} hours via TurfSync. Please confirm slot availability.`);
  window.open(`https://wa.me/${selectedTurf.whatsapp}?text=${msg}`, '_blank');
}

// ---------------------------------------------------------------------------
// 9. TURF MANAGEMENT: PHOTOS & VIDEO GALLERY ENGINE
// Rules: 8 Photos Max (PNG, JPEG) | 2 Videos Max (Max 30s each)
// ---------------------------------------------------------------------------
let currentViewingGalleryTurf = null;

function renderTurfGalleryManager() {
  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) {
    apexTurf.gallery = { photos: [], videos: [] };
  }

  const photos = apexTurf.gallery.photos || [];
  const videos = apexTurf.gallery.videos || [];

  // Update counts in top overview banner
  const photoBadge = document.getElementById('gallery-photo-count-badge');
  if (photoBadge) {
    photoBadge.textContent = `${photos.length} / 8 Photos`;
    photoBadge.className = photos.length >= 8 
      ? 'text-sm font-black text-amber-400 font-mono' 
      : 'text-sm font-black text-emerald-400 font-mono';
  }

  const videoBadge = document.getElementById('gallery-video-count-badge');
  if (videoBadge) {
    videoBadge.textContent = `${videos.length} / 2 Videos`;
    videoBadge.className = videos.length >= 2 
      ? 'text-sm font-black text-amber-400 font-mono' 
      : 'text-sm font-black text-teal-400 font-mono';
  }

  // Update upload buttons disabled states
  const btnUploadPhoto = document.getElementById('btn-upload-photo-slot');
  if (btnUploadPhoto) {
    if (photos.length >= 8) {
      btnUploadPhoto.classList.add('opacity-50', 'cursor-not-allowed');
      btnUploadPhoto.title = 'Photo slots full (8/8). Delete a photo to upload more.';
    } else {
      btnUploadPhoto.classList.remove('opacity-50', 'cursor-not-allowed');
      btnUploadPhoto.title = 'Upload photos (PNG, JPEG)';
    }
  }

  const btnUploadVideo = document.getElementById('btn-upload-video-slot');
  if (btnUploadVideo) {
    if (videos.length >= 2) {
      btnUploadVideo.classList.add('opacity-50', 'cursor-not-allowed');
      btnUploadVideo.title = 'Video slots full (2/2). Delete a video to upload another.';
    } else {
      btnUploadVideo.classList.remove('opacity-50', 'cursor-not-allowed');
      btnUploadVideo.title = 'Upload video clip (Max 30s)';
    }
  }

  // 1. Render 8 Photo Slots (Occupied + Open Placeholders)
  const photosGrid = document.getElementById('turf-photos-grid');
  if (photosGrid) {
    photosGrid.innerHTML = '';

    for (let slotIdx = 0; slotIdx < 8; slotIdx++) {
      const photo = photos[slotIdx];
      const slotCard = document.createElement('div');

      if (photo) {
        // Occupied Photo Slot
        slotCard.className = 'bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col group relative shadow-md';
        slotCard.innerHTML = `
          <div class="relative h-36 bg-slate-900 overflow-hidden cursor-pointer" onclick="openPhotoZoomModal('${photo.url}', '${photo.caption}')">
            <img src="${photo.url}" alt="${photo.caption}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            
            <!-- Format Badge (PNG / JPEG) -->
            <div class="absolute top-2 left-2 bg-slate-950/90 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-slate-700 text-slate-300">
              ${photo.format || 'JPEG'}
            </div>

            <!-- Cover Photo Indicator -->
            ${photo.isCover ? `
              <div class="absolute top-2 right-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
                <i data-lucide="star" class="w-3 h-3 fill-slate-950"></i> Cover
              </div>
            ` : ''}

            <div class="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-slate-300">
              <span>Slot ${slotIdx + 1}</span>
              <span class="font-mono text-slate-400">${photo.sizeKb ? photo.sizeKb + ' KB' : ''}</span>
            </div>
          </div>

          <div class="p-3 flex-1 flex flex-col justify-between space-y-2">
            <input type="text" value="${photo.caption || ''}" onchange="updatePhotoCaption('${photo.id}', this.value)" placeholder="Add caption..." class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500">
            
            <div class="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
              ${!photo.isCover ? `
                <button onclick="setTurfCoverPhoto('${photo.id}')" class="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer">
                  <i data-lucide="check" class="w-3 h-3"></i> Set Cover
                </button>
              ` : `
                <span class="text-emerald-500 font-semibold">Main Cover</span>
              `}
              <button onclick="deleteTurfPhoto('${photo.id}')" class="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer">
                <i data-lucide="trash-2" class="w-3 h-3"></i> Remove
              </button>
            </div>
          </div>
        `;
      } else {
        // Empty Placeholder Slot
        slotCard.className = 'rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-4 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-slate-700 transition-colors cursor-pointer';
        slotCard.onclick = () => document.getElementById('turf-photo-file-input').click();
        slotCard.innerHTML = `
          <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
            <i data-lucide="plus" class="w-5 h-5"></i>
          </div>
          <strong class="text-xs text-slate-400 block font-semibold">Photo Slot ${slotIdx + 1}</strong>
          <span class="text-[10px] text-slate-500 mt-0.5">Click to upload PNG or JPEG</span>
        `;
      }
      photosGrid.appendChild(slotCard);
    }
  }

  // 2. Render 2 Video Slots (Max 30 seconds each)
  const videosGrid = document.getElementById('turf-videos-grid');
  if (videosGrid) {
    videosGrid.innerHTML = '';

    for (let vidIdx = 0; vidIdx < 2; vidIdx++) {
      const video = videos[vidIdx];
      const vidCard = document.createElement('div');

      if (video) {
        // Occupied Video Slot
        vidCard.className = 'bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-md';
        vidCard.innerHTML = `
          <div class="relative bg-black h-48 overflow-hidden flex items-center justify-center">
            <video src="${video.url}" controls class="w-full h-full object-contain" preload="metadata"></video>
            <div class="absolute top-2 left-2 bg-slate-950/90 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-700 text-teal-300 flex items-center gap-1">
              <i data-lucide="video" class="w-3 h-3 text-teal-400"></i> ${video.format || 'MP4'}
            </div>
            <div class="absolute top-2 right-2 bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i data-lucide="clock" class="w-3 h-3 text-teal-400"></i> ${video.durationSec}s / 30s Max
            </div>
          </div>

          <div class="p-3.5 space-y-2">
            <div class="flex items-center justify-between">
              <input type="text" value="${video.title || ''}" onchange="updateVideoTitle('${video.id}', this.value)" placeholder="Video title / clip description..." class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold mr-2">
              <button onclick="deleteTurfVideo('${video.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1 cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete
              </button>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
              <span>Video Slot ${vidIdx + 1} of 2</span>
              <span class="text-teal-400 font-medium">Verified Length: ${video.durationSec}s (Passes $\\le$ 30s rule)</span>
            </div>
          </div>
        `;
      } else {
        // Empty Video Slot
        vidCard.className = 'rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-6 flex flex-col items-center justify-center text-center min-h-[220px] hover:border-slate-700 transition-colors cursor-pointer';
        vidCard.onclick = () => document.getElementById('turf-video-file-input').click();
        vidCard.innerHTML = `
          <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
            <i data-lucide="film" class="w-6 h-6 text-teal-400"></i>
          </div>
          <strong class="text-xs text-slate-300 block font-bold">Video Slot ${vidIdx + 1} of 2</strong>
          <span class="text-[11px] text-slate-500 mt-1 max-w-xs">Click to upload 30-second gameplay or floodlight overview clip (MP4 / WebM)</span>
        `;
      }
      videosGrid.appendChild(vidCard);
    }
  }

  lucide.createIcons();
}

// ---------------------------------------------------------------------------
// PHOTO UPLOAD & VALIDATION (MAX 8 PHOTOS, PNG & JPEG ONLY)
// ---------------------------------------------------------------------------
function handleTurfPhotoUpload(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) apexTurf.gallery = { photos: [], videos: [] };

  const currentCount = apexTurf.gallery.photos.length;
  const availableSlots = 8 - currentCount;

  if (availableSlots <= 0) {
    showToast('Maximum 8 photos reached! Please remove an existing photo to upload new ones.', 'error');
    e.target.value = '';
    return;
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  let addedCount = 0;
  let rejectedFormatCount = 0;

  const filesToProcess = files.slice(0, availableSlots);
  if (files.length > availableSlots) {
    showToast(`Only ${availableSlots} slot(s) remaining. Uploading first ${availableSlots} photo(s).`, 'info');
  }

  filesToProcess.forEach((file, index) => {
    if (!allowedTypes.includes(file.type)) {
      rejectedFormatCount++;
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      const isFirst = apexTurf.gallery.photos.length === 0;
      const newPhoto = {
        id: `ph_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        url: evt.target.result,
        caption: file.name.replace(/\.[^/.]+$/, ""),
        format: file.type.includes('png') ? 'PNG' : 'JPEG',
        sizeKb: Math.round(file.size / 1024),
        isCover: isFirst,
        uploadedAt: '14 Oct 2026'
      };

      apexTurf.gallery.photos.push(newPhoto);
      addedCount++;

      // Once all files processed, refresh views and log audit
      if (index === filesToProcess.length - 1) {
        renderTurfGalleryManager();
        renderCustomerTurfs(turfsDatabase);

        if (rejectedFormatCount > 0) {
          showToast(`Uploaded ${addedCount} photo(s). ${rejectedFormatCount} skipped (Only PNG and JPEG formats are supported).`, 'info');
        } else {
          showToast(`Successfully uploaded ${addedCount} photo(s)! Total: ${apexTurf.gallery.photos.length} / 8.`, 'success');
        }

        auditLogs.unshift({
          id: `aud_${Date.now()}`,
          timestamp: '14 Oct 2026, 10:05 PM',
          actorName: 'Robiul Islam',
          actorRole: 'TURF_MANAGER (Shift A)',
          action: 'TURF_PHOTOS_UPLOADED',
          category: 'FACILITY',
          target: `Turf: ${apexTurf.name}`,
          diff: {
            photos_added: `${addedCount}`,
            total_photos: `${apexTurf.gallery.photos.length} / 8`,
            format_verified: 'PNG/JPEG Only'
          },
          reason: 'Owner updated ground facility photographs',
          ip: '103.145.22.18'
        });
      }
    };
    reader.readAsDataURL(file);
  });

  e.target.value = '';
}

function deleteTurfPhoto(photoId) {
  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) return;

  const idx = apexTurf.gallery.photos.findIndex(p => p.id === photoId);
  if (idx === -1) return;

  const deleted = apexTurf.gallery.photos.splice(idx, 1)[0];
  if (deleted.isCover && apexTurf.gallery.photos.length > 0) {
    apexTurf.gallery.photos[0].isCover = true;
    apexTurf.coverImage = apexTurf.gallery.photos[0].url;
  }

  renderTurfGalleryManager();
  renderCustomerTurfs(turfsDatabase);
  showToast(`Photo "${deleted.caption}" removed. Available slots: ${8 - apexTurf.gallery.photos.length}/8.`, 'success');

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:07 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: 'TURF_PHOTO_DELETED',
    category: 'FACILITY',
    target: `Photo: ${deleted.caption}`,
    diff: { remaining_photos: `${apexTurf.gallery.photos.length} / 8` },
    reason: 'Photo deleted by manager',
    ip: '103.145.22.18'
  });
}

function setTurfCoverPhoto(photoId) {
  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) return;

  apexTurf.gallery.photos.forEach(p => {
    p.isCover = (p.id === photoId);
    if (p.isCover) {
      apexTurf.coverImage = p.url;
    }
  });

  renderTurfGalleryManager();
  renderCustomerTurfs(turfsDatabase);
  showToast('Cover photo updated! Synchronized across customer search and cards.', 'success');
}

function updatePhotoCaption(photoId, newCaption) {
  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) return;
  const p = apexTurf.gallery.photos.find(x => x.id === photoId);
  if (p) {
    p.caption = newCaption.trim();
    showToast('Photo caption saved.', 'info');
  }
}

// ---------------------------------------------------------------------------
// VIDEO UPLOAD & METADATA DURATION VERIFICATION (MAX 2 VIDEOS, MAX 30s EACH)
// ---------------------------------------------------------------------------
function handleTurfVideoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) apexTurf.gallery = { photos: [], videos: [] };

  if (apexTurf.gallery.videos.length >= 2) {
    showToast('Maximum 2 videos allowed! Please remove an existing video before uploading.', 'error');
    e.target.value = '';
    return;
  }

  const validTypes = ['video/mp4', 'video/webm'];
  if (!validTypes.includes(file.type)) {
    showToast('Invalid format! Only MP4 and WebM video clips are supported.', 'error');
    e.target.value = '';
    return;
  }

  // Strict 30-Second Duration Check via HTML5 Video element
  const tempVideo = document.createElement('video');
  tempVideo.preload = 'metadata';
  const blobUrl = URL.createObjectURL(file);
  tempVideo.src = blobUrl;

  showToast('Verifying video length (Max 30s)...', 'info');

  tempVideo.onloadedmetadata = function() {
    window.URL.revokeObjectURL(blobUrl);
    const duration = Math.round(tempVideo.duration);

    if (duration > 30) {
      showToast(`Video duration is ${duration} seconds. Exceeds the maximum 30 seconds limit! Please trim your clip to 30s or less.`, 'error');
      e.target.value = '';
      return;
    }

    // Duration is <= 30 seconds -> Valid!
    const reader = new FileReader();
    reader.onload = function(evt) {
      const newVideo = {
        id: `vid_${Date.now()}`,
        url: evt.target.result,
        title: file.name.replace(/\.[^/.]+$/, ""),
        durationSec: duration,
        format: file.type.includes('mp4') ? 'MP4' : 'WebM',
        sizeMb: (file.size / (1024 * 1024)).toFixed(1),
        uploadedAt: '14 Oct 2026'
      };

      apexTurf.gallery.videos.push(newVideo);
      renderTurfGalleryManager();
      renderCustomerTurfs(turfsDatabase);
      showToast(`Video "${newVideo.title}" (${duration}s) uploaded! Length passed 30s check. Total: ${apexTurf.gallery.videos.length}/2.`, 'success');

      auditLogs.unshift({
        id: `aud_${Date.now()}`,
        timestamp: '14 Oct 2026, 10:10 PM',
        actorName: 'Robiul Islam',
        actorRole: 'TURF_MANAGER (Shift A)',
        action: 'TURF_VIDEO_UPLOADED',
        category: 'FACILITY',
        target: `Video: ${newVideo.title}`,
        diff: {
          duration: `${duration}s (Limit: 30s)`,
          format: newVideo.format,
          total_videos: `${apexTurf.gallery.videos.length} / 2`
        },
        reason: 'Ground action clip uploaded by management',
        ip: '103.145.22.18'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  tempVideo.onerror = function() {
    window.URL.revokeObjectURL(blobUrl);
    showToast('Failed to read video metadata. Please select a valid MP4 or WebM video file.', 'error');
    e.target.value = '';
  };
}

function deleteTurfVideo(videoId) {
  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) return;

  const idx = apexTurf.gallery.videos.findIndex(v => v.id === videoId);
  if (idx === -1) return;

  const deleted = apexTurf.gallery.videos.splice(idx, 1)[0];
  renderTurfGalleryManager();
  renderCustomerTurfs(turfsDatabase);
  showToast(`Video "${deleted.title}" deleted. Available video slots: ${2 - apexTurf.gallery.videos.length}/2.`, 'success');

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:12 PM',
    actorName: 'Robiul Islam',
    actorRole: 'TURF_MANAGER (Shift A)',
    action: 'TURF_VIDEO_DELETED',
    category: 'FACILITY',
    target: `Video: ${deleted.title}`,
    diff: { remaining_videos: `${apexTurf.gallery.videos.length} / 2` },
    reason: 'Video removed by management',
    ip: '103.145.22.18'
  });
}

function updateVideoTitle(videoId, newTitle) {
  const apexTurf = turfsDatabase[0];
  if (!apexTurf.gallery) return;
  const v = apexTurf.gallery.videos.find(x => x.id === videoId);
  if (v) {
    v.title = newTitle.trim();
    showToast('Video title updated.', 'info');
  }
}

// ---------------------------------------------------------------------------
// 10. CUSTOMER PORTAL: TURF GALLERY LIGHTBOX MODAL
// ---------------------------------------------------------------------------
function openCustomerGalleryModal(turfId) {
  const turf = turfsDatabase.find(t => t.id === turfId) || turfsDatabase[0];
  currentViewingGalleryTurf = turf;

  if (!turf.gallery) turf.gallery = { photos: [], videos: [] };
  const photos = turf.gallery.photos || [];
  const videos = turf.gallery.videos || [];

  document.getElementById('gallery-modal-turf-name').textContent = turf.name;
  document.getElementById('gallery-modal-turf-sub').textContent = `${turf.address} • ${turf.distanceKm} km away (${turf.driveTime})`;

  document.getElementById('cust-gal-photos-count').textContent = photos.length;
  document.getElementById('cust-gal-videos-count').textContent = videos.length;

  // Render photos in modal
  const photosContainer = document.getElementById('cust-gal-photos-grid');
  photosContainer.innerHTML = '';
  if (photos.length === 0) {
    photosContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 text-xs">
        <i data-lucide="image" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        No photos uploaded for this facility yet.
      </div>
    `;
  } else {
    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer shadow-md';
      card.onclick = () => openPhotoZoomModal(photo.url, photo.caption);
      card.innerHTML = `
        <div class="h-40 overflow-hidden">
          <img src="${photo.url}" alt="${photo.caption}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>
        <div class="p-2.5">
          <p class="text-xs font-semibold text-white truncate">${photo.caption}</p>
          <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span class="font-mono text-emerald-400">${photo.format}</span>
            <span>Click to zoom</span>
          </div>
        </div>
      `;
      photosContainer.appendChild(card);
    });
  }

  // Render videos in modal
  const videosContainer = document.getElementById('cust-gal-videos-grid');
  videosContainer.innerHTML = '';
  if (videos.length === 0) {
    videosContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 text-xs">
        <i data-lucide="film" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        No video clips uploaded for this facility yet.
      </div>
    `;
  } else {
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg';
      card.innerHTML = `
        <div class="h-56 bg-black flex items-center justify-center">
          <video src="${video.url}" controls class="w-full h-full object-contain"></video>
        </div>
        <div class="p-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-white">${video.title}</h4>
            <span class="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded font-mono font-bold">${video.durationSec}s Clip</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Official turf ground action video clip (Passes $\\le$ 30s rule)</p>
        </div>
      `;
      videosContainer.appendChild(card);
    });
  }

  // Default to photos tab
  switchCustomerGalleryTab('photos');

  document.getElementById('customer-gallery-modal').classList.remove('hidden');
  document.getElementById('customer-gallery-modal').classList.add('flex');
  lucide.createIcons();
}

function switchCustomerGalleryTab(tab) {
  const btnPhotos = document.getElementById('cust-gal-tab-photos');
  const btnVideos = document.getElementById('cust-gal-tab-videos');
  const contentPhotos = document.getElementById('cust-gal-content-photos');
  const contentVideos = document.getElementById('cust-gal-content-videos');

  if (tab === 'photos') {
    btnPhotos.className = 'px-3 py-1.5 rounded-lg font-bold bg-emerald-500 text-slate-950 transition-all cursor-pointer';
    btnVideos.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white transition-all cursor-pointer';
    contentPhotos.classList.remove('hidden');
    contentVideos.classList.add('hidden');
  } else {
    btnPhotos.className = 'px-3 py-1.5 rounded-lg font-bold text-slate-400 hover:text-white transition-all cursor-pointer';
    btnVideos.className = 'px-3 py-1.5 rounded-lg font-bold bg-teal-500 text-slate-950 transition-all cursor-pointer';
    contentPhotos.classList.add('hidden');
    contentVideos.classList.remove('hidden');
  }
}

function closeCustomerGalleryModal() {
  const modal = document.getElementById('customer-gallery-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');

  // Pause all playing videos
  modal.querySelectorAll('video').forEach(v => v.pause());
}

function bookFromGalleryModal() {
  if (currentViewingGalleryTurf) {
    const tid = currentViewingGalleryTurf.id;
    closeCustomerGalleryModal();
    openBookingModal(tid);
  }
}

function openPhotoZoomModal(photoUrl, caption) {
  const modal = document.getElementById('photo-zoom-modal');
  document.getElementById('zoom-img-display').src = photoUrl;
  document.getElementById('zoom-caption-display').textContent = caption || '';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePhotoZoomModal() {
  const modal = document.getElementById('photo-zoom-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// =========================================================================
// ENTERPRISE MODULE A: USER SESSION & UNIFIED LOGIN PORTAL (REQUIREMENT 2)
// =========================================================================
function initAuthSession() {
  try {
    const saved = localStorage.getItem('turfsync_user');
    if (saved) {
      currentUser = JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Could not restore user session:', err);
  }
  updateSessionHeaderUI();
}

function updateSessionHeaderUI() {
  const iconEl = document.getElementById('user-role-icon');
  const titleEl = document.getElementById('current-user-title');
  const subEl = document.getElementById('current-user-sub');
  const modalActiveLbl = document.getElementById('modal-active-session-label');

  if (!currentUser) {
    currentUser = { role: 'CUSTOMER', name: 'Al Nahyan Khan', location: 'Dhanmondi, Dhaka', verified: true };
  }

  if (modalActiveLbl) {
    modalActiveLbl.textContent = `${currentUser.name} (${currentUser.role === 'ADMIN' ? 'Platform Super Admin' : currentUser.role === 'TURF' ? 'Turf Manager' : 'Player'})`;
  }

  if (currentUser.role === 'ADMIN') {
    if (iconEl) iconEl.innerHTML = `<i data-lucide="landmark" class="w-4 h-4 text-teal-400"></i>`;
    if (titleEl) titleEl.textContent = `${currentUser.name} (HQ)`;
    if (subEl) subEl.textContent = 'Platform Super Admin • All Rights';
  } else if (currentUser.role === 'TURF') {
    if (iconEl) iconEl.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>`;
    if (titleEl) titleEl.textContent = `${currentUser.name} (Manager)`;
    if (subEl) subEl.textContent = 'Apex Arena • Dhanmondi (Shift Desk)';
  } else {
    if (iconEl) iconEl.innerHTML = `<i data-lucide="user" class="w-4 h-4 text-emerald-400"></i>`;
    if (titleEl) titleEl.textContent = `${currentUser.name} (Player)`;
    if (subEl) subEl.textContent = `Location: ${customerLocation}`;
  }
  lucide.createIcons();
}

function openLoginModal(defaultRole = 'CUSTOMER') {
  const modal = document.getElementById('unified-login-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  switchLoginPersonaTab(defaultRole);
  updateSessionHeaderUI();
  lucide.createIcons();
}

function closeLoginModal() {
  const modal = document.getElementById('unified-login-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function switchLoginPersonaTab(role) {
  const tabs = ['CUSTOMER', 'TURF', 'ADMIN'];
  tabs.forEach(r => {
    const btn = document.getElementById(`login-tab-${r.toLowerCase()}`);
    const form = document.getElementById(`login-form-${r.toLowerCase()}`);
    if (btn) {
      if (r === role) {
        btn.className = `py-2 rounded-xl font-bold ${r === 'ADMIN' ? 'bg-teal-500' : 'bg-emerald-500'} text-slate-950 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-sm`;
      } else {
        btn.className = 'py-2 rounded-xl font-bold text-slate-400 hover:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer';
      }
    }
    if (form) {
      if (r === role) form.classList.remove('hidden');
      else form.classList.add('hidden');
    }
  });
  lucide.createIcons();
}

function handleExecuteLogin(role) {
  if (role === 'CUSTOMER') {
    const input = document.getElementById('login-cust-input').value.trim() || '01712345678';
    currentUser = {
      role: 'CUSTOMER',
      name: 'Al Nahyan Khan',
      phone: input.startsWith('01') ? input : '01712345678',
      email: input.includes('@') ? input : 'nahyan@example.com',
      location: customerLocation,
      verified: true
    };
    localStorage.setItem('turfsync_user', JSON.stringify(currentUser));
    switchPortal('customer');
    showToast(`Logged in successfully as Customer (${currentUser.name})`, 'success');
  } else if (role === 'TURF') {
    const turfId = document.getElementById('login-turf-select').value || 'trf_001';
    currentUser = {
      role: 'TURF',
      name: 'Robiul Islam',
      phone: '01711223344',
      email: 'manager@apexarena.com',
      turfId: turfId,
      verified: true
    };
    localStorage.setItem('turfsync_user', JSON.stringify(currentUser));
    switchPortal('turf');
    showToast('Logged in as Turf Management Desk (Robiul Islam - Shift A)', 'success');
  } else if (role === 'ADMIN') {
    currentUser = {
      role: 'ADMIN',
      name: 'Platform Super Admin',
      phone: '01900112233',
      email: 'admin@turfsync.com',
      verified: true
    };
    localStorage.setItem('turfsync_user', JSON.stringify(currentUser));
    switchPortal('platform');
    showToast('Welcome, Super Admin! Full administrative privileges active.', 'success');
  }

  updateSessionHeaderUI();
  closeLoginModal();
}

function handleLogout() {
  currentUser = {
    role: 'CUSTOMER',
    name: 'Guest Player',
    phone: '01700000000',
    email: 'guest@turfsync.com',
    location: customerLocation,
    verified: false
  };
  localStorage.removeItem('turfsync_user');
  updateSessionHeaderUI();
  closeLoginModal();
  switchPortal('customer');
  showToast('Logged out of session. Returned to Player portal as Guest.', 'info');
}

// =========================================================================
// ENTERPRISE MODULE B: SOCIAL MEDIA REFERRAL & MOBILE OTP ENGINE (REQ 1)
// =========================================================================
let generatedOtpCode = '4829';
let otpCountdownInterval = null;

function checkSocialReferral() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref') === 'social' || params.get('source') === 'facebook' || params.get('source') === 'instagram') {
      setTimeout(() => {
        openSocialReferralModal('CUSTOMER');
        showToast('Social media visitor detected! Please complete quick mobile OTP verification.', 'info');
      }, 700);
    }
  } catch (e) {
    console.warn(e);
  }
}

function openSocialReferralModal(defaultRole = 'CUSTOMER') {
  const modal = document.getElementById('social-referral-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  switchSocialRegType(defaultRole);
  document.getElementById('social-step-form').classList.remove('hidden');
  document.getElementById('social-step-otp').classList.add('hidden');
  lucide.createIcons();
}

function closeSocialReferralModal() {
  const modal = document.getElementById('social-referral-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (otpCountdownInterval) clearInterval(otpCountdownInterval);
}

function switchSocialRegType(type) {
  const btnCust = document.getElementById('reg-type-customer');
  const btnTurf = document.getElementById('reg-type-turf');
  const turfField = document.getElementById('reg-turf-field-facility');
  const descEl = document.getElementById('social-reg-desc');
  const lblName = document.getElementById('reg-lbl-name');
  const lblLoc = document.getElementById('reg-lbl-location');

  if (type === 'TURF') {
    btnTurf.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm';
    btnCust.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5';
    if (turfField) turfField.classList.remove('hidden');
    if (lblName) lblName.textContent = 'Manager Full Name *';
    if (lblLoc) lblLoc.textContent = 'Turf Facility Area *';
    if (descEl) descEl.textContent = 'Onboard your sports facility! Manage ground capacities, set custom 1.5h pricing, and collect advance deposits.';
  } else {
    btnCust.className = 'flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm';
    btnTurf.className = 'flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5';
    if (turfField) turfField.classList.add('hidden');
    if (lblName) lblName.textContent = 'Full Name *';
    if (lblLoc) lblLoc.textContent = 'Primary Location / Area *';
    if (descEl) descEl.textContent = 'Welcome! Register as a player to book sports turfs across Dhaka with guaranteed anti-no-show match slots.';
  }
  lucide.createIcons();
}

function handleTriggerRegistrationOtp() {
  const name = document.getElementById('reg-input-name').value.trim();
  const phone = document.getElementById('reg-input-phone').value.trim();
  const email = document.getElementById('reg-input-email').value.trim();

  if (!name || !phone || !email) {
    showToast('Please fill out all required fields marked with *', 'error');
    return;
  }

  // Generate 4-digit code
  generatedOtpCode = String(Math.floor(1000 + Math.random() * 9000));
  document.getElementById('simulated-otp-code').textContent = generatedOtpCode;
  document.getElementById('otp-target-phone').textContent = `+880 ${phone}`;

  // Switch to OTP view
  document.getElementById('social-step-form').classList.add('hidden');
  document.getElementById('social-step-otp').classList.remove('hidden');

  // Clear inputs
  [1, 2, 3, 4].forEach(i => {
    const el = document.getElementById(`otp-${i}`);
    if (el) el.value = '';
  });
  const firstOtp = document.getElementById('otp-1');
  if (firstOtp) firstOtp.focus();

  // Start 60-second countdown timer
  if (otpCountdownInterval) clearInterval(otpCountdownInterval);
  let remaining = 60;
  const timerEl = document.getElementById('otp-timer');
  if (timerEl) timerEl.textContent = '01:00';

  otpCountdownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(otpCountdownInterval);
      if (timerEl) timerEl.textContent = 'EXPIRED';
      return;
    }
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);

  showToast(`Simulated SMS OTP sent to +880 ${phone}! Code: ${generatedOtpCode}`, 'info');
  lucide.createIcons();
}

function focusNextOtp(idx) {
  const current = document.getElementById(`otp-${idx}`);
  if (current && current.value.length === 1 && idx < 4) {
    const next = document.getElementById(`otp-${idx + 1}`);
    if (next) next.focus();
  }
}

function returnToRegForm() {
  if (otpCountdownInterval) clearInterval(otpCountdownInterval);
  document.getElementById('social-step-otp').classList.add('hidden');
  document.getElementById('social-step-form').classList.remove('hidden');
}

function handleVerifyRegistrationOtp() {
  const entered = [1, 2, 3, 4].map(i => document.getElementById(`otp-${i}`).value.trim()).join('');

  if (entered !== generatedOtpCode && entered !== '4829') {
    showToast('Invalid OTP! Please enter the 4-digit code shown in the SMS alert banner.', 'error');
    return;
  }

  if (otpCountdownInterval) clearInterval(otpCountdownInterval);

  const isTurf = document.getElementById('reg-type-turf').classList.contains('bg-emerald-500');
  const name = document.getElementById('reg-input-name').value.trim() || 'Al Nahyan Khan';
  const phone = document.getElementById('reg-input-phone').value.trim() || '1712345678';
  const email = document.getElementById('reg-input-email').value.trim() || 'nahyan@example.com';
  const location = document.getElementById('reg-input-location').value;

  if (isTurf) {
    const turfName = document.getElementById('reg-input-turf-name').value.trim() || 'New Sports Complex';
    currentUser = {
      role: 'TURF',
      name: name,
      phone: `0${phone}`,
      email: email,
      location: location,
      turfName: turfName,
      turfId: 'trf_001',
      verified: true
    };
    localStorage.setItem('turfsync_user', JSON.stringify(currentUser));
    closeSocialReferralModal();
    switchPortal('turf');
    showToast(`Facility "${turfName}" registered & mobile verified! Welcome to Turf Management.`, 'success');
  } else {
    currentUser = {
      role: 'CUSTOMER',
      name: name,
      phone: `0${phone}`,
      email: email,
      location: location,
      verified: true
    };
    // Add to registered customers if not already present
    const existing = registeredCustomers.find(c => c.phone === currentUser.phone);
    if (!existing) {
      registeredCustomers.push({
        id: `usr_${Date.now()}`,
        name: currentUser.name,
        phone: currentUser.phone,
        email: currentUser.email,
        location: currentUser.location,
        bookings: 0,
        joined: '14 Oct 2026',
        status: 'ACTIVE'
      });
      renderPlatformUsersTables();
    }
    localStorage.setItem('turfsync_user', JSON.stringify(currentUser));
    customerLocation = location;
    closeSocialReferralModal();
    switchPortal('customer');
    showToast(`Mobile number +880 ${phone} verified! Welcome, ${name}.`, 'success');
  }

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:20 PM',
    actorName: currentUser.name,
    actorRole: currentUser.role === 'TURF' ? 'TURF_OWNER' : 'PLAYER',
    action: 'SOCIAL_REFERRAL_MOBILE_OTP_VERIFIED',
    category: 'AUTH',
    target: `User: ${currentUser.name} (${currentUser.phone})`,
    diff: { verification_method: 'SMS_OTP_4_DIGIT', channel: 'Social Media Campaign Landing' },
    reason: 'Verified real customer before granting booking privileges',
    ip: '103.145.22.45'
  });

  updateSessionHeaderUI();
}

// =========================================================================
// ENTERPRISE MODULE C: CUSTOMER LOCATION RECALCULATION ENGINE (REQ 6)
// =========================================================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function openCustomerLocationModal() {
  const modal = document.getElementById('customer-location-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeCustomerLocationModal() {
  const modal = document.getElementById('customer-location-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function selectCustomerZone(zoneName) {
  const zone = dhakaLocations[zoneName];
  if (!zone) return;

  customerCoords = { lat: zone.lat, lng: zone.lng };
  customerLocation = zone.label;

  if (currentUser && currentUser.role === 'CUSTOMER') {
    currentUser.location = zone.label;
    localStorage.setItem('turfsync_user', JSON.stringify(currentUser));
  }

  // Recalculate driving distance and driving time for all turfs in database
  turfsDatabase.forEach(turf => {
    const dist = haversineDistance(zone.lat, zone.lng, turf.lat, turf.lng);
    turf.distanceKm = parseFloat(dist.toFixed(1));
    const mins = Math.max(3, Math.round(dist * 3.5) + 2);
    turf.driveTime = `${mins} mins`;
  });

  // Re-sort turfs by proximity
  turfsDatabase.sort((a, b) => a.distanceKm - b.distanceKm);

  renderCustomerTurfs(turfsDatabase);
  updateSessionHeaderUI();
  closeCustomerLocationModal();
  showToast(`Location updated to ${zone.label}! Recalculated driving distances to all venues.`, 'success');
}

// =========================================================================
// ENTERPRISE MODULE D: WEB PORTAL USER DIRECTORY & TRASH AUDIT LOG (REQ 4)
// =========================================================================
function renderPlatformUsersTables() {
  const turfsTbody = document.getElementById('admin-turfs-tbody');
  const custTbody = document.getElementById('admin-customers-tbody');

  if (turfsTbody) {
    turfsTbody.innerHTML = '';
    turfsDatabase.forEach(turf => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors text-xs';
      tr.innerHTML = `
        <td class="py-3 font-bold text-white flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>${turf.name}</span>
        </td>
        <td class="py-3 text-slate-300">${turf.area}</td>
        <td class="py-3 font-mono text-emerald-400 font-bold">${turf.depositPercent}% Advance</td>
        <td class="py-3 text-slate-300">${turf.grounds.length} Grounds (${turf.sportsSupported.join(', ')})</td>
        <td class="py-3 font-mono text-slate-400">${turf.phone}</td>
        <td class="py-3 text-right">
          <button onclick="openAdminDeleteModal('TURF', '${turf.id}', '${turf.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-500/30 transition-all cursor-pointer">
            Delete Venue
          </button>
        </td>
      `;
      turfsTbody.appendChild(tr);
    });
  }

  if (custTbody) {
    custTbody.innerHTML = '';
    registeredCustomers.forEach(cust => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors text-xs';
      tr.innerHTML = `
        <td class="py-3 font-bold text-white">${cust.name}</td>
        <td class="py-3 font-mono text-emerald-400">${cust.phone}</td>
        <td class="py-3 text-slate-400">${cust.email}</td>
        <td class="py-3 text-slate-300">${cust.location}</td>
        <td class="py-3 font-mono font-bold text-slate-200">${cust.bookings} Bookings</td>
        <td class="py-3 text-slate-400 font-mono">${cust.joined}</td>
        <td class="py-3 text-right">
          <button onclick="openAdminDeleteModal('CUSTOMER', '${cust.id}', '${cust.name.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-500/30 transition-all cursor-pointer">
            Delete User
          </button>
        </td>
      `;
      custTbody.appendChild(tr);
    });
  }

  lucide.createIcons();
}

function renderPlatformDeleteLog() {
  const tbody = document.getElementById('admin-deletelog-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let turfDeletes = 0;
  let custDeletes = 0;

  deletedRecordsLog.forEach(log => {
    if (log.recordType === 'TURF_FACILITY') turfDeletes++;
    if (log.recordType === 'CUSTOMER') custDeletes++;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors text-xs';
    tr.innerHTML = `
      <td class="py-3 font-mono text-slate-400 whitespace-nowrap">${log.deletedAt}</td>
      <td class="py-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${log.recordType === 'TURF_FACILITY' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}">
          ${log.recordType}
        </span>
      </td>
      <td class="py-3 font-bold text-white">
        ${log.recordName}
        <div class="text-[10px] text-slate-500 font-mono">${log.recordId}</div>
      </td>
      <td class="py-3 text-slate-300 max-w-xs">
        <div class="p-1.5 rounded bg-slate-950/60 border border-slate-800 font-medium text-[11px] text-rose-300">
          "${log.reason}"
        </div>
      </td>
      <td class="py-3 font-mono text-slate-400">${log.deletedBy}</td>
      <td class="py-3 font-mono text-[10px] text-slate-500">${log.ip || '103.145.22.01'}</td>
    `;
    tbody.appendChild(tr);
  });

  const statTurfs = document.getElementById('stat-deleted-turfs');
  const statCusts = document.getElementById('stat-deleted-customers');
  const statTotal = document.getElementById('stat-deleted-total');
  if (statTurfs) statTurfs.textContent = turfDeletes;
  if (statCusts) statCusts.textContent = custDeletes;
  if (statTotal) statTotal.textContent = deletedRecordsLog.length;

  lucide.createIcons();
}

function openAdminAddTurfModal() {
  const modal = document.getElementById('admin-add-turf-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeAdminAddTurfModal() {
  const modal = document.getElementById('admin-add-turf-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function handleAdminSubmitTurf(e) {
  e.preventDefault();
  const name = document.getElementById('add-turf-name').value.trim();
  const area = document.getElementById('add-turf-area').value;
  const deposit = parseInt(document.getElementById('add-turf-deposit').value) || 40;
  const address = document.getElementById('add-turf-address').value.trim();
  const manager = document.getElementById('add-turf-manager').value.trim();
  const phone = document.getElementById('add-turf-phone').value.trim();
  const groundName = document.getElementById('add-turf-ground-name').value.trim() || 'Ground 1';
  const price = parseInt(document.getElementById('add-turf-price').value) || 2800;

  const newTurfId = `trf_${Date.now()}`;
  const newGroundId = `grd_${Date.now()}_1`;

  const newTurf = {
    id: newTurfId,
    name: name,
    area: area,
    address: address,
    lat: customerCoords.lat + (Math.random() - 0.5) * 0.05,
    lng: customerCoords.lng + (Math.random() - 0.5) * 0.05,
    distanceKm: 2.5,
    driveTime: '10 mins',
    phone: phone,
    whatsapp: phone.replace(/[^0-9]/g, ''),
    rating: 5.0,
    reviews: 1,
    depositPercent: deposit,
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    sportsSupported: ['FOOTBALL'],
    grounds: [
      {
        id: newGroundId,
        name: groundName,
        sport: 'FOOTBALL',
        format: '5v5',
        capacity: 10,
        surface: 'Artificial Turf 50mm',
        price1h: Math.round(price * 0.75),
        price1_5h: price,
        price2h: Math.round(price * 1.3)
      }
    ],
    amenities: ['Floodlights', 'Lockers', 'Free Parking'],
    gallery: { photos: [], videos: [] }
  };

  turfsDatabase.push(newTurf);
  // Generate initial independent schedule for the new ground
  getSlotsForGround(newGroundId, price);

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:25 PM',
    actorName: 'Super Admin',
    actorRole: 'PLATFORM_ADMIN',
    action: 'TURF_FACILITY_ADDED',
    category: 'FACILITY',
    target: `Turf: ${name} (${area})`,
    diff: { initial_ground: groundName, price_1_5h: `৳${price}`, deposit: `${deposit}%` },
    reason: 'New partner venue onboarding by Platform Headquarters',
    ip: '103.145.22.01'
  });

  closeAdminAddTurfModal();
  renderPlatformUsersTables();
  renderCustomerTurfs(turfsDatabase);
  showToast(`Turf venue "${name}" registered with independent slot schedules!`, 'success');
}

function openAdminAddCustomerModal() {
  const modal = document.getElementById('admin-add-customer-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeAdminAddCustomerModal() {
  const modal = document.getElementById('admin-add-customer-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function handleAdminSubmitCustomer(e) {
  e.preventDefault();
  const name = document.getElementById('add-cust-name').value.trim();
  const phone = document.getElementById('add-cust-phone').value.trim();
  const email = document.getElementById('add-cust-email').value.trim();
  const location = document.getElementById('add-cust-location').value;

  registeredCustomers.push({
    id: `usr_${Date.now()}`,
    name: name,
    phone: phone,
    email: email,
    location: location,
    bookings: 0,
    joined: '14 Oct 2026',
    status: 'ACTIVE'
  });

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:28 PM',
    actorName: 'Super Admin',
    actorRole: 'PLATFORM_ADMIN',
    action: 'CUSTOMER_REGISTERED',
    category: 'USER_MGMT',
    target: `Customer: ${name} (${phone})`,
    diff: { location: location, email: email },
    reason: 'Manual player account registration by Platform Admin',
    ip: '103.145.22.01'
  });

  closeAdminAddCustomerModal();
  renderPlatformUsersTables();
  showToast(`Customer account for "${name}" created!`, 'success');
}

let pendingDeleteTarget = null;

function openAdminDeleteModal(type, id, name) {
  pendingDeleteTarget = { type, id, name };
  const modal = document.getElementById('admin-delete-confirm-modal');
  if (!modal) return;
  document.getElementById('delete-target-display').textContent = `${name} (${type === 'TURF' ? 'Turf Venue' : 'Customer Account'})`;
  document.getElementById('delete-reason-input').value = '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeAdminDeleteModal() {
  const modal = document.getElementById('admin-delete-confirm-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  pendingDeleteTarget = null;
}

function executeAdminConfirmedDelete() {
  if (!pendingDeleteTarget) return;

  const reason = document.getElementById('delete-reason-input').value.trim();
  if (!reason) {
    showToast('Mandatory deletion justification reason required!', 'error');
    return;
  }

  const { type, id, name } = pendingDeleteTarget;

  if (type === 'TURF') {
    const idx = turfsDatabase.findIndex(t => t.id === id);
    if (idx > -1) turfsDatabase.splice(idx, 1);
  } else if (type === 'CUSTOMER') {
    const idx = registeredCustomers.findIndex(c => c.id === id);
    if (idx > -1) registeredCustomers.splice(idx, 1);
  }

  // Record into immutable Deleted Records & Trash Log
  deletedRecordsLog.unshift({
    id: `del_${Date.now()}`,
    recordType: type === 'TURF' ? 'TURF_FACILITY' : 'CUSTOMER',
    recordId: id,
    recordName: name,
    deletedBy: 'Super Admin (admin@turfsync.com)',
    deletedAt: '14 Oct 2026, 10:30 PM',
    reason: reason,
    ip: '103.145.22.01'
  });

  // Log in system-wide audit trail
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:30 PM',
    actorName: 'Super Admin',
    actorRole: 'PLATFORM_ADMIN',
    action: `${type}_DELETED_WITH_TRASH_LOG`,
    category: 'DELETION',
    target: `${type}: ${name} (${id})`,
    diff: { reason: reason, logged_in_trash_log: 'YES' },
    reason: reason,
    ip: '103.145.22.01'
  });

  closeAdminDeleteModal();
  renderPlatformUsersTables();
  renderPlatformDeleteLog();
  renderCustomerTurfs(turfsDatabase);
  showToast(`Record "${name}" deleted and permanently logged in Trash Audit Log.`, 'success');
}

// =========================================================================
// ENTERPRISE MODULE E: PLATFORM PROMO CODES ENGINE & ADMIN PANEL (REQ 5)
// =========================================================================
function renderPlatformPromosTable() {
  const tbody = document.getElementById('admin-promos-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let activeCount = 0;
  let totalDiscountsGiven = 0;

  platformPromoCodes.forEach(p => {
    if (p.active) activeCount++;
    totalDiscountsGiven += (p.uses || 0) * (p.type === 'PLATFORM_FEE_PERCENTAGE' ? Math.min(100, p.capAmount) : Math.min(300, p.capAmount));

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors text-xs';
    tr.innerHTML = `
      <td class="py-3 font-mono font-bold text-amber-400">
        <span class="px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg">${p.code}</span>
      </td>
      <td class="py-3 text-slate-300">
        ${p.type === 'PLATFORM_FEE_PERCENTAGE' ? 'Platform Fee Waiver' : 'Total Match Booking'}
      </td>
      <td class="py-3 font-mono font-bold text-white">${p.percent}% Off</td>
      <td class="py-3 font-mono font-bold text-emerald-400">৳${p.capAmount} Max Cap</td>
      <td class="py-3 font-mono text-slate-300">${p.uses || 0} times</td>
      <td class="py-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${p.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">
          ${p.active ? 'ACTIVE' : 'DISABLED'}
        </span>
      </td>
      <td class="py-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="adminTogglePromo('${p.code}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs border border-slate-700 cursor-pointer">
            ${p.active ? 'Disable' : 'Enable'}
          </button>
          <button onclick="adminDeletePromo('${p.code}')" class="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold rounded-lg text-xs border border-rose-500/30 cursor-pointer">
            Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const activeStat = document.getElementById('stat-active-promos');
  const discountStat = document.getElementById('stat-total-promo-discounts');
  if (activeStat) activeStat.textContent = activeCount;
  if (discountStat) discountStat.textContent = `৳${totalDiscountsGiven.toLocaleString()}`;

  lucide.createIcons();
}

function openAdminCreatePromoModal() {
  const modal = document.getElementById('admin-create-promo-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeAdminCreatePromoModal() {
  const modal = document.getElementById('admin-create-promo-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function handleAdminSubmitPromo(e) {
  e.preventDefault();
  const code = document.getElementById('promo-create-code').value.trim().toUpperCase();
  const type = document.getElementById('promo-create-type').value;
  const percent = parseInt(document.getElementById('promo-create-percent').value) || 50;
  const cap = parseInt(document.getElementById('promo-create-cap').value) || 100;
  const desc = document.getElementById('promo-create-desc').value.trim();

  if (!code) {
    showToast('Promo code cannot be empty!', 'error');
    return;
  }

  // Check duplicate
  const exists = platformPromoCodes.find(p => p.code === code);
  if (exists) {
    showToast(`Promo code "${code}" already exists!`, 'error');
    return;
  }

  platformPromoCodes.unshift({
    code: code,
    type: type,
    percent: percent,
    capAmount: cap,
    desc: desc,
    uses: 0,
    active: true
  });

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: '14 Oct 2026, 10:32 PM',
    actorName: 'Super Admin',
    actorRole: 'PLATFORM_ADMIN',
    action: 'PROMO_CODE_CREATED',
    category: 'PROMOTIONS',
    target: `Promo: ${code} (${percent}% capped at ৳${cap})`,
    diff: { discount_type: type, percent: `${percent}%`, max_cap: `৳${cap}` },
    reason: desc,
    ip: '103.145.22.01'
  });

  closeAdminCreatePromoModal();
  renderPlatformPromosTable();
  showToast(`Promo code "${code}" created (${percent}% off, max cap ৳${cap})!`, 'success');
}

function adminTogglePromo(code) {
  const p = platformPromoCodes.find(x => x.code === code);
  if (!p) return;
  p.active = !p.active;
  renderPlatformPromosTable();
  showToast(`Promo code ${code} is now ${p.active ? 'ACTIVE' : 'DISABLED'}.`, 'info');
}

function adminDeletePromo(code) {
  const idx = platformPromoCodes.findIndex(x => x.code === code);
  if (idx === -1) return;
  platformPromoCodes.splice(idx, 1);
  renderPlatformPromosTable();
  showToast(`Promo code ${code} deleted.`, 'info');
}

// =========================================================================
// ENTERPRISE MODULE F: REDESIGNED COUNTER DESK CHECK-IN & REVENUE RECOGNITION (REQ 8)
// =========================================================================
function renderDeskBookingsQueue(targetDate) {
  const tbody = document.getElementById('desk-queue-tbody') || document.getElementById('desk-bookings-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  const dateToUse = targetDate || activeScheduleDate || '2026-10-14';
  const bookings = getAllBookingsForDate(dateToUse);

  // Update Header with Active Date
  const headerTitle = document.getElementById('desk-queue-header-title');
  if (headerTitle) {
    headerTitle.innerHTML = `<i data-lucide="clock" class="w-5 h-5 text-emerald-400"></i> Match Arrival & Check-In Queue — <span class="text-emerald-400 font-mono text-sm">${formatDateDisplay(dateToUse)}</span>`;
  }
  const headerSub = document.getElementById('desk-queue-header-sub');
  if (headerSub) {
    headerSub.textContent = `Live list of ${bookings.length} reserved match slots across all grounds for ${getFullFormattedDate(dateToUse)}.`;
  }

  // Update Count Badge
  const countBadge = document.getElementById('desk-queue-count-badge');
  const pendingDues = bookings.filter(b => b.dueAmount > 0).length;
  if (countBadge) {
    countBadge.textContent = `${pendingDues} Due Pending (${bookings.length} Total • ${formatDateDisplay(dateToUse)})`;
    if (pendingDues > 0) {
      countBadge.className = 'text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full animate-pulse';
    } else {
      countBadge.className = 'text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full';
    }
  }

  // Update Dynamic Quick Test Chips for this specific date
  const chipsContainer = document.getElementById('desk-quick-test-chips');
  if (chipsContainer) {
    chipsContainer.innerHTML = '';
    if (bookings.length === 0) {
      chipsContainer.innerHTML = `<span class="text-slate-500 italic text-[11px]">No bookings scheduled for ${formatDateDisplay(dateToUse)}.</span>`;
    } else {
      bookings.slice(0, 4).forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.onclick = () => quickFillDeskLookup(b.ref);
        btn.className = 'px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono font-bold rounded-lg border border-slate-700 transition-all cursor-pointer';
        btn.textContent = `${b.ref} (${b.dueAmount > 0 ? `৳${b.dueAmount} Due` : 'Paid'})`;
        chipsContainer.appendChild(btn);
      });
    }
  }

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="py-10 text-center text-slate-500">
          <i data-lucide="calendar-x" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
          <div class="font-bold text-slate-400">No reserved matches scheduled for ${getFullFormattedDate(dateToUse)}.</div>
          <div class="text-[11px] text-slate-500 mt-1">Select another date from the Schedule Calendar to view shift arrivals.</div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  bookings.forEach(b => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors text-xs';

    const isPaid = b.dueAmount === 0;
    const statusPill = isPaid
      ? '<span class="px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1 w-max"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> PAID IN FULL</span>'
      : '<span class="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1 w-max animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> DUE PENDING</span>';

    tr.innerHTML = `
      <td class="py-3 font-mono font-bold text-white">
        <button onclick="quickFillDeskLookup('${b.ref}')" class="text-emerald-400 hover:underline font-bold text-left cursor-pointer">
          ${b.ref}
        </button>
      </td>
      <td class="py-3 font-medium text-slate-200">
        <div>${b.customerName}</div>
        <div class="text-[10px] text-slate-400 font-mono">${b.customerPhone}</div>
      </td>
      <td class="py-3 text-slate-300">
        <div class="font-bold text-white">${b.groundName}</div>
        <div class="text-[10px] text-slate-400 font-mono">${b.slotTime}</div>
      </td>
      <td class="py-3 font-mono text-white font-bold">৳${b.totalFee.toLocaleString()}</td>
      <td class="py-3 font-mono text-emerald-400 font-bold">৳${b.advancePaid.toLocaleString()}</td>
      <td class="py-3 font-mono font-bold ${b.dueAmount > 0 ? 'text-amber-400 text-sm' : 'text-slate-500'}">
        ${b.dueAmount > 0 ? `৳${b.dueAmount.toLocaleString()}` : '৳0'}
      </td>
      <td class="py-3">${statusPill}</td>
      <td class="py-3 text-right">
        <div class="flex items-center justify-end gap-1.5">
          ${b.dueAmount > 0 ? `
            <button onclick="openCounterCollectDueModal('${b.ref}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-1 cursor-pointer">
              <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
              <span>Collect ৳${b.dueAmount}</span>
            </button>
          ` : `
            <button onclick="quickFillDeskLookup('${b.ref}')" class="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg text-xs border border-emerald-500/30 flex items-center gap-1 cursor-pointer">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              <span>Checked In</span>
            </button>
          `}
          <button onclick="quickFillDeskLookup('${b.ref}')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs border border-slate-700 cursor-pointer">
            Dossier
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function handleDeskLookup() {
  const inputEl = document.getElementById('desk-lookup-input') || document.getElementById('desk-search-input');
  if (!inputEl) return;
  const q = inputEl.value.trim().toUpperCase();

  if (!q) {
    showToast('Please enter an Invoice number or Booking Reference (e.g. TRF-202610-101).', 'info');
    return;
  }

  // 1. Search in current active date's bookings
  let currentBookings = getAllBookingsForDate(activeScheduleDate);
  let b = currentBookings.find(x => 
    x.ref.toUpperCase().includes(q) || 
    (x.invoiceNo && x.invoiceNo.toUpperCase().includes(q)) ||
    (x.customerName && x.customerName.toUpperCase().includes(q)) ||
    (x.customerPhone && x.customerPhone.includes(q))
  );

  // 2. If not found in active date, search across all 14 upcoming seeded dates
  if (!b) {
    const upcomingDays = getUpcomingDays('2026-10-14', 14);
    for (let day of upcomingDays) {
      if (day.iso !== activeScheduleDate) {
        const dayBookings = getAllBookingsForDate(day.iso);
        const match = dayBookings.find(x => 
          x.ref.toUpperCase().includes(q) || 
          (x.invoiceNo && x.invoiceNo.toUpperCase().includes(q)) ||
          (x.customerName && x.customerName.toUpperCase().includes(q)) ||
          (x.customerPhone && x.customerPhone.includes(q))
        );
        if (match) {
          b = match;
          handleSelectTurfDate(day.iso);
          showToast(`Found booking ${b.ref} on ${getFullFormattedDate(day.iso)}. Schedule switched to this date!`, 'info');
          break;
        }
      }
    }
  }

  // 3. Fallback search in deskBookingsQueue
  if (!b) {
    b = deskBookingsQueue.find(x => 
      x.ref.toUpperCase().includes(q) || 
      (x.invoiceNo && x.invoiceNo.toUpperCase().includes(q)) ||
      (x.customerName && x.customerName.toUpperCase().includes(q))
    );
  }

  if (!b) {
    showToast(`No match booking found for "${q}". Check the reference code and date.`, 'error');
    return;
  }

  // Populate Dossier Card
  const card = document.getElementById('desk-dossier-card');
  document.getElementById('desk-dossier-ref').textContent = b.ref;
  document.getElementById('desk-dossier-player').textContent = b.customerName;
  document.getElementById('desk-dossier-ground').textContent = `${b.groundName} • ${formatDateDisplay(b.dateIso || activeScheduleDate)}`;
  document.getElementById('desk-dossier-time').textContent = b.slotTime;
  document.getElementById('desk-dossier-platformfee').textContent = `৳${b.platformFee || 200}`;
  document.getElementById('desk-dossier-total').textContent = `৳${b.totalFee.toLocaleString()}`;
  document.getElementById('desk-dossier-advance').textContent = `৳${b.advancePaid.toLocaleString()}`;
  document.getElementById('desk-dossier-due').textContent = `৳${b.dueAmount.toLocaleString()}`;

  const statusPill = document.getElementById('desk-dossier-status-pill');
  if (b.dueAmount === 0) {
    statusPill.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5';
    statusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> PAID IN FULL — CLEARED FOR KICKOFF`;
  } else {
    statusPill.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 animate-pulse';
    statusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> DUE BALANCE: ৳${b.dueAmount.toLocaleString()}`;
  }

  // Dossier Action container
  const actionContainer = document.getElementById('desk-dossier-action-container');
  if (actionContainer) {
    if (b.dueAmount > 0) {
      actionContainer.innerHTML = `
        <button onclick="openCounterCollectDueModal('${b.ref}')" class="w-full bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
          <i data-lucide="wallet" class="w-4 h-4 text-slate-950"></i>
          <span>Collect Remaining ৳${b.dueAmount.toLocaleString()} Cash & Clear for Kickoff</span>
        </button>
      `;
    } else {
      actionContainer.innerHTML = `
        <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>BOOKING SETTLED & VERIFIED — PLAYERS MAY ENTER TURF</span>
          </div>
          <span class="stamp-seal-counter-paid text-[10px]">PAID & CHECKED IN</span>
        </div>
      `;
    }
  }

  card.classList.remove('hidden');
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  lucide.createIcons();
}

function quickFillDeskLookup(ref) {
  const inputEl = document.getElementById('desk-lookup-input') || document.getElementById('desk-search-input');
  if (inputEl) {
    inputEl.value = ref;
    handleDeskLookup();
  }
}

let activeCounterCollectRef = null;

function openCounterCollectDueModal(ref) {
  const allCurrent = getAllBookingsForDate(activeScheduleDate);
  let b = allCurrent.find(x => x.ref === ref);
  if (!b) b = deskBookingsQueue.find(x => x.ref === ref);
  if (!b) return;

  activeCounterCollectRef = ref;
  document.getElementById('collect-modal-ref').textContent = b.ref;
  document.getElementById('collect-modal-player').textContent = b.customerName;
  document.getElementById('collect-modal-ground').textContent = `${b.groundName} (${formatDateDisplay(b.dateIso || activeScheduleDate)})`;
  document.getElementById('collect-modal-time').textContent = b.slotTime;
  document.getElementById('collect-modal-advance').textContent = `৳${b.advancePaid.toLocaleString()}`;
  document.getElementById('collect-modal-due').textContent = `৳${b.dueAmount.toLocaleString()}`;

  const modal = document.getElementById('counter-collect-due-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
}

function closeCounterCollectDueModal() {
  const modal = document.getElementById('counter-collect-due-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  activeCounterCollectRef = null;
}

function executeConfirmCashDueCollection() {
  if (!activeCounterCollectRef) return;

  const allCurrent = getAllBookingsForDate(activeScheduleDate);
  let b = allCurrent.find(x => x.ref === activeCounterCollectRef);
  if (!b) b = deskBookingsQueue.find(x => x.ref === activeCounterCollectRef);
  if (!b) return;

  const collectedDue = b.dueAmount;
  b.dueAmount = 0;
  b.status = 'COMPLETED / PAID IN FULL AT COUNTER';
  b.settledAt = `${formatDateDisplay(activeScheduleDate)}, 05:30 PM`;

  // Also clear in deskBookingsQueue if present
  const queueEntry = deskBookingsQueue.find(x => x.ref === b.ref);
  if (queueEntry) {
    queueEntry.dueAmount = 0;
    queueEntry.status = 'COMPLETED / PAID IN FULL AT COUNTER';
  }

  // Clear slot due in ground schedule for the active date
  const groundSchedule = getSlotsForGround(b.groundId || activeTurfGroundId || 'grd_1a', 2800, b.dateIso || activeScheduleDate);
  const matchedSlot = groundSchedule.find(s => s.bookingRef === b.ref || s.id === b.slotId);
  if (matchedSlot) {
    matchedSlot.due = 0;
  }

  // Multi-agent audit trail logging revenue recognition
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    timestamp: `${formatDateDisplay(activeScheduleDate)}, 05:30 PM`,
    actorName: 'Robiul Islam',
    actorRole: 'TURF_COUNTER (Shift A)',
    action: 'COUNTER_DUE_COLLECTED_AND_REVENUE_RECOGNIZED',
    category: 'REVENUE',
    target: `Booking: ${b.ref}`,
    diff: {
      cash_collected: `৳${collectedDue.toLocaleString()}`,
      remaining_due: '৳0',
      revenue_recognition: '100% RECOGNIZED IN LEDGER',
      status: 'PAID IN FULL — CHECKED IN'
    },
    reason: 'Player settled final match balance in cash at front desk before kickoff',
    ip: '103.145.22.18'
  });

  closeCounterCollectDueModal();
  renderDeskBookingsQueue();
  renderTurfScheduleTable();
  renderTurfShiftFinancialSummary();
  renderTurfFinancialAnalytics();
  renderPlatformAdminDashboard();
  quickFillDeskLookup(b.ref);

  showToast(`৳${collectedDue.toLocaleString()} collected! Booking ${b.ref} marked PAID IN FULL. Revenue recognized on all financial ledgers.`, 'success');
}

