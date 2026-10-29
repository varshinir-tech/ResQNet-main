const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Incident = require('./models/Incident');
const Shelter = require('./models/Shelter');
const Volunteer = require('./models/Volunteer');
const Donation = require('./models/Donation');
const Notification = require('./models/Notification');

dotenv.config({ path: __dirname + '/.env' });

let memoryServer = null;

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/disaster_relief_mangaluru';
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log('[Seed]: Connected to MongoDB at ' + mongoUri);
    } catch (e) {
      console.log('[Seed]: Connecting via local MongoMemoryServer engine...');
      const { MongoMemoryServer } = require('mongodb-memory-server-core');
      const path = require('path');
      memoryServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: 'disaster_relief_mangaluru',
          dbPath: path.join(__dirname, '.mongo_data')
        }
      });
      await mongoose.connect(memoryServer.getUri());
      console.log('[Seed]: Connected to embedded MongoDB at ' + memoryServer.getUri());
    }

    // Clear existing collections safely
    await User.deleteMany();
    await Incident.deleteMany();
    await Shelter.deleteMany();
    await Volunteer.deleteMany();
    await Donation.deleteMany();
    await Notification.deleteMany();
    console.log('[Seed]: Cleared existing collections.');

    // 1. Create Demo Users (Admin, Responder, Citizen)
    const adminUser = await User.create({
      name: 'Dr. Ramesh Rao (Admin)',
      email: 'admin@resqmangaluru.org',
      password: 'AdminPassword123!',
      role: 'admin',
      phone: '+91 824 2220001',
      address: 'DC Office Complex, Bunder, Mangaluru',
      availability: 'Available',
      skills: ['Disaster Logistics', 'Emergency Coordination'],
      areaOfOperation: 'Dakshina Kannada District'
    });

    const responderUser1 = await User.create({
      name: 'Kavitha Shenoy (NDRF Lead)',
      email: 'responder@resqmangaluru.org',
      password: 'ResponderPass123!',
      role: 'responder',
      phone: '+91 98801 23456',
      address: 'Kadri Fire & Rescue Station, Mangaluru',
      availability: 'Available',
      skills: ['Flood Rescue', 'First Aid', 'Boat Operations'],
      areaOfOperation: 'Kadri & Bejai Zone'
    });

    const responderUser2 = await User.create({
      name: 'Mohammad Farooq (Rescue Specialist)',
      email: 'farooq@resqmangaluru.org',
      password: 'ResponderPass123!',
      role: 'responder',
      phone: '+91 94481 98765',
      address: 'Panambur Coastal Station, Mangaluru',
      availability: 'On Duty',
      skills: ['Coastal Evacuation', 'Search & Rescue'],
      areaOfOperation: 'Panambur & Surathkal Coast'
    });

    const citizenUser = await User.create({
      name: 'Suresh Kumar (Citizen)',
      email: 'citizen@resqmangaluru.org',
      password: 'CitizenPass123!',
      role: 'citizen',
      phone: '+91 91234 56789',
      address: 'Kodialbail, Mangaluru, Karnataka',
      availability: 'Available',
      skills: ['Community Volunteer'],
      areaOfOperation: 'Mangaluru City'
    });

    console.log('[Seed]: Created demo accounts:');
    console.log('  Admin: admin@resqmangaluru.org / AdminPassword123!');
    console.log('  Responder: responder@resqmangaluru.org / ResponderPass123!');
    console.log('  Citizen: citizen@resqmangaluru.org / CitizenPass123!');

    // 2. Create Realistic Demo Shelters in Mangaluru
    const shelters = await Shelter.create([
      {
        name: 'Town Hall Evacuation Relief Center [Demo Data]',
        address: 'Nehru Maidan Road, Hampankatta, Mangaluru - 575001',
        latitude: 12.8687,
        longitude: 74.8427,
        capacity: 350,
        occupancy: 120,
        facilities: ['Clean Drinking Water', 'Community Kitchen', 'Paramedic Desk', 'Restrooms', 'Generator Power'],
        contactPerson: 'Smt. Anitha D’Souza',
        contactPhone: '+91 824 2420101',
        status: 'Open',
        isDemoData: true
      },
      {
        name: 'Kadri Community Relief Hall [Demo Data]',
        address: 'Near Kadri Temple, Mallikatta, Mangaluru - 575002',
        latitude: 12.8872,
        longitude: 74.8624,
        capacity: 200,
        occupancy: 195,
        facilities: ['Drinking Water', 'First Aid', 'Blankets & Mattresses', 'Mobile Charging'],
        contactPerson: 'Sri Pradeep Poojary',
        contactPhone: '+91 824 2445566',
        status: 'Open',
        isDemoData: true
      },
      {
        name: 'Surathkal Coastal Shelter & Camp [Demo Data]',
        address: 'National Institute Road, Surathkal, Mangaluru - 575025',
        latitude: 13.0084,
        longitude: 74.7937,
        capacity: 250,
        occupancy: 250,
        facilities: ['Emergency Rations', 'Medical Isolation Ward', 'Sanitation Kits'],
        contactPerson: 'Dr. Vinay Bhat',
        contactPhone: '+91 824 2470200',
        status: 'Full',
        isDemoData: true
      },
      {
        name: 'Ullal Flood Relief Shelter [Demo Data]',
        address: 'Kotepura Coastal Link, Ullal, Mangaluru - 575020',
        latitude: 12.8028,
        longitude: 74.8512,
        capacity: 180,
        occupancy: 45,
        facilities: ['Drinking Water', 'Child Care Space', 'Cooked Meals', 'Medical Team'],
        contactPerson: 'Razak Ullal',
        contactPhone: '+91 824 2461122',
        status: 'Open',
        isDemoData: true
      }
    ]);
    console.log(`[Seed]: Seeded ${shelters.length} Shelters.`);

    // 3. Create Demo Incidents in Mangaluru (Geolocated)
    const incidents = await Incident.create([
      {
        title: 'Severe Waterlogging & Inundation in Jeppu Kudupady [Demo Data]',
        description: 'Netravati river backflow and heavy rains have marooned 6 houses near Jeppu Kudupady. Evacuation assistance required for elderly residents.',
        category: 'Flood',
        severity: 'High',
        status: 'Rescue in Progress',
        location: {
          address: 'Jeppu Kudupady, Mangaluru, Karnataka',
          latitude: 12.8510,
          longitude: 74.8580
        },
        reportedBy: citizenUser._id,
        reporterName: citizenUser.name,
        contactPhone: '+91 91234 56789',
        assignedResponder: responderUser1._id,
        assignedResponderName: responderUser1.name,
        statusHistory: [
          {
            status: 'Reported',
            changedBy: citizenUser._id,
            changedByName: citizenUser.name,
            comment: 'Citizen reported flash flooding.',
            timestamp: new Date(Date.now() - 3600000 * 4)
          },
          {
            status: 'Acknowledged',
            changedBy: adminUser._id,
            changedByName: adminUser.name,
            comment: 'Admin verified incident with local ward member.',
            timestamp: new Date(Date.now() - 3600000 * 3)
          },
          {
            status: 'Responder Assigned',
            changedBy: adminUser._id,
            changedByName: adminUser.name,
            comment: 'Assigned Kavitha Shenoy and NDRF rescue team.',
            timestamp: new Date(Date.now() - 3600000 * 2)
          },
          {
            status: 'Rescue in Progress',
            changedBy: responderUser1._id,
            changedByName: responderUser1.name,
            comment: 'Inflatable boats deployed. Evacuating 14 residents to Town Hall shelter.',
            timestamp: new Date(Date.now() - 3600000 * 1)
          }
        ],
        isDemoData: true
      },
      {
        title: 'Landslide Debris Blocking Gurupura Link Road [Demo Data]',
        description: 'Mudslide on hilly road cutting off connectivity. No known injuries, but road clearance required urgently for ambulance passage.',
        category: 'Landslide',
        severity: 'Medium',
        status: 'Acknowledged',
        location: {
          address: 'Gurupura Ghat Section, Mangaluru, Karnataka',
          latitude: 12.9348,
          longitude: 74.9312
        },
        reportedBy: citizenUser._id,
        reporterName: citizenUser.name,
        contactPhone: '+91 91234 56789',
        assignedResponder: null,
        assignedResponderName: '',
        statusHistory: [
          {
            status: 'Reported',
            changedBy: citizenUser._id,
            changedByName: citizenUser.name,
            comment: 'Road users reported debris blocking lanes.',
            timestamp: new Date(Date.now() - 3600000 * 2)
          },
          {
            status: 'Acknowledged',
            changedBy: adminUser._id,
            changedByName: adminUser.name,
            comment: 'Forwarded to Public Works and Disaster Clearing squad.',
            timestamp: new Date(Date.now() - 3600000 * 1)
          }
        ],
        isDemoData: true
      },
      {
        title: 'Tree Fall on Electric Transformer in Bejai [Demo Data]',
        description: 'Banyan tree branch fell on electricity transformer due to heavy gusts. Sparking observed and power outage in surrounding layout.',
        category: 'Heavy rainfall',
        severity: 'High',
        status: 'Reported',
        location: {
          address: 'Bejai Main Road, near KSRTC Bus Stand, Mangaluru',
          latitude: 12.8856,
          longitude: 74.8471
        },
        reportedBy: citizenUser._id,
        reporterName: citizenUser.name,
        contactPhone: '+91 98800 11223',
        statusHistory: [
          {
            status: 'Reported',
            changedBy: citizenUser._id,
            changedByName: citizenUser.name,
            comment: 'Reported by local resident.',
            timestamp: new Date(Date.now() - 1800000)
          }
        ],
        isDemoData: true
      },
      {
        title: 'Fishing Vessel Stranded Near Panambur Sea Wall [Demo Data]',
        description: 'Engine failure amid 3-meter sea waves. 4 crew members onboard requesting coastal tow.',
        category: 'Accident',
        severity: 'Critical',
        status: 'Responder Assigned',
        location: {
          address: 'Panambur Port Reach, Mangaluru, Karnataka',
          latitude: 12.9515,
          longitude: 74.8080
        },
        reportedBy: citizenUser._id,
        reporterName: citizenUser.name,
        contactPhone: '+91 99000 55443',
        assignedResponder: responderUser2._id,
        assignedResponderName: responderUser2.name,
        statusHistory: [
          {
            status: 'Reported',
            changedBy: citizenUser._id,
            changedByName: citizenUser.name,
            comment: 'Coastal watch reported vessel in distress.',
            timestamp: new Date(Date.now() - 5400000)
          },
          {
            status: 'Responder Assigned',
            changedBy: adminUser._id,
            changedByName: adminUser.name,
            comment: 'Coast Guard liaison Mohammad Farooq mobilized.',
            timestamp: new Date(Date.now() - 3600000)
          }
        ],
        isDemoData: true
      },
      {
        title: 'Short Circuit Kitchen Fire Extinguished in Hampankatta [Demo Data]',
        description: 'Commercial kitchen short circuit fire quickly brought under control. Damage contained, all staff safe.',
        category: 'Fire',
        severity: 'Low',
        status: 'Resolved',
        location: {
          address: 'KS Rao Road, Hampankatta, Mangaluru',
          latitude: 12.8710,
          longitude: 74.8435
        },
        reportedBy: citizenUser._id,
        reporterName: citizenUser.name,
        contactPhone: '+91 824 2490000',
        assignedResponder: responderUser1._id,
        assignedResponderName: responderUser1.name,
        statusHistory: [
          {
            status: 'Reported',
            changedBy: citizenUser._id,
            changedByName: citizenUser.name,
            comment: 'Fire reported in restaurant kitchen.',
            timestamp: new Date(Date.now() - 86400000)
          },
          {
            status: 'Resolved',
            changedBy: adminUser._id,
            changedByName: adminUser.name,
            comment: 'Fire station attended and declared location safe.',
            timestamp: new Date(Date.now() - 80000000)
          }
        ],
        isDemoData: true
      }
    ]);
    console.log(`[Seed]: Seeded ${incidents.length} Incidents.`);

    // 4. Create Demo Volunteers
    const volunteers = await Volunteer.create([
      {
        name: 'Aditya Hegde [Demo Data]',
        email: 'aditya.hegde@example.com',
        phone: '+91 98450 11223',
        skills: ['First Aid', 'Swimming & Lifesaving', 'Search & Rescue'],
        availability: 'Available',
        areaOfOperation: 'Ullal & Bengre Coastal Zone',
        status: 'Active',
        isDemoData: true
      },
      {
        name: 'Deepa Kamath [Demo Data]',
        email: 'deepa.kamath@example.com',
        phone: '+91 94812 33445',
        skills: ['Medical Triage', 'Nursing & First Aid', 'Counseling'],
        availability: 'On Duty',
        areaOfOperation: 'Mangaluru City / Town Hall Shelter',
        assignedIncident: incidents[0]._id,
        assignedIncidentTitle: incidents[0].title,
        status: 'Active',
        isDemoData: true
      },
      {
        name: 'Roshan Pereira [Demo Data]',
        email: 'roshan.p@example.com',
        phone: '+91 97401 55667',
        skills: ['Heavy Vehicle Driving', 'Debris Clearing', 'Logistics'],
        availability: 'Available',
        areaOfOperation: 'Kodialbail & Bejai',
        status: 'Active',
        isDemoData: true
      },
      {
        name: 'Zeenath Banu [Demo Data]',
        email: 'zeenath.b@example.com',
        phone: '+91 98860 77889',
        skills: ['Community Kitchen', 'Ration Distribution', 'Language Translation'],
        availability: 'Available',
        areaOfOperation: 'Bunder & Car Street',
        status: 'Active',
        isDemoData: true
      }
    ]);
    console.log(`[Seed]: Seeded ${volunteers.length} Volunteers.`);

    // 5. Create Demo Donations
    const donations = await Donation.create([
      {
        donorName: 'Mangaluru Rotary Welfare Club [Demo Data]',
        isAnonymous: false,
        donorEmail: 'rotary.mangaluru@example.com',
        donorPhone: '+91 824 2420000',
        donationType: 'Monetary',
        amount: 75000,
        purpose: 'Monsoon Flood Relief Equipment Fund',
        status: 'Received',
        administrativeNotes: 'Recorded for MCA project demonstration. Cheque pledge simulated.',
        isDemoData: true
      },
      {
        donorName: 'Anonymous Donor [Demo Data]',
        isAnonymous: true,
        donorEmail: '',
        donorPhone: '',
        donationType: 'Monetary',
        amount: 25000,
        purpose: 'Emergency Medical Kits for Evacuation Centers',
        status: 'Received',
        administrativeNotes: 'Recorded for MCA project demonstration.',
        isDemoData: true
      },
      {
        donorName: 'Coastal Traders Association [Demo Data]',
        isAnonymous: false,
        donorEmail: 'traders.mng@example.com',
        donorPhone: '+91 98450 99887',
        donationType: 'Food & Ration',
        amount: 0,
        itemsDescription: '200 Bags of Rice (25kg each) and 500 Liters Drinking Water',
        purpose: 'Ration supplies for Jeppu & Ullal relief camps',
        status: 'Received',
        administrativeNotes: 'Material supplies confirmed delivered to central depot.',
        isDemoData: true
      },
      {
        donorName: 'KMC Alumni Medical Volunteers [Demo Data]',
        isAnonymous: false,
        donorEmail: 'kmc.alumni@example.com',
        donorPhone: '+91 824 2444555',
        donationType: 'Medical Kits',
        amount: 0,
        itemsDescription: '150 Comprehensive First Aid & Antiseptic Kits',
        purpose: 'First responder immediate trauma packs',
        status: 'Distributed',
        administrativeNotes: 'Distributed to NDRF units and Kadri Shelter.',
        isDemoData: true
      }
    ]);
    console.log(`[Seed]: Seeded ${donations.length} Donations.`);

    // 6. Create Demo Notifications
    await Notification.create([
      {
        targetRole: 'all',
        title: '⚠️ IMD Heavy Rain Warning (Orange Alert)',
        message: 'Mangaluru City & Coastal Taluks expected to receive heavy rainfall over the next 48 hours. Citizens in low-lying zones advised to note nearest shelters.',
        type: 'emergency'
      },
      {
        targetRole: 'admin',
        title: '🚨 High Priority: Jeppu Kudupady Flash Flood',
        message: 'Rescue in progress led by NDRF Team Kavitha Shenoy. 14 citizens being evacuated to Town Hall shelter.',
        type: 'emergency',
        incidentId: incidents[0]._id
      },
      {
        targetRole: 'all',
        title: 'ℹ️ Town Hall Shelter Operational',
        message: 'Town Hall Evacuation Relief Center is fully open with medical support and clean drinking water.',
        type: 'shelter'
      }
    ]);
    console.log('[Seed]: Seeded Notifications.');

    console.log('[Seed]: Database seeding successfully completed!');
    if (memoryServer) {
      await memoryServer.stop();
    }
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    if (memoryServer) {
      await memoryServer.stop();
    }
    process.exit(1);
  }
};

seedDatabase();
