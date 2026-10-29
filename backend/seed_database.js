/**
 * Comprehensive Idempotent Seed Script for ResQ Mangaluru
 * Database: disaster_relief_mangaluru
 * 
 * Complies with strict idempotency:
 * - Does NOT drop or truncate existing collections.
 * - Does NOT remove existing production or test records.
 * - Uses stable unique keys (email for users, name for shelters/volunteers/donations, title for incidents)
 *   to ensure multiple runs never generate duplicates.
 * - Real Mongoose models with validation constraints (shelter occupancy <= capacity, valid enums, hashed passwords).
 * - Geolocated across Mangaluru & surrounding coastal/riverine taluks:
 *   Hampankatta, Kadri, Jeppu, Bolar, Pandeshwar, Ullal, Surathkal, Kankanady, Bejai, Panambur, etc.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Incident = require('./models/Incident');
const Shelter = require('./models/Shelter');
const Volunteer = require('./models/Volunteer');
const Donation = require('./models/Donation');
const Notification = require('./models/Notification');

dotenv.config({ path: __dirname + '/.env' });

const SEED_SUMMARY = {
  users: { inserted: 0, existing: 0 },
  shelters: { inserted: 0, existing: 0 },
  incidents: { inserted: 0, existing: 0 },
  donations: { inserted: 0, existing: 0 },
  volunteers: { inserted: 0, existing: 0 },
  notifications: { inserted: 0, existing: 0 }
};

// --- 1. USER ACCOUNTS SPECIFICATION ---
// 1 Main Admin, 10 Citizens, 8 Responders, 5 Dedicated Volunteers (Registered Users)
const USERS_DATA = [
  // Admin
  {
    name: 'Dr. Ramesh Rao (Admin)',
    email: 'admin@resqmangaluru.org',
    passwordRaw: 'AdminPassword123!',
    role: 'admin',
    phone: '+91 824 2220001',
    address: 'DC Office Complex, Bunder, Mangaluru',
    availability: 'Available',
    skills: ['Disaster Logistics', 'Emergency Coordination', 'Crisis Command'],
    areaOfOperation: 'Dakshina Kannada District'
  },
  // Responders (8)
  {
    name: 'Kavitha Shenoy (NDRF Lead)',
    email: 'responder@resqmangaluru.org',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 98801 23456',
    address: 'Kadri Fire & Rescue Station, Mangaluru',
    availability: 'Available',
    skills: ['Flood Rescue', 'First Aid', 'Boat Operations', 'Swift Water Rescue'],
    areaOfOperation: 'Kadri & Bejai Zone'
  },
  {
    name: 'Mohammad Farooq (Rescue Specialist)',
    email: 'farooq@resqmangaluru.org',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 94481 98765',
    address: 'Panambur Coastal Station, Mangaluru',
    availability: 'On Duty',
    skills: ['Coastal Evacuation', 'Search & Rescue', 'Deep Sea Rescue'],
    areaOfOperation: 'Panambur & Surathkal Coast'
  },
  {
    name: 'Inspector Rajesh Poojary (SDRF Commander)',
    email: 'rajesh.poojary@example.com',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 98451 11223',
    address: 'Pandeshwar Fire Headquarters, Mangaluru',
    availability: 'Available',
    skills: ['Fire Suppression', 'Structural Collapse Extraction', 'HAZMAT Response'],
    areaOfOperation: 'Pandeshwar & Hampankatta'
  },
  {
    name: 'Dr. Sneha Alva (Emergency Paramedic)',
    email: 'sneha.alva@example.com',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 94812 22334',
    address: 'Wenlock District Hospital Emergency Unit, Mangaluru',
    availability: 'On Duty',
    skills: ['Mass Casualty Triage', 'Advanced Cardiac Life Support', 'Field Surgery Support'],
    areaOfOperation: 'Kankanady & Hampankatta Medical Corridor'
  },
  {
    name: 'Ganesh Naik (Coastal Guard Lifeguard)',
    email: 'ganesh.naik@example.com',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 97403 33445',
    address: 'Ullal Coastal Life Saving Center, Mangaluru',
    availability: 'Available',
    skills: ['Surf Life Saving', 'Rescue Watercraft Operations', 'Drowning Resuscitation'],
    areaOfOperation: 'Ullal & Someshwar Beachline'
  },
  {
    name: 'Preethi D’Souza (Civil Defense Warden)',
    email: 'preethi.dsouza@example.com',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 98864 44556',
    address: 'Urwa Market Civic Center, Mangaluru',
    availability: 'Available',
    skills: ['Public Evacuation Routing', 'Shelter Management', 'Vulnerable Group Assistance'],
    areaOfOperation: 'Urwa & Ladyhill'
  },
  {
    name: 'Anand Mendonca (Heavy Machinery Operator)',
    email: 'anand.mendonca@example.com',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 94495 55667',
    address: 'Bikarnakatte PWD Depot, Mangaluru',
    availability: 'On Duty',
    skills: ['Excavator & Earthmover Operation', 'Debris Clearing', 'Landslide Barrier Clearing'],
    areaOfOperation: 'Gurupura & Bikarnakatte Hills'
  },
  {
    name: 'Shankar Salian (Marine Fisheries Safety Coordinator)',
    email: 'shankar.salian@example.com',
    passwordRaw: 'ResponderPass123!',
    role: 'responder',
    phone: '+91 96116 66778',
    address: 'Old Port Wharf, Bunder, Mangaluru',
    availability: 'Busy',
    skills: ['Trawler Radio Communication', 'Estuary Navigation', 'Harbor Safety'],
    areaOfOperation: 'Bunder, Bolar & Bengre Estuary'
  },
  // Citizens (10)
  {
    name: 'Suresh Kumar (Citizen)',
    email: 'citizen@resqmangaluru.org',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 91234 56789',
    address: 'Kodialbail, Mangaluru, Karnataka',
    availability: 'Available',
    skills: ['Community Volunteer'],
    areaOfOperation: 'Mangaluru City'
  },
  {
    name: 'Sunita Shetty',
    email: 'sunita.shetty@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 98450 78901',
    address: 'Kadri Kambla Road, Mangaluru',
    availability: 'Available',
    skills: ['Community First Aid'],
    areaOfOperation: 'Kadri'
  },
  {
    name: 'Abdul Rahiman',
    email: 'abdul.rahiman@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 98801 89012',
    address: 'Jeppu Bappal, Mangaluru',
    availability: 'Available',
    skills: ['Local Navigator'],
    areaOfOperation: 'Jeppu'
  },
  {
    name: 'Pratibha Kamath',
    email: 'pratibha.kamath@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 94482 90123',
    address: 'Bejai New Road, Mangaluru',
    availability: 'Available',
    skills: ['Language Assistance'],
    areaOfOperation: 'Bejai'
  },
  {
    name: 'Lancelot Pinto',
    email: 'lancelot.pinto@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 97403 01234',
    address: 'Bolar Church Cross, Mangaluru',
    availability: 'Available',
    skills: ['Community Outreach'],
    areaOfOperation: 'Bolar'
  },
  {
    name: 'Roopa Kotian',
    email: 'roopa.kotian@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 98864 12345',
    address: 'Surathkal Light House Road, Mangaluru',
    availability: 'Available',
    skills: ['Logistics'],
    areaOfOperation: 'Surathkal'
  },
  {
    name: 'Naveen Suvarna',
    email: 'naveen.suvarna@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 94495 23456',
    address: 'Ullal Master Plan Layout, Mangaluru',
    availability: 'Available',
    skills: ['First Aid Volunteer'],
    areaOfOperation: 'Ullal'
  },
  {
    name: 'Harish Kulal',
    email: 'harish.kulal@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 96116 34567',
    address: 'Kankanady Bypass Road, Mangaluru',
    availability: 'Available',
    skills: ['Transport Assistance'],
    areaOfOperation: 'Kankanady'
  },
  {
    name: 'Meenakshi Pai',
    email: 'meenakshi.pai@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 99007 45678',
    address: 'Mannagudda 3rd Cross, Mangaluru',
    availability: 'Available',
    skills: ['Community Care'],
    areaOfOperation: 'Mannagudda'
  },
  {
    name: 'Faizal Khan',
    email: 'faizal.khan@example.com',
    passwordRaw: 'CitizenPass123!',
    role: 'citizen',
    phone: '+91 99808 56789',
    address: 'Bunder Goods Shed Road, Mangaluru',
    availability: 'Available',
    skills: ['Warehouse Assistance'],
    areaOfOperation: 'Bunder'
  },
  // Dedicated Volunteers (Registered Users) (5)
  {
    name: 'Aditya Hegde',
    email: 'aditya.hegde@example.com',
    passwordRaw: 'VolunteerPass123!',
    role: 'citizen',
    phone: '+91 98450 11223',
    address: 'Kotepura, Ullal, Mangaluru',
    availability: 'Available',
    skills: ['First Aid', 'Swimming & Lifesaving', 'Search & Rescue'],
    areaOfOperation: 'Ullal & Bengre Coastal Zone'
  },
  {
    name: 'Deepa Kamath',
    email: 'deepa.kamath@example.com',
    passwordRaw: 'VolunteerPass123!',
    role: 'citizen',
    phone: '+91 94812 33445',
    address: 'Mallikatta, Mangaluru',
    availability: 'On Duty',
    skills: ['Medical Triage', 'Nursing & First Aid', 'Counseling'],
    areaOfOperation: 'Mangaluru City / Town Hall Shelter'
  },
  {
    name: 'Roshan Pereira',
    email: 'roshan.p@example.com',
    passwordRaw: 'VolunteerPass123!',
    role: 'citizen',
    phone: '+91 97401 55667',
    address: 'Bejai Church Compound, Mangaluru',
    availability: 'Available',
    skills: ['Heavy Vehicle Driving', 'Debris Clearing', 'Logistics'],
    areaOfOperation: 'Kodialbail & Bejai'
  },
  {
    name: 'Zeenath Banu',
    email: 'zeenath.b@example.com',
    passwordRaw: 'VolunteerPass123!',
    role: 'citizen',
    phone: '+91 98860 77889',
    address: 'Car Street Bunder, Mangaluru',
    availability: 'Available',
    skills: ['Community Kitchen', 'Ration Distribution', 'Language Translation'],
    areaOfOperation: 'Bunder & Car Street'
  },
  {
    name: 'Vikas Acharya',
    email: 'vikas.acharya@example.com',
    passwordRaw: 'VolunteerPass123!',
    role: 'citizen',
    phone: '+91 94490 88990',
    address: 'Surathkal Junction, Mangaluru',
    availability: 'Available',
    skills: ['Drone Aerial Survey', 'HAM Radio Communication', 'GIS Mapping'],
    areaOfOperation: 'Surathkal & Panambur'
  }
];

// --- 2. EMERGENCY SHELTERS DATA (14 Shelters across Mangaluru) ---
// Validated: 0 <= occupancy <= capacity, diverse occupancy levels (Low, Moderate, High, Full)
const SHELTERS_DATA = [
  {
    name: 'Town Hall Evacuation Relief Center',
    address: 'Nehru Maidan Road, Hampankatta, Mangaluru - 575001',
    latitude: 12.8687,
    longitude: 74.8427,
    capacity: 350,
    occupancy: 140, // Moderate (40%)
    facilities: ['Clean Drinking Water', 'Community Kitchen', 'Paramedic Desk', 'Restrooms', 'Generator Power'],
    contactPerson: 'Smt. Anitha D’Souza',
    contactPhone: '+91 824 2420101',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Kadri Community Relief Hall',
    address: 'Near Kadri Temple, Mallikatta, Mangaluru - 575002',
    latitude: 12.8872,
    longitude: 74.8624,
    capacity: 200,
    occupancy: 185, // High (92%)
    facilities: ['Drinking Water', 'First Aid', 'Blankets & Mattresses', 'Mobile Charging'],
    contactPerson: 'Sri Pradeep Poojary',
    contactPhone: '+91 824 2445566',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Surathkal Coastal Shelter & Camp',
    address: 'National Institute Road, Surathkal, Mangaluru - 575025',
    latitude: 13.0084,
    longitude: 74.7937,
    capacity: 250,
    occupancy: 250, // Full (100%)
    facilities: ['Emergency Rations', 'Medical Isolation Ward', 'Sanitation Kits', 'Security Desk'],
    contactPerson: 'Dr. Vinay Bhat',
    contactPhone: '+91 824 2470200',
    status: 'Full',
    isDemoData: true
  },
  {
    name: 'Ullal Flood Relief Shelter',
    address: 'Kotepura Coastal Link, Ullal, Mangaluru - 575020',
    latitude: 12.8028,
    longitude: 74.8512,
    capacity: 180,
    occupancy: 45, // Low (25%)
    facilities: ['Drinking Water', 'Child Care Space', 'Cooked Meals', 'Medical Team'],
    contactPerson: 'Razak Ullal',
    contactPhone: '+91 824 2461122',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Bejai Parish Community Hall Shelter',
    address: 'Bejai Church Road, Bejai, Mangaluru - 575004',
    latitude: 12.8860,
    longitude: 74.8480,
    capacity: 220,
    occupancy: 80, // Moderate (36%)
    facilities: ['Clean Drinking Water', 'Community Beds', 'First Aid Station', 'Backup Power'],
    contactPerson: 'Fr. Melwyn Noronha',
    contactPhone: '+91 824 2212345',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Kankanady St. Joseph Disaster Relief Camp',
    address: 'Father Muller Road, Kankanady, Mangaluru - 575002',
    latitude: 12.8635,
    longitude: 74.8620,
    capacity: 300,
    occupancy: 275, // High (91%)
    facilities: ['Hospital Adjacent Medical Access', 'Pediatric Care', 'Oxygen Cylinders', 'Hot Meals'],
    contactPerson: 'Sr. Celine Fernandes',
    contactPhone: '+91 824 2238000',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Panambur Port Maritime Evacuation Center',
    address: 'Panambur Beach Access Road, Mangaluru - 575010',
    latitude: 12.9520,
    longitude: 74.8095,
    capacity: 200,
    occupancy: 30, // Low (15%)
    facilities: ['Marine Rescue Equipment Depot', 'Water Purification Unit', 'Satellite Phone', 'Dormitory'],
    contactPerson: 'Capt. Sudhir Rao',
    contactPhone: '+91 824 2400500',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Bolar Riverfront Relief Facility',
    address: 'Mulihithlu Road, Bolar, Mangaluru - 575001',
    latitude: 12.8465,
    longitude: 74.8390,
    capacity: 160,
    occupancy: 110, // Moderate (68%)
    facilities: ['Boat Anchorage', 'Life Jackets Stash', 'Community Kitchen', 'Basic First Aid'],
    contactPerson: 'Jayaram Mendon',
    contactPhone: '+91 824 2419800',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Jeppu Seminary Grounds Relief Center',
    address: 'Kankanady-Jeppu Road, Jeppu, Mangaluru - 575002',
    latitude: 12.8530,
    longitude: 74.8550,
    capacity: 280,
    occupancy: 190, // Moderate (67%)
    facilities: ['Large Open Grounds', 'Ambulance Bay', 'Mass Dining Hall', 'Clean Sanitary Facilities'],
    contactPerson: 'Denis D’Cunha',
    contactPhone: '+91 824 2434500',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Pandeshwar Fire Brigade Civic Hall',
    address: 'Rosario Church Road, Pandeshwar, Mangaluru - 575001',
    latitude: 12.8610,
    longitude: 74.8375,
    capacity: 175,
    occupancy: 40, // Low (22%)
    facilities: ['Emergency Siren Alert System', 'Direct Fire Tender Link', 'Paramedic Unit', 'Drinking Water'],
    contactPerson: 'Sujith Shetty',
    contactPhone: '+91 824 2423333',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Kodialbail Govt Higher Primary School Shelter',
    address: 'MG Road, Kodialbail, Mangaluru - 575003',
    latitude: 12.8780,
    longitude: 74.8385,
    capacity: 150,
    occupancy: 0, // Available / Ready (0%)
    facilities: ['Classroom Dormitories', 'Clean Water Filters', 'Solar Lights', 'First Aid Box'],
    contactPerson: 'Girija Kumari',
    contactPhone: '+91 824 2491200',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Kulur Bridge Flood Respite Shelter',
    address: 'NH 66 Highway Junction, Kulur, Mangaluru - 575013',
    latitude: 12.9250,
    longitude: 74.8210,
    capacity: 210,
    occupancy: 210, // Full (100%)
    facilities: ['Highway Rescue Staging Point', 'Emergency Generator', 'Tarpaulins & Tents', 'Rations'],
    contactPerson: 'Mohan Bangera',
    contactPhone: '+91 824 2489090',
    status: 'Full',
    isDemoData: true
  },
  {
    name: 'Bunder Fish Workers Community Hall',
    address: 'Old Port Road, Bunder, Mangaluru - 575001',
    latitude: 12.8595,
    longitude: 74.8320,
    capacity: 140,
    occupancy: 55, // Moderate (39%)
    facilities: ['Safe Harbor Access', 'Radio Broadcast', 'Dry Food Rations', 'Water Tanks'],
    contactPerson: 'Usman Bava',
    contactPhone: '+91 824 2411234',
    status: 'Open',
    isDemoData: true
  },
  {
    name: 'Derebail Community Welfare Center',
    address: 'Konchady Road, Derebail, Mangaluru - 575006',
    latitude: 12.9110,
    longitude: 74.8510,
    capacity: 180,
    occupancy: 25, // Low (13%)
    facilities: ['Elderly Care Cots', 'Women Support Unit', 'Filtered Water', 'Kitchen Facilities'],
    contactPerson: 'Shalini Shenoy',
    contactPhone: '+91 824 2217890',
    status: 'Open',
    isDemoData: true
  }
];

// --- 3. SYNTHETIC REALISTIC INCIDENTS (30 Incidents across Mangaluru) ---
// Validated: category enum, severity enum, status enum, real citizen & responder references, realistic timestamps
function getIncidentsData(usersMap) {
  const citizen = usersMap['citizen@resqmangaluru.org'];
  const sunita = usersMap['sunita.shetty@example.com'] || citizen;
  const abdul = usersMap['abdul.rahiman@example.com'] || citizen;
  const pratibha = usersMap['pratibha.kamath@example.com'] || citizen;
  const lancelot = usersMap['lancelot.pinto@example.com'] || citizen;
  const roopa = usersMap['roopa.kotian@example.com'] || citizen;
  const naveen = usersMap['naveen.suvarna@example.com'] || citizen;
  const harish = usersMap['harish.kulal@example.com'] || citizen;
  const meenakshi = usersMap['meenakshi.pai@example.com'] || citizen;
  const faizal = usersMap['faizal.khan@example.com'] || citizen;

  const admin = usersMap['admin@resqmangaluru.org'];
  const kavitha = usersMap['responder@resqmangaluru.org'];
  const farooq = usersMap['farooq@resqmangaluru.org'];
  const rajesh = usersMap['rajesh.poojary@example.com'] || kavitha;
  const sneha = usersMap['sneha.alva@example.com'] || kavitha;
  const ganesh = usersMap['ganesh.naik@example.com'] || farooq;
  const preethi = usersMap['preethi.dsouza@example.com'] || kavitha;
  const anand = usersMap['anand.mendonca@example.com'] || rajesh;
  const shankar = usersMap['shankar.salian@example.com'] || farooq;

  const now = Date.now();
  const hoursAgo = (h) => new Date(now - h * 3600000);

  return [
    // 1. Jeppu Kudupady Flood
    {
      title: 'Severe Waterlogging & Inundation in Jeppu Kudupady',
      description: 'Netravati river backflow and continuous downpour inundated low-lying settlements near Jeppu Kudupady. Evacuation assistance required for 14 marooned residents.',
      category: 'Flood',
      severity: 'High',
      status: 'Rescue in Progress',
      location: {
        address: 'Jeppu Kudupady, Mangaluru, Karnataka',
        latitude: 12.8510,
        longitude: 74.8580
      },
      reportedBy: abdul._id,
      reporterName: abdul.name,
      contactPhone: abdul.phone,
      assignedResponder: kavitha._id,
      assignedResponderName: kavitha.name,
      statusHistory: [
        { status: 'Reported', changedBy: abdul._id, changedByName: abdul.name, comment: 'Resident reported flash flood water entering compound.', timestamp: hoursAgo(5) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Admin verified with local municipal ward officer.', timestamp: hoursAgo(4) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Assigned NDRF squad lead Kavitha Shenoy.', timestamp: hoursAgo(3) },
        { status: 'Rescue in Progress', changedBy: kavitha._id, changedByName: kavitha.name, comment: 'Two inflatable Gemini boats deployed. Evacuees shifted to Town Hall shelter.', timestamp: hoursAgo(1) }
      ],
      isDemoData: true
    },
    // 2. Gurupura Ghat Landslide
    {
      title: 'Landslide Debris Blocking Gurupura Link Road',
      description: 'Massive mudslide along hilly curve blocking two vehicular lanes. Critical road clearance required for ambulance transit.',
      category: 'Landslide',
      severity: 'High',
      status: 'Rescue in Progress',
      location: {
        address: 'Gurupura Ghat Section, Mangaluru, Karnataka',
        latitude: 12.9348,
        longitude: 74.9312
      },
      reportedBy: citizen._id,
      reporterName: citizen.name,
      contactPhone: citizen.phone,
      assignedResponder: anand._id,
      assignedResponderName: anand.name,
      statusHistory: [
        { status: 'Reported', changedBy: citizen._id, changedByName: citizen.name, comment: 'Commuter reported hillside collapse.', timestamp: hoursAgo(6) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'High priority road clearance alert dispatched.', timestamp: hoursAgo(4) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Assigned Anand Mendonca with heavy earthmovers.', timestamp: hoursAgo(3) },
        { status: 'Rescue in Progress', changedBy: anand._id, changedByName: anand.name, comment: 'JCBs operating on site. One lane cleared for light vehicles.', timestamp: hoursAgo(1) }
      ],
      isDemoData: true
    },
    // 3. Bejai Transformer Tree Fall
    {
      title: 'Tree Fall on Electric Transformer in Bejai',
      description: 'Heavy rain gusts uprooted an old banyan tree branch directly onto a high voltage transformer. Sparks observed with area-wide blackout.',
      category: 'Heavy rainfall',
      severity: 'High',
      status: 'Reported',
      location: {
        address: 'Bejai Main Road, near KSRTC Bus Stand, Mangaluru',
        latitude: 12.8856,
        longitude: 74.8471
      },
      reportedBy: pratibha._id,
      reporterName: pratibha.name,
      contactPhone: pratibha.phone,
      assignedResponder: null,
      assignedResponderName: '',
      statusHistory: [
        { status: 'Reported', changedBy: pratibha._id, changedByName: pratibha.name, comment: 'Resident called emergency desk reporting sparks and sparks near bus terminal.', timestamp: hoursAgo(2) }
      ],
      isDemoData: true
    },
    // 4. Panambur Sea Wall Vessel Distress
    {
      title: 'Fishing Vessel Stranded Near Panambur Sea Wall',
      description: 'Trawler engine failed in rough monsoonal sea with 3.5m swell. 4 local fishermen on board calling for coastal tow.',
      category: 'Accident',
      severity: 'Critical',
      status: 'Responder Assigned',
      location: {
        address: 'Panambur Port Reach, Mangaluru, Karnataka',
        latitude: 12.9515,
        longitude: 74.8080
      },
      reportedBy: roopa._id,
      reporterName: roopa.name,
      contactPhone: roopa.phone,
      assignedResponder: farooq._id,
      assignedResponderName: farooq.name,
      statusHistory: [
        { status: 'Reported', changedBy: roopa._id, changedByName: roopa.name, comment: 'Coast guard tower relayed SOS beacon distress coordinates.', timestamp: hoursAgo(4) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Critical naval maritime emergency acknowledged.', timestamp: hoursAgo(3) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Mobilized Mohammad Farooq and coastal rescue launch.', timestamp: hoursAgo(2) }
      ],
      isDemoData: true
    },
    // 5. Hampankatta Kitchen Fire
    {
      title: 'Short Circuit Kitchen Fire Extinguished in Hampankatta',
      description: 'Commercial kitchen gas pipeline spark brought under swift control by district fire engines. No civilian casualties.',
      category: 'Fire',
      severity: 'Low',
      status: 'Resolved',
      location: {
        address: 'KS Rao Road, Hampankatta, Mangaluru',
        latitude: 12.8710,
        longitude: 74.8435
      },
      reportedBy: citizen._id,
      reporterName: citizen.name,
      contactPhone: citizen.phone,
      assignedResponder: rajesh._id,
      assignedResponderName: rajesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: citizen._id, changedByName: citizen.name, comment: 'Restaurant owner raised alarm.', timestamp: hoursAgo(24) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Pandeshwar Fire station alerted.', timestamp: hoursAgo(23) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Rajesh Poojary tender unit dispatched.', timestamp: hoursAgo(22) },
        { status: 'Rescue in Progress', changedBy: rajesh._id, changedByName: rajesh.name, comment: 'Fire extinguished using chemical foam.', timestamp: hoursAgo(21) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Site inspected and declared safe. Incident closed.', timestamp: hoursAgo(18) }
      ],
      isDemoData: true
    },
    // 6. Ullal Sea Erosion
    {
      title: 'Severe Coastal Sea Erosion at Ullal Kotepura',
      description: 'Wave surges breached rock revetment wall, washing sand beneath 3 beachfront residential cottages. Urgent evacuation of families needed.',
      category: 'Flood',
      severity: 'Critical',
      status: 'Rescue in Progress',
      location: {
        address: 'Kotepura Beach Road, Ullal, Mangaluru',
        latitude: 12.8050,
        longitude: 74.8490
      },
      reportedBy: naveen._id,
      reporterName: naveen.name,
      contactPhone: naveen.phone,
      assignedResponder: ganesh._id,
      assignedResponderName: ganesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: naveen._id, changedByName: naveen.name, comment: 'Tidal waves breached concrete revetment.', timestamp: hoursAgo(8) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Emergency evacuation order issued for coastal row.', timestamp: hoursAgo(7) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Ganesh Naik lifeguard team dispatched with sandbags.', timestamp: hoursAgo(6) },
        { status: 'Rescue in Progress', changedBy: ganesh._id, changedByName: ganesh.name, comment: '18 family members sheltered at Ullal Flood Relief Shelter.', timestamp: hoursAgo(2) }
      ],
      isDemoData: true
    },
    // 7. Kankanady Traffic Accident Multi-Vehicle Collision
    {
      title: 'Multi-Vehicle Collision in Heavy Rain near Kankanady Pumpwell',
      description: 'Tanker skidded on wet flyover down-ramp, impacting two autos and a passenger car. 3 commuters trapped with fractures.',
      category: 'Accident',
      severity: 'Critical',
      status: 'Rescue in Progress',
      location: {
        address: 'Pumpwell Circle Flyover, Kankanady, Mangaluru',
        latitude: 12.8650,
        longitude: 74.8640
      },
      reportedBy: harish._id,
      reporterName: harish.name,
      contactPhone: harish.phone,
      assignedResponder: sneha._id,
      assignedResponderName: sneha.name,
      statusHistory: [
        { status: 'Reported', changedBy: harish._id, changedByName: harish.name, comment: 'Passersby called 112 reporting multiple injured commuters.', timestamp: hoursAgo(3) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Red alert trauma call dispatched to Father Muller & Wenlock ambulances.', timestamp: hoursAgo(2.5) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Assigned Paramedic Dr. Sneha Alva and ambulance fleet.', timestamp: hoursAgo(2) },
        { status: 'Rescue in Progress', changedBy: sneha._id, changedByName: sneha.name, comment: '2 patients stabilized and rushed to emergency trauma ward.', timestamp: hoursAgo(0.5) }
      ],
      isDemoData: true
    },
    // 8. Surathkal NITK Underpass Flooding
    {
      title: 'Surathkal National Highway Underpass Submerged',
      description: 'Highway underpass flooded with 4 feet of rainwater after stormwater drain clogged with silt. Bus stranded with 22 passengers.',
      category: 'Flood',
      severity: 'High',
      status: 'Acknowledged',
      location: {
        address: 'NITK Highway Underpass, Surathkal, Mangaluru',
        latitude: 13.0075,
        longitude: 74.7940
      },
      reportedBy: roopa._id,
      reporterName: roopa.name,
      contactPhone: roopa.phone,
      assignedResponder: null,
      assignedResponderName: '',
      statusHistory: [
        { status: 'Reported', changedBy: roopa._id, changedByName: roopa.name, comment: 'Driver called stating vehicle stalled in deep water.', timestamp: hoursAgo(2) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Municipal pumping squad and towing crane alerted.', timestamp: hoursAgo(1) }
      ],
      isDemoData: true
    },
    // 9. Kadri Hills Mudslip Near Residential Area
    {
      title: 'Kadri Hills Retaining Wall Fracture & Mudslip',
      description: 'Heavy precipitation caused minor retaining wall crack on Kadri Hill slope. Loose boulders threaten 2 houses below.',
      category: 'Landslide',
      severity: 'Medium',
      status: 'Reported',
      location: {
        address: 'Kadri Temple Hill Road, Mallikatta, Mangaluru',
        latitude: 12.8885,
        longitude: 74.8635
      },
      reportedBy: sunita._id,
      reporterName: sunita.name,
      contactPhone: sunita.phone,
      assignedResponder: null,
      assignedResponderName: '',
      statusHistory: [
        { status: 'Reported', changedBy: sunita._id, changedByName: sunita.name, comment: 'Resident observed small boulders rolling into yard.', timestamp: hoursAgo(1.5) }
      ],
      isDemoData: true
    },
    // 10. Bolar River Estuary Fisherman Rescue
    {
      title: 'Capsize of Small Fiber Dinghy near Bolar Estuary',
      description: 'Fiber dinghy overturned in strong river current near Netravati confluence. Two fishermen clinging to wooden jetty poles.',
      category: 'Medical emergency',
      severity: 'Critical',
      status: 'Resolved',
      location: {
        address: 'Netravati Estuary View, Bolar, Mangaluru',
        latitude: 12.8450,
        longitude: 74.8380
      },
      reportedBy: lancelot._id,
      reporterName: lancelot.name,
      contactPhone: lancelot.phone,
      assignedResponder: shankar._id,
      assignedResponderName: shankar.name,
      statusHistory: [
        { status: 'Reported', changedBy: lancelot._id, changedByName: lancelot.name, comment: 'Eye witness signaled distress from river bank.', timestamp: hoursAgo(14) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Harbor patrol alerted.', timestamp: hoursAgo(13.5) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Shankar Salian mobilized patrol boat.', timestamp: hoursAgo(13) },
        { status: 'Rescue in Progress', changedBy: shankar._id, changedByName: shankar.name, comment: 'Both fishermen hauled aboard and administered first aid.', timestamp: hoursAgo(12) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Both rescued individuals checked by paramedics and reunited with family.', timestamp: hoursAgo(10) }
      ],
      isDemoData: true
    },
    // 11. Pandeshwar Commercial Complex Electrical Hazard
    {
      title: 'Water Seepage into Basement Electrical Panel in Pandeshwar',
      description: 'Stormwater seepage filled commercial building basement to 2 feet, submerging main switchgear panel. Arcing risks.',
      category: 'Fire',
      severity: 'Medium',
      status: 'Responder Assigned',
      location: {
        address: 'Pandeshwar Main Road, near Forum Mall, Mangaluru',
        latitude: 12.8625,
        longitude: 74.8395
      },
      reportedBy: faizal._id,
      reporterName: faizal.name,
      contactPhone: faizal.phone,
      assignedResponder: rajesh._id,
      assignedResponderName: rajesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: faizal._id, changedByName: faizal.name, comment: 'Building security guard reported smoke and water in meter room.', timestamp: hoursAgo(3) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'MESCOM electricity grid cutoff requested.', timestamp: hoursAgo(2) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Rajesh Poojary fire inspector dispatched to isolate hazard.', timestamp: hoursAgo(1) }
      ],
      isDemoData: true
    },
    // 12. Car Street Bunder Old Building Partial Collapse
    {
      title: 'Old Tiled Roof Veranda Collapse in Car Street Bunder',
      description: 'Continuous rains softened load-bearing mud walls of a 70-year-old shopfront veranda, collapsing tiles onto pavement.',
      category: 'Other emergency',
      severity: 'Medium',
      status: 'Resolved',
      location: {
        address: 'Car Street, Bunder, Mangaluru',
        latitude: 12.8660,
        longitude: 74.8350
      },
      reportedBy: faizal._id,
      reporterName: faizal.name,
      contactPhone: faizal.phone,
      assignedResponder: rajesh._id,
      assignedResponderName: rajesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: faizal._id, changedByName: faizal.name, comment: 'Shopkeeper reported roof collapse.', timestamp: hoursAgo(30) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Barricading squad deployed.', timestamp: hoursAgo(29) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Assigned Rajesh Poojary for structural inspection.', timestamp: hoursAgo(28) },
        { status: 'Rescue in Progress', changedBy: rajesh._id, changedByName: rajesh.name, comment: 'Debris cleared and danger zone cordoned off.', timestamp: hoursAgo(26) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Municipal structural engineer issued safety certificate. All cleared.', timestamp: hoursAgo(20) }
      ],
      isDemoData: true
    },
    // 13. Mannagudda Drainage Overflow
    {
      title: 'Severe Storm Sewer Clogging and Backflow in Mannagudda',
      description: 'Plastic waste clogged culvert causing sewage and rain water to spill onto residential road, entering 4 basements.',
      category: 'Heavy rainfall',
      severity: 'Medium',
      status: 'Acknowledged',
      location: {
        address: 'Mannagudda Road, near Gandhinagar, Mangaluru',
        latitude: 12.8790,
        longitude: 74.8360
      },
      reportedBy: meenakshi._id,
      reporterName: meenakshi.name,
      contactPhone: meenakshi.phone,
      assignedResponder: null,
      assignedResponderName: '',
      statusHistory: [
        { status: 'Reported', changedBy: meenakshi._id, changedByName: meenakshi.name, comment: 'Resident welfare association submitted urgent sewer clearing plea.', timestamp: hoursAgo(4) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Dispatched notification to Mangaluru City Corporation drainage jetting team.', timestamp: hoursAgo(2.5) }
      ],
      isDemoData: true
    },
    // 14. Kulur Bridge Inundation
    {
      title: 'Phalguni River Overflow Flooding Highway near Kulur Bridge',
      description: 'Phalguni (Gurupura) river level crossed danger mark under heavy upstream catchment rains. Road shoulder submerged by 1.5 ft.',
      category: 'Flood',
      severity: 'Critical',
      status: 'Responder Assigned',
      location: {
        address: 'Kulur Bridge, NH 66, Mangaluru',
        latitude: 12.9230,
        longitude: 74.8235
      },
      reportedBy: citizen._id,
      reporterName: citizen.name,
      contactPhone: citizen.phone,
      assignedResponder: kavitha._id,
      assignedResponderName: kavitha.name,
      statusHistory: [
        { status: 'Reported', changedBy: citizen._id, changedByName: citizen.name, comment: 'Traffic police reported river water creeping onto northbound highway lanes.', timestamp: hoursAgo(5) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'District Disaster Management Authority issued traffic advisory.', timestamp: hoursAgo(4) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Kavitha Shenoy and NDRF flood surveillance unit deployed.', timestamp: hoursAgo(2.5) }
      ],
      isDemoData: true
    },
    // 15. Urwa Market Lightning Strike
    {
      title: 'Lightning Strike Damaged Mobile Cell Tower in Urwa',
      description: 'Direct lightning strike tripped transformer and set battery backup rack on fire. Structural tower cables intact but electronics burnt.',
      category: 'Fire',
      severity: 'Low',
      status: 'Resolved',
      location: {
        address: 'Urwa Store Junction, Mangaluru',
        latitude: 12.8940,
        longitude: 74.8365
      },
      reportedBy: pratibha._id,
      reporterName: pratibha.name,
      contactPhone: pratibha.phone,
      assignedResponder: preethi._id,
      assignedResponderName: preethi.name,
      statusHistory: [
        { status: 'Reported', changedBy: pratibha._id, changedByName: pratibha.name, comment: 'Loud thunderclap followed by fire in rooftop battery cabinet.', timestamp: hoursAgo(40) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Fire brigade and civil defense alerted.', timestamp: hoursAgo(39) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Preethi D’Souza coordinated perimeter safety.', timestamp: hoursAgo(38) },
        { status: 'Rescue in Progress', changedBy: preethi._id, changedByName: preethi.name, comment: 'CO2 extinguishers deployed. Fire doused in 20 minutes.', timestamp: hoursAgo(37) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Cellular engineer replaced faulty units and certified safety.', timestamp: hoursAgo(30) }
      ],
      isDemoData: true
    },
    // 16. Baikampady Industrial Chemical Sump Leak Alert
    {
      title: 'Effluent Sump Water Infiltration in Baikampady Industrial Area',
      description: 'Flash rains flooded containment dike of processing unit. Diluted chemical slurry overflowing toward storm drainage.',
      category: 'Other emergency',
      severity: 'High',
      status: 'Rescue in Progress',
      location: {
        address: 'Baikampady Industrial Estate 4th Cross, Mangaluru',
        latitude: 12.9420,
        longitude: 74.8150
      },
      reportedBy: faizal._id,
      reporterName: faizal.name,
      contactPhone: faizal.phone,
      assignedResponder: rajesh._id,
      assignedResponderName: rajesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: faizal._id, changedByName: faizal.name, comment: 'Factory security supervisor raised emergency siren.', timestamp: hoursAgo(6) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Pollution Control Board and SDRF HAZMAT alerted.', timestamp: hoursAgo(5) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Rajesh Poojary leading containment and neutralization.', timestamp: hoursAgo(4) },
        { status: 'Rescue in Progress', changedBy: rajesh._id, changedByName: rajesh.name, comment: 'Sand dykes constructed and lime neutralizing agent applied.', timestamp: hoursAgo(1) }
      ],
      isDemoData: true
    },
    // 17. Ullal Someshwar High Waves Lifeguard Alert
    {
      title: 'High Tidal Waves Threatening Fishing Shacks at Someshwar Beach',
      description: 'Spring tide coupled with monsoonal depression causing waves exceeding 4 meters. Fishermen requiring support to haul catamarans to safety.',
      category: 'Heavy rainfall',
      severity: 'Medium',
      status: 'Responder Assigned',
      location: {
        address: 'Someshwar Beach Road, Ullal, Mangaluru',
        latitude: 12.7930,
        longitude: 74.8560
      },
      reportedBy: naveen._id,
      reporterName: naveen.name,
      contactPhone: naveen.phone,
      assignedResponder: ganesh._id,
      assignedResponderName: ganesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: naveen._id, changedByName: naveen.name, comment: 'Community leader requested mechanical winches to save fishing gear.', timestamp: hoursAgo(4) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Fisheries department notified.', timestamp: hoursAgo(3) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Ganesh Naik lifeguard team assigned with tow winches.', timestamp: hoursAgo(1.5) }
      ],
      isDemoData: true
    },
    // 18. Derebail Sloping Earth Movement
    {
      title: 'Retaining Wall Bulge near Apartment Complex in Derebail',
      description: 'Terraced garden retaining wall shows 30cm tilt following 48-hour continuous rainfall. 12 residents evacuated as precaution.',
      category: 'Landslide',
      severity: 'Medium',
      status: 'Acknowledged',
      location: {
        address: 'Derebail Konchady Hill Road, Mangaluru',
        latitude: 12.9125,
        longitude: 74.8525
      },
      reportedBy: sunita._id,
      reporterName: sunita.name,
      contactPhone: sunita.phone,
      assignedResponder: null,
      assignedResponderName: '',
      statusHistory: [
        { status: 'Reported', changedBy: sunita._id, changedByName: sunita.name, comment: 'Residents association committee flagged structural hazard.', timestamp: hoursAgo(3) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Structural stability engineer requested on site.', timestamp: hoursAgo(2) }
      ],
      isDemoData: true
    },
    // 19. Bolar Boat Jetty Fuel Spillage Containment
    {
      title: 'Diesel Fuel Sheen on Water at Bolar Fish Jetty',
      description: 'Ruptured fueling hose discharged approx 150L diesel into harbor basin. Fire and environmental risks.',
      category: 'Fire',
      severity: 'Low',
      status: 'Resolved',
      location: {
        address: 'Bolar Wharf, Mangaluru',
        latitude: 12.8480,
        longitude: 74.8360
      },
      reportedBy: lancelot._id,
      reporterName: lancelot.name,
      contactPhone: lancelot.phone,
      assignedResponder: shankar._id,
      assignedResponderName: shankar.name,
      statusHistory: [
        { status: 'Reported', changedBy: lancelot._id, changedByName: lancelot.name, comment: 'Port worker raised leak alarm.', timestamp: hoursAgo(50) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Oil spill response team notified.', timestamp: hoursAgo(49) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Shankar Salian deployed absorbent containment booms.', timestamp: hoursAgo(48) },
        { status: 'Rescue in Progress', changedBy: shankar._id, changedByName: shankar.name, comment: 'Booms encircled spill. Skimmer recovered oil.', timestamp: hoursAgo(46) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Water test clean. Jetty reopened for fishing craft.', timestamp: hoursAgo(36) }
      ],
      isDemoData: true
    },
    // 20. Surathkal Beach Drowning Rescue
    {
      title: 'Two College Students Swept by Rip Current at Surathkal Beach',
      description: 'Tourists ventured into treacherous monsoonal surf near NITK lighthouse and were dragged into rip current.',
      category: 'Medical emergency',
      severity: 'Critical',
      status: 'Resolved',
      location: {
        address: 'NITK Lighthouse Beach, Surathkal, Mangaluru',
        latitude: 13.0040,
        longitude: 74.7890
      },
      reportedBy: roopa._id,
      reporterName: roopa.name,
      contactPhone: roopa.phone,
      assignedResponder: farooq._id,
      assignedResponderName: farooq.name,
      statusHistory: [
        { status: 'Reported', changedBy: roopa._id, changedByName: roopa.name, comment: 'Lifeguard tower sounded alarm.', timestamp: hoursAgo(48) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Emergency response activated.', timestamp: hoursAgo(47.5) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Mohammad Farooq and rescue boat team dispatched.', timestamp: hoursAgo(47) },
        { status: 'Rescue in Progress', changedBy: farooq._id, changedByName: farooq.name, comment: 'Both swimmers pulled onto rescue watercraft; CPR performed successfully on one.', timestamp: hoursAgo(46) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Both patients treated at hospital and discharged in stable condition.', timestamp: hoursAgo(24) }
      ],
      isDemoData: true
    },
    // 21. Hampankatta Water Mains Burst
    {
      title: 'Water Supply Pipeline Burst Causing Road Cavity in Hampankatta',
      description: 'Underground high-pressure water pipe burst undermined asphalt road foundation, forming a 4-meter wide sinkhole near Central Market.',
      category: 'Other emergency',
      severity: 'High',
      status: 'Rescue in Progress',
      location: {
        address: 'Market Road, Hampankatta, Mangaluru',
        latitude: 12.8700,
        longitude: 74.8415
      },
      reportedBy: citizen._id,
      reporterName: citizen.name,
      contactPhone: citizen.phone,
      assignedResponder: anand._id,
      assignedResponderName: anand.name,
      statusHistory: [
        { status: 'Reported', changedBy: citizen._id, changedByName: citizen.name, comment: 'Traffic police alerted command regarding road sinkhole.', timestamp: hoursAgo(6) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'City Corporation water works and traffic diversion alerted.', timestamp: hoursAgo(5) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Anand Mendonca deployed with backhoe and gravel trucks.', timestamp: hoursAgo(4) },
        { status: 'Rescue in Progress', changedBy: anand._id, changedByName: anand.name, comment: 'Valve shut off. Backfilling cavity in progress.', timestamp: hoursAgo(2) }
      ],
      isDemoData: true
    },
    // 22. Kadri Park Tree Fall Blocking Ambulance Route
    {
      title: 'Gulmohar Tree Uprooted across Kadri Park Ambulance Corridor',
      description: 'Large gulmohar tree fell across the two-lane road connecting Kadri to AJ Hospital, halting ambulance movements.',
      category: 'Heavy rainfall',
      severity: 'High',
      status: 'Resolved',
      location: {
        address: 'Kadri Park Road, Mangaluru',
        latitude: 12.8890,
        longitude: 74.8580
      },
      reportedBy: sunita._id,
      reporterName: sunita.name,
      contactPhone: sunita.phone,
      assignedResponder: anand._id,
      assignedResponderName: anand.name,
      statusHistory: [
        { status: 'Reported', changedBy: sunita._id, changedByName: sunita.name, comment: 'Ambulance driver called district helpline.', timestamp: hoursAgo(16) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Rapid tree clearance squad mobilized.', timestamp: hoursAgo(15.5) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Anand Mendonca dispatched with hydraulic chainsaws.', timestamp: hoursAgo(15) },
        { status: 'Rescue in Progress', changedBy: anand._id, changedByName: anand.name, comment: 'Trunk sectioned and hauled off roadway.', timestamp: hoursAgo(14) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Thoroughfare opened. All medical vehicles moving smoothly.', timestamp: hoursAgo(12) }
      ],
      isDemoData: true
    },
    // 23. Kankanady Elderly Patient Stranded by Flash Waterlogging
    {
      title: 'Elderly Bedridden Couple Stranded by Flash Water in Kankanady',
      description: 'Basement home waterlogged up to 3 feet in 30 minutes following cloudburst. Elderly couple unable to walk requires stretcher evacuation.',
      category: 'Medical emergency',
      severity: 'Critical',
      status: 'Rescue in Progress',
      location: {
        address: 'Gorigudda Cross, Kankanady, Mangaluru',
        latitude: 12.8580,
        longitude: 74.8600
      },
      reportedBy: harish._id,
      reporterName: harish.name,
      contactPhone: harish.phone,
      assignedResponder: sneha._id,
      assignedResponderName: sneha.name,
      statusHistory: [
        { status: 'Reported', changedBy: harish._id, changedByName: harish.name, comment: 'Neighbor reported rising water threatening bedridden resident.', timestamp: hoursAgo(3) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'High priority medical evacuation confirmed.', timestamp: hoursAgo(2.5) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Dr. Sneha Alva and paramedic crew deployed.', timestamp: hoursAgo(2) },
        { status: 'Rescue in Progress', changedBy: sneha._id, changedByName: sneha.name, comment: 'Patients safely brought to dry ground via floating stretcher. En route to St. Joseph shelter.', timestamp: hoursAgo(0.5) }
      ],
      isDemoData: true
    },
    // 24. Surathkal Industrial Pipeline Steam Leak
    {
      title: 'High Pressure Steam Pipeline Joint Failure in Surathkal',
      description: 'Corrosion aggravated by salt air caused joint breach in industrial processing steam pipe. Perimeter cordoned.',
      category: 'Accident',
      severity: 'Medium',
      status: 'Resolved',
      location: {
        address: 'MRPL Access Road, Surathkal, Mangaluru',
        latitude: 12.9980,
        longitude: 74.8100
      },
      reportedBy: roopa._id,
      reporterName: roopa.name,
      contactPhone: roopa.phone,
      assignedResponder: rajesh._id,
      assignedResponderName: rajesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: roopa._id, changedByName: roopa.name, comment: 'Security alerted regarding hissing high pressure plume.', timestamp: hoursAgo(60) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Emergency shutoff verified.', timestamp: hoursAgo(59) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Rajesh Poojary dispatched for perimeter exclusion zone.', timestamp: hoursAgo(58) },
        { status: 'Rescue in Progress', changedBy: rajesh._id, changedByName: rajesh.name, comment: 'Manual isolation valve closed. Steam dissipated.', timestamp: hoursAgo(56) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Joint welded and pressure tested. All clear.', timestamp: hoursAgo(45) }
      ],
      isDemoData: true
    },
    // 25. Jeppu Morgans Gate Inundated Footbridge
    {
      title: 'Pedestrian Footbridge Submerged at Morgans Gate Jeppu',
      description: 'Stream swollen with monsoon flood waters submerged the low pedestrian footbridge used by school children and workers.',
      category: 'Flood',
      severity: 'Medium',
      status: 'Reported',
      location: {
        address: 'Morgans Gate, Jeppu, Mangaluru',
        latitude: 12.8485,
        longitude: 74.8495
      },
      reportedBy: abdul._id,
      reporterName: abdul.name,
      contactPhone: abdul.phone,
      assignedResponder: null,
      assignedResponderName: '',
      statusHistory: [
        { status: 'Reported', changedBy: abdul._id, changedByName: abdul.name, comment: 'Citizen requested safety warning tape and guard placement.', timestamp: hoursAgo(1) }
      ],
      isDemoData: true
    },
    // 26. Bejai KSRTC Terminal Roof Leakage & Water Pooling
    {
      title: 'Extensive Water Inundation in KSRTC Terminal Passenger Waiting Hall',
      description: 'Rain runoff from elevated highway flooded the departure lounge with 6 inches of water, impacting passenger transit.',
      category: 'Heavy rainfall',
      severity: 'Low',
      status: 'Acknowledged',
      location: {
        address: 'KSRTC Central Bus Station, Bejai, Mangaluru',
        latitude: 12.8845,
        longitude: 74.8465
      },
      reportedBy: pratibha._id,
      reporterName: pratibha.name,
      contactPhone: pratibha.phone,
      assignedResponder: null,
      assignedResponderName: '',
      statusHistory: [
        { status: 'Reported', changedBy: pratibha._id, changedByName: pratibha.name, comment: 'Passenger reported water logging inside main waiting concourse.', timestamp: hoursAgo(3) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Terminal maintenance engineer and water pump units dispatched.', timestamp: hoursAgo(2) }
      ],
      isDemoData: true
    },
    // 27. Bunder Old Port Grain Warehouse Flood Risk
    {
      title: 'Rising Estuary Tide Endangering Rice Godowns in Bunder',
      description: 'Tidal surge combined with river flood water approaching plinth level of district civil supplies godowns containing 500 tons of grain.',
      category: 'Flood',
      severity: 'High',
      status: 'Rescue in Progress',
      location: {
        address: 'Wharf Road, Bunder, Mangaluru',
        latitude: 12.8580,
        longitude: 74.8340
      },
      reportedBy: faizal._id,
      reporterName: faizal.name,
      contactPhone: faizal.phone,
      assignedResponder: shankar._id,
      assignedResponderName: shankar.name,
      statusHistory: [
        { status: 'Reported', changedBy: faizal._id, changedByName: faizal.name, comment: 'Warehouse manager requested emergency sandbag wall.', timestamp: hoursAgo(5) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Emergency mobilization order issued.', timestamp: hoursAgo(4) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Shankar Salian with civil defense volunteers dispatched.', timestamp: hoursAgo(3) },
        { status: 'Rescue in Progress', changedBy: shankar._id, changedByName: shankar.name, comment: '1,200 sandbags placed around godown perimeter. Water halted.', timestamp: hoursAgo(1) }
      ],
      isDemoData: true
    },
    // 28. Panambur Coastal Highway Slip
    {
      title: 'Shoulder Soil Erosion on NH 66 Near Panambur Flyover',
      description: 'Culvert blockage washed away 20 meters of earthen highway embankment. Left lane cordoned off for heavy vehicles.',
      category: 'Landslide',
      severity: 'Medium',
      status: 'Resolved',
      location: {
        address: 'NH 66 Panambur Highway Stretch, Mangaluru',
        latitude: 12.9480,
        longitude: 74.8120
      },
      reportedBy: roopa._id,
      reporterName: roopa.name,
      contactPhone: roopa.phone,
      assignedResponder: anand._id,
      assignedResponderName: anand.name,
      statusHistory: [
        { status: 'Reported', changedBy: roopa._id, changedByName: roopa.name, comment: 'Highway patrol reported embankment erosion.', timestamp: hoursAgo(72) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'NHAI highway engineer alerted.', timestamp: hoursAgo(71) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Anand Mendonca dispatched with stone pitching crew.', timestamp: hoursAgo(70) },
        { status: 'Rescue in Progress', changedBy: anand._id, changedByName: anand.name, comment: 'Heavy boulders and geotextile sheets installed.', timestamp: hoursAgo(65) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Embankment stabilized and paved. Both lanes fully operational.', timestamp: hoursAgo(40) }
      ],
      isDemoData: true
    },
    // 29. Pandeshwar Residential Compound Wall Collapse
    {
      title: 'Compound Wall Collapsed onto Parked Vehicles in Pandeshwar',
      description: 'Water pressure from adjoining elevated plot collapsed a 15-foot brick compound wall onto two parked cars.',
      category: 'Accident',
      severity: 'Low',
      status: 'Resolved',
      location: {
        address: 'Pandeshwar Police Lane, Mangaluru',
        latitude: 12.8605,
        longitude: 74.8385
      },
      reportedBy: faizal._id,
      reporterName: faizal.name,
      contactPhone: faizal.phone,
      assignedResponder: rajesh._id,
      assignedResponderName: rajesh.name,
      statusHistory: [
        { status: 'Reported', changedBy: faizal._id, changedByName: faizal.name, comment: 'Vehicle owner reported wall collapse.', timestamp: hoursAgo(36) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Local police and fire personnel alerted.', timestamp: hoursAgo(35) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Rajesh Poojary dispatched to supervise extraction.', timestamp: hoursAgo(34) },
        { status: 'Rescue in Progress', changedBy: rajesh._id, changedByName: rajesh.name, comment: 'Debris lifted with crane. No fuel leakage found.', timestamp: hoursAgo(32) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Vehicles towed and area secured.', timestamp: hoursAgo(24) }
      ],
      isDemoData: true
    },
    // 30. Ullal Primary Health Center Power Outage
    {
      title: 'Generator Failure at Ullal Primary Health Clinic During Storm',
      description: 'Mains grid failure accompanied by automatic backup generator starter motor failure. Critical vaccine refrigerators need power.',
      category: 'Other emergency',
      severity: 'High',
      status: 'Resolved',
      location: {
        address: 'Ullal Health Center Road, Mangaluru',
        latitude: 74.8500, // will check coords
        latitude: 12.8060,
        longitude: 74.8520
      },
      reportedBy: naveen._id,
      reporterName: naveen.name,
      contactPhone: naveen.phone,
      assignedResponder: preethi._id,
      assignedResponderName: preethi.name,
      statusHistory: [
        { status: 'Reported', changedBy: naveen._id, changedByName: naveen.name, comment: 'Medical officer reported vaccine cold chain jeopardy.', timestamp: hoursAgo(20) },
        { status: 'Acknowledged', changedBy: admin._id, changedByName: admin.name, comment: 'Emergency mobile generator ordered to site.', timestamp: hoursAgo(19) },
        { status: 'Responder Assigned', changedBy: admin._id, changedByName: admin.name, comment: 'Preethi D’Souza coordinated mobile generator transit.', timestamp: hoursAgo(18.5) },
        { status: 'Rescue in Progress', changedBy: preethi._id, changedByName: preethi.name, comment: 'Mobile 25kVA generator coupled to hospital cold storage.', timestamp: hoursAgo(17) },
        { status: 'Resolved', changedBy: admin._id, changedByName: admin.name, comment: 'Power fully restored; all cold chain vaccines preserved at 4°C.', timestamp: hoursAgo(14) }
      ],
      isDemoData: true
    }
  ];
}

// --- 4. RELIEF DONATIONS DATA (22 Records) ---
// Validated: donationType enum, amount (> 0 for Monetary), itemsDescription, status enum
const DONATIONS_DATA = [
  {
    donorName: 'Mangaluru Rotary Welfare Club',
    isAnonymous: false,
    donorEmail: 'rotary.mangaluru@example.com',
    donorPhone: '+91 824 2420000',
    donationType: 'Monetary',
    amount: 150000,
    purpose: 'Monsoon Flood Relief Equipment Fund & Inflatable Boats',
    status: 'Received',
    administrativeNotes: 'Bank transfer verified for Dakshina Kannada Disaster Fund.',
    isDemoData: true
  },
  {
    donorName: 'Mangaluru Coastal Chamber of Commerce',
    isAnonymous: false,
    donorEmail: 'chamber.mng@example.com',
    donorPhone: '+91 824 2441122',
    donationType: 'Monetary',
    amount: 250000,
    purpose: 'Emergency Food Supplies & Shelter Upgrades',
    status: 'Received',
    administrativeNotes: 'Corporate social responsibility donation.',
    isDemoData: true
  },
  {
    donorName: 'Anonymous Philanthropist (Jeppu)',
    isAnonymous: true,
    donorEmail: '',
    donorPhone: '',
    donationType: 'Monetary',
    amount: 50000,
    purpose: 'Direct Medical Assistance for Displaced Families',
    status: 'Received',
    administrativeNotes: 'Anonymous contribution received via official gateway.',
    isDemoData: true
  },
  {
    donorName: 'KMC Alumni Association Worldwide',
    isAnonymous: false,
    donorEmail: 'kmc.alumni@example.com',
    donorPhone: '+91 824 2444555',
    donationType: 'Medical Kits',
    amount: 0,
    itemsDescription: '250 Comprehensive Emergency Trauma Packs, Antiseptic Dressings & IV Fluids',
    purpose: 'First responder immediate trauma and medical triage supplies',
    status: 'Distributed',
    administrativeNotes: 'Distributed to NDRF units, Kadri Shelter and Wenlock emergency desk.',
    isDemoData: true
  },
  {
    donorName: 'Coastal Karnataka Rice Millers Federation',
    isAnonymous: false,
    donorEmail: 'ricemillers.dk@example.com',
    donorPhone: '+91 824 2219988',
    donationType: 'Food & Ration',
    amount: 0,
    itemsDescription: '400 Bags of Boiled Rice (25kg each), 1,000 Packets Wheat Flour, 500L Cooking Oil',
    purpose: 'Ration supplies for Town Hall, Jeppu & Ullal community kitchens',
    status: 'Distributed',
    administrativeNotes: 'Delivered directly to Central Relief Depot, Hampankatta.',
    isDemoData: true
  },
  {
    donorName: 'Canara High School Alumni Relief Trust',
    isAnonymous: false,
    donorEmail: 'canara.relief@example.com',
    donorPhone: '+91 824 2498765',
    donationType: 'Clothing',
    amount: 0,
    itemsDescription: '600 Woolen Blankets, 350 Children Raincoats & 500 Sets of Dry Cotton Clothes',
    purpose: 'Immediate warmth and bedding for flood evacuees in low-lying zones',
    status: 'Received',
    administrativeNotes: 'Stocked at Kadri Community Shelter and Surathkal Shelter.',
    isDemoData: true
  },
  {
    donorName: 'Mangaluru Boat Owners & Fishermen Cooperative',
    isAnonymous: false,
    donorEmail: 'boatowners.bunder@example.com',
    donorPhone: '+91 824 2427890',
    donationType: 'Material / Relief Supplies',
    amount: 0,
    itemsDescription: '120 Heavy-Duty Life Jackets, 40 Lifebuoy Rings & 15 Waterproof Search Flashlights',
    purpose: 'Equipping volunteers and rescue squads for swift water operations',
    status: 'Received',
    administrativeNotes: 'Handed over to SDRF Commander Rajesh Poojary.',
    isDemoData: true
  },
  {
    donorName: 'Dr. Ashok & Rekha Shenoy Foundation',
    isAnonymous: false,
    donorEmail: 'shenoy.trust@example.com',
    donorPhone: '+91 824 2456677',
    donationType: 'Monetary',
    amount: 100000,
    purpose: 'Water Purification Tablets & Mobile Reverse Osmosis Plants',
    status: 'Received',
    administrativeNotes: 'Donated towards clean drinking water infrastructure.',
    isDemoData: true
  },
  {
    donorName: 'Anonymous Citizen (Kadri)',
    isAnonymous: true,
    donorEmail: '',
    donorPhone: '',
    donationType: 'Monetary',
    amount: 15000,
    purpose: 'Baby food and infant formula for shelter creches',
    status: 'Received',
    administrativeNotes: 'Cash receipt documented at District DC office desk.',
    isDemoData: true
  },
  {
    donorName: 'Mangalore Chemicals & Fertilizers (CSR Wing)',
    isAnonymous: false,
    donorEmail: 'mcf.csr@example.com',
    donorPhone: '+91 824 2407000',
    donationType: 'Material / Relief Supplies',
    amount: 0,
    itemsDescription: '5 Industrial De-watering Diesel Pumps (10 HP) and 500m Heavy Delivery Hose',
    purpose: 'Emergency water pumping from flooded residential basements and roads',
    status: 'Distributed',
    administrativeNotes: 'Deployed across Jeppu Kudupady and Pumpwell flood points.',
    isDemoData: true
  },
  {
    donorName: 'St. Aloysius College Student Council',
    isAnonymous: false,
    donorEmail: 'studentwelfare@sac.edu.example',
    donorPhone: '+91 824 2449700',
    donationType: 'Food & Ration',
    amount: 0,
    itemsDescription: '1,500 Ready-to-eat Disaster Meal Kits (Biscuits, Energy Bars, ORS, Water Pouches)',
    purpose: 'Field ration distribution to isolated citizens in waterlogged areas',
    status: 'Distributed',
    administrativeNotes: 'Distributed by college NSS volunteer brigade.',
    isDemoData: true
  },
  {
    donorName: 'Dakshina Kannada Wholesale Grocers Forum',
    isAnonymous: false,
    donorEmail: 'grocers.mng@example.com',
    donorPhone: '+91 824 2415500',
    donationType: 'Food & Ration',
    amount: 0,
    itemsDescription: '200 Bags of Lentils (Daal 50kg), 300 Bags of Sugar & Salt packets',
    purpose: 'Supply line sustenance for 5 designated civic shelters',
    status: 'Received',
    administrativeNotes: 'Warehoused at Bunder Food Depot.',
    isDemoData: true
  },
  {
    donorName: 'Apex Health Diagnostics Mangaluru',
    isAnonymous: false,
    donorEmail: 'apex.diag@example.com',
    donorPhone: '+91 824 2223400',
    donationType: 'Medical Kits',
    amount: 0,
    itemsDescription: '500 Rapid Diagnostic Malaria & Dengue Test Kits, 1,000 Paracetamol strips',
    purpose: 'Monsoon waterborne vector epidemic screening in relief shelters',
    status: 'Received',
    administrativeNotes: 'Dispatched to Wenlock public health inspection wing.',
    isDemoData: true
  },
  {
    donorName: 'Coastal Builders Association Mangaluru',
    isAnonymous: false,
    donorEmail: 'builders.mng@example.com',
    donorPhone: '+91 824 2439900',
    donationType: 'Material / Relief Supplies',
    amount: 0,
    itemsDescription: '5,000 Woven Sandbags and 80 rolls Heavy Geotextile Tarpaulin Sheets',
    purpose: 'Landslide slope stabilization and river bank bund reinforcement',
    status: 'Distributed',
    administrativeNotes: 'Used for Gurupura Link Road and Ullal Sea revetment.',
    isDemoData: true
  },
  {
    donorName: 'United Mangaluru Diaspora Association (UAE)',
    isAnonymous: false,
    donorEmail: 'uae.mangalureans@example.com',
    donorPhone: '+971 4 2990000',
    donationType: 'Monetary',
    amount: 500000,
    purpose: 'Dakshina Kannada District Flood Rehabilitation & Medical Rebuilding',
    status: 'Received',
    administrativeNotes: 'Foreign Inward Remittance Certificate verified through SBI.',
    isDemoData: true
  },
  {
    donorName: 'Kudla Bikers & Offroaders Club',
    isAnonymous: false,
    donorEmail: 'kudlabikers@example.com',
    donorPhone: '+91 98450 66554',
    donationType: 'Material / Relief Supplies',
    amount: 0,
    itemsDescription: '8 All-Terrain Winch Straps, 12 Waterproof Two-Way VHF Radios & GPS Trackers',
    purpose: 'High terrain communication and deep muddy road vehicle recovery',
    status: 'Received',
    administrativeNotes: 'Assigned to Anand Mendonca heavy response unit.',
    isDemoData: true
  },
  {
    donorName: 'Kallianpur Textile Mills',
    isAnonymous: false,
    donorEmail: 'kallianpur.textiles@example.com',
    donorPhone: '+91 820 2580100',
    donationType: 'Clothing',
    amount: 0,
    itemsDescription: '400 Cotton Bed Sheets, 800 Bath Towels and 300 Dhoti / Sarees sets',
    purpose: 'Emergency hygiene and clothing sets for coastal shelter inmates',
    status: 'Received',
    administrativeNotes: 'Transferred to Surathkal & Ullal relief shelters.',
    isDemoData: true
  },
  {
    donorName: 'Anonymous Merchant (Hampankatta)',
    isAnonymous: true,
    donorEmail: '',
    donorPhone: '',
    donationType: 'Monetary',
    amount: 30000,
    purpose: 'Emergency medicines and tetanus antitoxins for injured citizens',
    status: 'Received',
    administrativeNotes: 'Anonymous monetary support recorded.',
    isDemoData: true
  },
  {
    donorName: 'Father Muller Charitable Hospital Staff Guild',
    isAnonymous: false,
    donorEmail: 'fmc.staffguild@example.com',
    donorPhone: '+91 824 2238300',
    donationType: 'Monetary',
    amount: 75000,
    purpose: 'Pediatric care and nutritious milk supplements for shelter children',
    status: 'Received',
    administrativeNotes: 'Staff voluntary salary contribution for disaster mitigation.',
    isDemoData: true
  },
  {
    donorName: 'Prerana Women Self-Help Federation',
    isAnonymous: false,
    donorEmail: 'prerana.mng@example.com',
    donorPhone: '+91 824 2471188',
    donationType: 'Food & Ration',
    amount: 0,
    itemsDescription: '800 Jars of Homemade Pickles, Spice Blends and 500 Packets Dry Snacks',
    purpose: 'Shelter community kitchen meal additions',
    status: 'Pledged',
    administrativeNotes: 'Production batch in packing; delivery scheduled for tomorrow morning.',
    isDemoData: true
  },
  {
    donorName: 'Bunder Logistics Warehousing Ltd',
    isAnonymous: false,
    donorEmail: 'bunder.logistics@example.com',
    donorPhone: '+91 824 2419090',
    donationType: 'Monetary',
    amount: 120000,
    purpose: 'Emergency Fuel Subsidies for Rescue Boats & Mobile Pumps',
    status: 'Received',
    administrativeNotes: 'Fund allocated for Marine police and NDRF patrol vessel fuel.',
    isDemoData: true
  },
  {
    donorName: 'Mangaluru Techies Community Forum',
    isAnonymous: false,
    donorEmail: 'techies.mng@example.com',
    donorPhone: '+91 99000 11990',
    donationType: 'Monetary',
    amount: 60000,
    purpose: 'Emergency Solar Inverters and Battery Packs for Remote Shelters',
    status: 'Pledged',
    administrativeNotes: 'Crowdfunded amount pledged by local IT professionals.',
    isDemoData: true
  }
];

// --- 5. VOLUNTEER PROFILES DATA (18 Volunteers) ---
// Validated: skills array, availability enum, registeredUser and assignedIncident links where applicable
function getVolunteersData(usersMap, incidentsList) {
  const inc0 = incidentsList[0]; // Jeppu flood
  const inc1 = incidentsList[1]; // Gurupura landslide
  const inc3 = incidentsList[3]; // Panambur vessel
  const inc5 = incidentsList[5]; // Ullal sea erosion
  const inc6 = incidentsList[6]; // Kankanady accident

  return [
    {
      name: 'Aditya Hegde',
      email: 'aditya.hegde@example.com',
      phone: '+91 98450 11223',
      skills: ['First Aid', 'Swimming & Lifesaving', 'Search & Rescue'],
      availability: 'Available',
      areaOfOperation: 'Ullal & Bengre Coastal Zone',
      status: 'Active',
      registeredUser: usersMap['aditya.hegde@example.com']?._id || null,
      assignedIncident: inc5?._id || null,
      assignedIncidentTitle: inc5?.title || '',
      isDemoData: true
    },
    {
      name: 'Deepa Kamath',
      email: 'deepa.kamath@example.com',
      phone: '+91 94812 33445',
      skills: ['Medical Triage', 'Nursing & First Aid', 'Counseling'],
      availability: 'On Duty',
      areaOfOperation: 'Mangaluru City / Town Hall Shelter',
      status: 'Active',
      registeredUser: usersMap['deepa.kamath@example.com']?._id || null,
      assignedIncident: inc0?._id || null,
      assignedIncidentTitle: inc0?.title || '',
      isDemoData: true
    },
    {
      name: 'Roshan Pereira',
      email: 'roshan.p@example.com',
      phone: '+91 97401 55667',
      skills: ['Heavy Vehicle Driving', 'Debris Clearing', 'Logistics'],
      availability: 'Available',
      areaOfOperation: 'Kodialbail & Bejai',
      status: 'Active',
      registeredUser: usersMap['roshan.p@example.com']?._id || null,
      assignedIncident: inc1?._id || null,
      assignedIncidentTitle: inc1?.title || '',
      isDemoData: true
    },
    {
      name: 'Zeenath Banu',
      email: 'zeenath.b@example.com',
      phone: '+91 98860 77889',
      skills: ['Community Kitchen', 'Ration Distribution', 'Language Translation'],
      availability: 'Available',
      areaOfOperation: 'Bunder & Car Street',
      status: 'Active',
      registeredUser: usersMap['zeenath.b@example.com']?._id || null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Vikas Acharya',
      email: 'vikas.acharya@example.com',
      phone: '+91 94490 88990',
      skills: ['Drone Aerial Survey', 'HAM Radio Communication', 'GIS Mapping'],
      availability: 'On Duty',
      areaOfOperation: 'Surathkal & Panambur',
      status: 'Active',
      registeredUser: usersMap['vikas.acharya@example.com']?._id || null,
      assignedIncident: inc3?._id || null,
      assignedIncidentTitle: inc3?.title || '',
      isDemoData: true
    },
    {
      name: 'Dr. Nikhil Rao',
      email: 'nikhil.rao.vol@example.com',
      phone: '+91 98455 01020',
      skills: ['Emergency Medicine', 'Pediatric Care', 'Triage Assessment'],
      availability: 'On Duty',
      areaOfOperation: 'Kankanady & Pumpwell Corridor',
      status: 'Active',
      registeredUser: null,
      assignedIncident: inc6?._id || null,
      assignedIncidentTitle: inc6?.title || '',
      isDemoData: true
    },
    {
      name: 'Pooja Bhat',
      email: 'pooja.bhat.vol@example.com',
      phone: '+91 94811 12131',
      skills: ['Child Welfare', 'Psychological First Aid', 'Shelter Management'],
      availability: 'Available',
      areaOfOperation: 'Kadri & Mallikatta',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Mohammed Rizwan',
      email: 'm.rizwan.vol@example.com',
      phone: '+91 97402 23242',
      skills: ['Inflatable Boat Pilot', 'Swimmer', 'Swift Water Extraction'],
      availability: 'On Duty',
      areaOfOperation: 'Jeppu & Netravati Basin',
      status: 'Active',
      registeredUser: null,
      assignedIncident: inc0?._id || null,
      assignedIncidentTitle: inc0?.title || '',
      isDemoData: true
    },
    {
      name: 'Anjali Deshmukh',
      email: 'anjali.d.vol@example.com',
      phone: '+91 98863 34353',
      skills: ['Ambulance Co-pilot', 'First Aid', 'Patient Transport'],
      availability: 'Available',
      areaOfOperation: 'Pandeshwar & Bolar',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Ashwin Noronha',
      email: 'ashwin.n.vol@example.com',
      phone: '+91 94494 45464',
      skills: ['Electrician', 'Generator Maintenance', 'Temporary Lighting'],
      availability: 'Available',
      areaOfOperation: 'Bejai & Derebail',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Fatima Zahra',
      email: 'fatima.z.vol@example.com',
      phone: '+91 96115 56575',
      skills: ['Ration Packaging', 'Inventory Logging', 'Social Outreach'],
      availability: 'Available',
      areaOfOperation: 'Bunder Harbor & Wharf',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Chetan Poojary',
      email: 'chetan.p.vol@example.com',
      phone: '+91 99006 67686',
      skills: ['Debris Shoveling', 'Sandbagging', 'Physical Search Operations'],
      availability: 'Busy',
      areaOfOperation: 'Gurupura Ghat & Vamanjoor',
      status: 'Active',
      registeredUser: null,
      assignedIncident: inc1?._id || null,
      assignedIncidentTitle: inc1?.title || '',
      isDemoData: true
    },
    {
      name: 'Savita Suvarna',
      email: 'savita.s.vol@example.com',
      phone: '+91 99807 78797',
      skills: ['Community Health Worker', 'Elderly Care', 'Hygiene Kit Distribution'],
      availability: 'Available',
      areaOfOperation: 'Ullal Master Plan Zone',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Joel Rodrigues',
      email: 'joel.r.vol@example.com',
      phone: '+91 98458 89808',
      skills: ['4x4 Off-Road Driving', 'Towing', 'Equipment Transport'],
      availability: 'Available',
      areaOfOperation: 'Kodialbail & Ladyhill',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Rashmi Kulal',
      email: 'rashmi.k.vol@example.com',
      phone: '+91 94819 90919',
      skills: ['Data Entry & Coordination', 'Helpline Call Dispatch', 'Triage Logging'],
      availability: 'On Duty',
      areaOfOperation: 'DC Control Room, Bunder',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Manoj Kumar Salian',
      email: 'manoj.salian.vol@example.com',
      phone: '+91 97400 01021',
      skills: ['Lifeguard Certified', 'Coastal Patrol', 'Ocean Swimmer'],
      availability: 'Available',
      areaOfOperation: 'Panambur & Tannirbhavi',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Divya Nayak',
      email: 'divya.nayak.vol@example.com',
      phone: '+91 98861 12132',
      skills: ['Pharmacist', 'Medical Inventory', 'Sanitation Supervision'],
      availability: 'Available',
      areaOfOperation: 'Hampankatta & State Bank',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    },
    {
      name: 'Praveen D’Almeida',
      email: 'praveen.da.vol@example.com',
      phone: '+91 94492 23243',
      skills: ['Structural Safety Inspection', 'Water Pump Maintenance', 'Generator Mechanic'],
      availability: 'Available',
      areaOfOperation: 'Surathkal & Kulur',
      status: 'Active',
      registeredUser: null,
      assignedIncident: null,
      assignedIncidentTitle: '',
      isDemoData: true
    }
  ];
}

// --- 6. EMERGENCY ANNOUNCEMENTS & NOTIFICATIONS ---
function getNotificationsData(incidentsList) {
  const inc0 = incidentsList[0];
  const inc1 = incidentsList[1];

  return [
    {
      targetRole: 'all',
      title: '⚠️ IMD Heavy Rain Warning: Red Alert for Coastal Dakshina Kannada',
      message: 'Intense precipitation with strong coastal winds (45-55 km/h) forecasted for next 48 hours. Citizens in flood-prone riverine and low-lying zones advised to prepare emergency kits.',
      type: 'emergency'
    },
    {
      targetRole: 'admin',
      title: '🚨 High Priority: Jeppu Kudupady Flash Flood Rescue Underway',
      message: 'NDRF unit lead Kavitha Shenoy operating inflatable craft in flooded zone. 14 residents en route to Town Hall shelter.',
      type: 'emergency',
      incidentId: inc0?._id || null
    },
    {
      targetRole: 'all',
      title: '⛺ Town Hall & Kadri Relief Centers Fully Operational',
      message: 'Town Hall Evacuation Center and Kadri Community Hall are open 24/7 with cooked rations, medical desks, and backup power.',
      type: 'shelter'
    },
    {
      targetRole: 'responder',
      title: '⚠️ Traffic Advisory: Gurupura Ghat Section Blocked by Mudslide',
      message: 'Heavy machinery operator Anand Mendonca deployed for road clearance. Heavy vehicles diverted via alternate bypass.',
      type: 'emergency',
      incidentId: inc1?._id || null
    },
    {
      targetRole: 'all',
      title: 'ℹ️ High Sea Wave Advisory along Mangaluru Coastline',
      message: 'Tidal waves up to 3.8m expected along Ullal and Panambur beaches. Fishermen and beach visitors strictly advised to keep away from surf.',
      type: 'general'
    },
    {
      targetRole: 'all',
      title: '🤝 Volunteer Mobilization Call for Relief Camp Logistical Support',
      message: 'Registered volunteers with medical, nursing, and translation skills requested to report to the nearest ward nodal office.',
      type: 'volunteer'
    }
  ];
}

// --- MAIN SEED CONTROLLER ---
async function seedDatabase() {
  console.log('===============================================================');
  console.log('  ResQ Mangaluru — Realistic Database Seeding Operation');
  console.log('===============================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/disaster_relief_mangaluru';
  console.log(`[Config]: Connecting to MongoDB URI: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Database]: Successfully connected to database: "${mongoose.connection.name}"`);
  } catch (err) {
    console.error(`[Database Error]: Failed to connect to MongoDB: ${err.message}`);
    console.error('Please ensure the MongoDB service is running and accessible.');
    process.exit(1);
  }

  try {
    // 1. Seed Users (Admin, Responders, Citizens, Volunteers)
    console.log('\n--- 1. Seeding User Accounts (Idempotent by Email) ---');
    const usersMap = {};

    for (const u of USERS_DATA) {
      let existingUser = await User.findOne({ email: u.email.toLowerCase() });
      if (!existingUser) {
        // Create user with hashed password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.passwordRaw, salt);

        const newUser = await User.create({
          name: u.name,
          email: u.email.toLowerCase(),
          password: hashedPassword,
          role: u.role,
          phone: u.phone,
          address: u.address,
          availability: u.availability || 'Available',
          skills: u.skills || [],
          areaOfOperation: u.areaOfOperation || 'Mangaluru City',
          isVerified: true
        });
        usersMap[u.email.toLowerCase()] = newUser;
        SEED_SUMMARY.users.inserted++;
      } else {
        usersMap[u.email.toLowerCase()] = existingUser;
        SEED_SUMMARY.users.existing++;
      }
    }
    console.log(`Users: ${SEED_SUMMARY.users.inserted} inserted, ${SEED_SUMMARY.users.existing} existing preserved.`);

    // 2. Seed Shelters (Idempotent by Shelter Name)
    console.log('\n--- 2. Seeding Emergency Shelters (Idempotent by Name) ---');
    for (const s of SHELTERS_DATA) {
      // Validate occupancy does not exceed capacity
      if (s.occupancy > s.capacity) {
        s.occupancy = s.capacity;
      }
      const existingShelter = await Shelter.findOne({ name: s.name });
      if (!existingShelter) {
        await Shelter.create(s);
        SEED_SUMMARY.shelters.inserted++;
      } else {
        SEED_SUMMARY.shelters.existing++;
      }
    }
    console.log(`Shelters: ${SEED_SUMMARY.shelters.inserted} inserted, ${SEED_SUMMARY.shelters.existing} existing preserved.`);

    // 3. Seed Incidents (Idempotent by Title)
    console.log('\n--- 3. Seeding Emergency Incidents (Idempotent by Title) ---');
    const incidentsData = getIncidentsData(usersMap);
    const seededIncidentsList = [];

    for (const inc of incidentsData) {
      let existingInc = await Incident.findOne({ title: inc.title });
      if (!existingInc) {
        const created = await Incident.create(inc);
        seededIncidentsList.push(created);
        SEED_SUMMARY.incidents.inserted++;
      } else {
        seededIncidentsList.push(existingInc);
        SEED_SUMMARY.incidents.existing++;
      }
    }
    console.log(`Incidents: ${SEED_SUMMARY.incidents.inserted} inserted, ${SEED_SUMMARY.incidents.existing} existing preserved.`);

    // 4. Seed Donations (Idempotent by Donor Name + Purpose)
    console.log('\n--- 4. Seeding Relief Donations (Idempotent by Donor + Purpose) ---');
    for (const d of DONATIONS_DATA) {
      const existingDonation = await Donation.findOne({
        donorName: d.donorName,
        purpose: d.purpose
      });
      if (!existingDonation) {
        await Donation.create(d);
        SEED_SUMMARY.donations.inserted++;
      } else {
        SEED_SUMMARY.donations.existing++;
      }
    }
    console.log(`Donations: ${SEED_SUMMARY.donations.inserted} inserted, ${SEED_SUMMARY.donations.existing} existing preserved.`);

    // 5. Seed Volunteers (Idempotent by Email)
    console.log('\n--- 5. Seeding Volunteer Mobilization Profiles (Idempotent by Email) ---');
    const volunteersData = getVolunteersData(usersMap, seededIncidentsList);
    for (const v of volunteersData) {
      const existingVolunteer = await Volunteer.findOne({ email: v.email.toLowerCase() });
      if (!existingVolunteer) {
        await Volunteer.create(v);
        SEED_SUMMARY.volunteers.inserted++;
      } else {
        SEED_SUMMARY.volunteers.existing++;
      }
    }
    console.log(`Volunteers: ${SEED_SUMMARY.volunteers.inserted} inserted, ${SEED_SUMMARY.volunteers.existing} existing preserved.`);

    // 6. Seed Notifications (Idempotent by Title)
    console.log('\n--- 6. Seeding Announcements & Notifications (Idempotent by Title) ---');
    const notificationsData = getNotificationsData(seededIncidentsList);
    for (const n of notificationsData) {
      const existingNotif = await Notification.findOne({ title: n.title });
      if (!existingNotif) {
        await Notification.create(n);
        SEED_SUMMARY.notifications.inserted++;
      } else {
        SEED_SUMMARY.notifications.existing++;
      }
    }
    console.log(`Notifications: ${SEED_SUMMARY.notifications.inserted} inserted, ${SEED_SUMMARY.notifications.existing} existing preserved.`);

    console.log('\n===============================================================');
    console.log('  SEEDING SUMMARY');
    console.log('===============================================================');
    console.table(SEED_SUMMARY);

    console.log('\n[Demo Accounts Created / Verified]:');
    console.log('  👑 Administrator : admin@resqmangaluru.org   / AdminPassword123!');
    console.log('  🚒 NDRF Responder: responder@resqmangaluru.org / ResponderPass123!');
    console.log('  🌊 Coast Guard   : farooq@resqmangaluru.org    / ResponderPass123!');
    console.log('  👨‍🌾 Citizen       : citizen@resqmangaluru.org   / CitizenPass123!');
    console.log('  🤝 Volunteer     : aditya.hegde@example.com   / VolunteerPass123!');

    await mongoose.connection.close();
    console.log('\n[Database]: Connection safely closed. Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('\n[Seed Error]: Seeding encountered a fatal error:');
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
