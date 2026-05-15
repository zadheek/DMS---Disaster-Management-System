const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@disaster.lk" },
    update: { name: "System Admin", passwordHash, role: "ADMIN" },
    create: {
      name: "System Admin",
      email: "admin@disaster.lk",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Admin user ready:", admin.email);

  const existingOperationalRecords = await Promise.all([
    prisma.alert.count(),
    prisma.roadAlert.count(),
    prisma.missingPerson.count(),
    prisma.reliefCamp.count(),
    prisma.donationDrive.count(),
  ]);

  if (existingOperationalRecords.some((count) => count > 0)) {
    await prisma.$transaction([
      prisma.reliefCamp.updateMany({
        where: { name: "Jaffna Northern Relief Center" },
        data: { lat: 9.6615, lng: 80.0255 },
      }),
      prisma.reliefCamp.updateMany({
        where: { name: "Batticaloa East Coast Camp" },
        data: { lat: 7.7167, lng: 81.7009 },
      }),
    ]);
    console.log("Operational records already exist; skipped destructive reseed and corrected known camp coordinates");
    return;
  }

  await prisma.$transaction([
    prisma.campCheckIn.deleteMany(),
    prisma.flagReport.deleteMany(),
    prisma.adminLog.deleteMany(),
    prisma.donationPledge.deleteMany(),
    prisma.broadcast.deleteMany(),
    prisma.volunteer.deleteMany(),
    prisma.reliefCamp.deleteMany(),
    prisma.roadAlert.deleteMany(),
    prisma.missingPerson.deleteMany(),
    prisma.alert.deleteMany(),
    prisma.donationDrive.deleteMany(),
  ]);
  console.log("Old operational records removed");

  // Alerts (unique records across tab statuses)
  await prisma.alert.createMany({
    data: [
      {
        type: "FLOOD",
        title: "Severe Flooding in Colombo District",
        description:
          "Heavy flooding reported in Colombo 15 area. Roads submerged and evacuations in progress.",
        location: "Colombo 15, Western Province",
        lat: 6.9271,
        lng: 79.8612,
        severity: "CRITICAL",
        reporterName: "Colombo Municipal Council",
        reporterPhone: "+94112345678",
        status: "ACTIVE",
      },
      {
        type: "LANDSLIDE",
        title: "Landslide Near Kadugannawa Cleared",
        description:
          "Debris removed and traffic restored after emergency clearance operations.",
        location: "Kadugannawa, Kandy District",
        lat: 7.2516,
        lng: 80.524,
        severity: "HIGH",
        reporterName: "RDA Patrol Team",
        reporterPhone: "+94812345678",
        status: "RESOLVED",
      },
      {
        type: "FIRE",
        title: "Warehouse Fire Report Rejected",
        description:
          "Initial report could not be verified by responding units at the stated location.",
        location: "Dehiwala, Western Province",
        lat: 6.848,
        lng: 79.865,
        severity: "MEDIUM",
        reporterName: "Hotline Operator",
        reporterPhone: "+94112777000",
        status: "REJECTED",
      },
      {
        type: "BUILDING_COLLAPSE",
        title: "Old Structure Collapse Record",
        description:
          "Historic incident entry kept for audit trail and lifecycle testing.",
        location: "Pettah, Colombo District",
        lat: 6.9356,
        lng: 79.8534,
        severity: "HIGH",
        reporterName: "Colombo Municipal Fire Division",
        reporterPhone: "+94112345999",
        status: "EXPIRED",
      },
      {
        type: "FLOOD",
        title: "Recurring Drain Overflow Complaints",
        description:
          "Multiple citizen submissions received from the same street section.",
        location: "Wellawatte, Colombo District",
        lat: 6.8744,
        lng: 79.859,
        severity: "MEDIUM",
        reporterName: "Public Hotline",
        reporterPhone: "+94112000000",
        status: "ACTIVE",
        flagCount: 3,
      },
      {
        type: "LANDSLIDE",
        title: "Active Landslide Blocking Balana Road",
        description:
          "Major landslide blocks both lanes near Balana junction. Heavy machinery deployed for clearance.",
        location: "Balana, Kandy District",
        lat: 7.267,
        lng: 80.575,
        severity: "HIGH",
        reporterName: "District Disaster Officer",
        reporterPhone: "+94812200100",
        status: "ACTIVE",
      },
      {
        type: "FIRE",
        title: "Factory Fire at Biyagama Export Zone",
        description:
          "Industrial fire reported at a garment factory in Biyagama EPZ. Multiple fire brigades on scene.",
        location: "Biyagama EPZ, Gampaha District",
        lat: 6.9423,
        lng: 80.0234,
        severity: "HIGH",
        reporterName: "Biyagama EPZ Security",
        reporterPhone: "+94332287000",
        status: "ACTIVE",
      },
      {
        type: "BUILDING_COLLAPSE",
        title: "Partial Collapse at Pettah Old Building",
        description:
          "Three-story abandoned building partially collapsed following overnight heavy rain. Area cordoned off by police.",
        location: "Pettah, Colombo District",
        lat: 6.938,
        lng: 79.852,
        severity: "CRITICAL",
        reporterName: "Colombo Municipal Council",
        reporterPhone: "+94112345780",
        status: "ACTIVE",
      },
    ],
  });
  console.log("Alerts seeded");

  // Road alerts (ACTIVE, RESOLVED, FLAGGED)
  await prisma.roadAlert.createMany({
    data: [
      {
        fromLocation: "Colombo",
        toLocation: "Kandy",
        roadName: "A1 Colombo-Kandy Highway",
        description: "Landslide debris blocks both lanes near Kadugannawa.",
        reporterName: "National Road Authority",
        reporterPhone: "+94112233445",
        lat: 7.2516,
        lng: 80.524,
        status: "ACTIVE",
      },
      {
        fromLocation: "Galle",
        toLocation: "Matara",
        roadName: "A2 Southern Feeder",
        description: "Flood water receded and route reopened to light traffic.",
        reporterName: "Traffic Police Galle",
        reporterPhone: "+94912345678",
        lat: 6.0114,
        lng: 80.2431,
        status: "RESOLVED",
      },
      {
        fromLocation: "Kegalle",
        toLocation: "Mawanella",
        roadName: "B122 Valley Road",
        description: "Conflicting crowd reports under review by district team.",
        reporterName: "District Control Room",
        reporterPhone: "+94352223344",
        lat: 7.263,
        lng: 80.346,
        status: "ACTIVE",
        flagCount: 3,
      },
    ],
  });
  console.log("Road alerts seeded");

  // Missing persons (MISSING, FOUND, FLAGGED)
  await prisma.missingPerson.createMany({
    data: [
      {
        name: "Kamal Perera",
        age: 45,
        lastSeenLocation: "Colombo 15 Flood Zone, near Mutwal Junction",
        lat: 6.93,
        lng: 79.865,
        reporterName: "Nimal Perera",
        reporterPhone: "+94712345678",
        status: "MISSING",
      },
      {
        name: "Nimali Silva",
        age: 32,
        idNumber: "198512345678",
        lastSeenLocation: "Kadugannawa Junction, Kandy-Colombo Road",
        lat: 7.25,
        lng: 80.52,
        reporterName: "Sunil Silva",
        reporterPhone: "+94762345678",
        status: "FOUND",
      },
      {
        name: "Ruwan Dissanayake",
        age: 58,
        lastSeenLocation: "Ratmalana Industrial Zone",
        lat: 6.8215,
        lng: 79.887,
        reporterName: "Chamari Dissanayake",
        reporterPhone: "+94714567890",
        status: "MISSING",
        flagCount: 3,
      },
    ],
  });
  console.log("Missing persons seeded");

  // Relief camps (7 camps across Sri Lanka)
  await prisma.reliefCamp.createMany({
    data: [
      {
        name: "Colombo District Relief Camp A",
        location: "Narahenpita Community Center, Colombo 5",
        lat: 6.8969,
        lng: 79.8716,
        capacity: 250,
        currentOccupancy: 150,
        qrCode: uuidv4(),
        status: "ACTIVE",
      },
      {
        name: "Kandy District Relief Camp",
        location: "Kandy Town Hall Grounds, Kandy",
        lat: 7.2906,
        lng: 80.6337,
        capacity: 180,
        currentOccupancy: 95,
        qrCode: uuidv4(),
        status: "ACTIVE",
      },
      {
        name: "Galle District Relief Camp",
        location: "Galle Fort Grounds, Galle",
        lat: 6.0331,
        lng: 80.2158,
        capacity: 200,
        currentOccupancy: 68,
        qrCode: uuidv4(),
        status: "ACTIVE",
      },
      {
        name: "Matara Emergency Shelter",
        location: "Matara Sports Stadium, Matara",
        lat: 5.9497,
        lng: 80.5485,
        capacity: 150,
        currentOccupancy: 72,
        qrCode: uuidv4(),
        status: "ACTIVE",
      },
      {
        name: "Jaffna Northern Relief Center",
        location: "Jaffna Cultural Center, Jaffna",
        lat: 9.6615,
        lng: 80.0255,
        capacity: 120,
        currentOccupancy: 54,
        qrCode: uuidv4(),
        status: "ACTIVE",
      },
      {
        name: "Batticaloa East Coast Camp",
        location: "Batticaloa District Hospital Grounds",
        lat: 7.7167,
        lng: 81.7009,
        capacity: 160,
        currentOccupancy: 89,
        qrCode: uuidv4(),
        status: "ACTIVE",
      },
      {
        name: "Anuradhapura Central Relief Camp",
        location: "Anuradhapura Town Hall, North Central Province",
        lat: 8.3352,
        lng: 80.4033,
        capacity: 190,
        currentOccupancy: 110,
        qrCode: uuidv4(),
        status: "ACTIVE",
      },
    ],
  });
  console.log("Relief camps seeded");

  // Camp check-ins — 50+ members across all camps with realistic data
  const camps = await prisma.reliefCamp.findMany({ select: { id: true, name: true } });
  
  const colomboCamp = camps.find((c) => c.name.includes("Colombo"));
  const kandyCamp = camps.find((c) => c.name.includes("Kandy"));
  const galleCamp = camps.find((c) => c.name.includes("Galle"));
  const mataraCamp = camps.find((c) => c.name.includes("Matara"));
  const jaffnaCamp = camps.find((c) => c.name.includes("Jaffna"));
  const batticaloCamp = camps.find((c) => c.name.includes("Batticaloa"));
  const anuradhapuraCamp = camps.find((c) => c.name.includes("Anuradhapura"));

  const checkInData = [];
  const now = new Date();

  // Colombo camp (25 members)
  if (colomboCamp) {
    const colomboNames = [
      "Kamalini Perera", "Suresh Bandara", "Nadeeka Fernando", "Roshan De Silva", "Priyanka Jayasena",
      "Mahesh Wickramasinghe", "Chamara Gunawardena", "Dilini Rathnayake", "Tharaka Kumara", "Sanduni Madushan",
      "Ranjith Alwis", "Anushka Silva", "Kasun Mendis", "Chandrika Kapoor", "Viraj Perera",
      "Lakshmi Sharma", "Arun Kumar", "Shalini Gupta", "Naveen Raj", "Deepa Nair",
      "Arjun Patel", "Meera Singh", "Rajesh Verma", "Amrita Das", "Sanjay Chopra"
    ];
    colomboNames.forEach((name, idx) => {
      checkInData.push({
        campId: colomboCamp.id,
        personName: name,
        personId: `199${90 + Math.floor(idx / 10)}${String(idx % 10).padStart(2, "0")}12345`,
        checkedInAt: new Date(now.getTime() - (25 - idx) * 24 * 60 * 60 * 1000),
      });
    });
  }

  // Kandy camp (20 members)
  if (kandyCamp) {
    const kandyNames = [
      "Nimal Rajapaksa", "Ishara Senaratne", "Thilini Abewickrama", "Buddhika Liyanage", "Kasun Kularatne",
      "Chamari Hewavitharana", "Janaka Kumara", "Sandamali Weerasinghe", "Herath Gunarathne", "Pavani Silva",
      "Madhushan Wijesinghe", "Asanka De Silva", "Chamila Jayasinghe", "Sampath Sirithunga", "Gayan Bandara",
      "Ruwan Dissanayake", "Tharindu Galagedara", "Sujeewa Kariyawasam", "Nipun Wijetunga", "Tharuka Jayasena"
    ];
    kandyNames.forEach((name, idx) => {
      checkInData.push({
        campId: kandyCamp.id,
        personName: name,
        personId: `199${80 + Math.floor(idx / 10)}${String(idx % 10).padStart(2, "0")}67890`,
        checkedInAt: new Date(now.getTime() - (20 - idx) * 24 * 60 * 60 * 1000),
      });
    });
  }

  // Galle camp (18 members)
  if (galleCamp) {
    const galleNames = [
      "Nirosh De Silva", "Sanduni Edirisinghe", "Kasun Siriwardena", "Chamari Perera", "Thilini Hewage",
      "Prabath Jayatilaka", "Anula Wijesekera", "Sanjaya Wijesinghe", "Lasantha Bandara", "Chaminda Jayasinghe",
      "Udaya Dissanayake", "Rangi Perera", "Sumith Ranasinghe", "Geetha Sumanasekera", "Pramod Senanayake",
      "Arjun Fernando", "Buddhi Wijesinghe", "Ravi De Silva"
    ];
    galleNames.forEach((name, idx) => {
      checkInData.push({
        campId: galleCamp.id,
        personName: name,
        checkedInAt: new Date(now.getTime() - (18 - idx) * 24 * 60 * 60 * 1000),
      });
    });
  }

  // Matara camp (15 members)
  if (mataraCamp) {
    const mataraNames = [
      "Sampath Jayawardena", "Anitha Weerasekera", "Thisara Jayasekera", "Kumara Edirisinghe", "Shali Rathnayake",
      "Dinesh Gunasinghe", "Malini Perera", "Roshan Jayawardena", "Chamila Kularatne", "Madana Wijesinghe",
      "Sanjaya Senanayake", "Pavitra Silva", "Hiranya Abeysekera", "Dilani Jayatilleke", "Bimal Wijesinghe"
    ];
    mataraNames.forEach((name, idx) => {
      checkInData.push({
        campId: mataraCamp.id,
        personName: name,
        checkedInAt: new Date(now.getTime() - (15 - idx) * 24 * 60 * 60 * 1000),
      });
    });
  }

  // Jaffna camp (12 members)
  if (jaffnaCamp) {
    const jaffnaNames = [
      "Selvaraj Nanthakumar", "Priya Krishnan", "Arun Prakash", "Meera Reddy", "Karthik Sampath",
      "Divya Kumari", "Arjun Nair", "Anjali Sharma", "Ashok Kumar", "Pooja Singh",
      "Vijay Patel", "Sneha Gupta"
    ];
    jaffnaNames.forEach((name, idx) => {
      checkInData.push({
        campId: jaffnaCamp.id,
        personName: name,
        checkedInAt: new Date(now.getTime() - (12 - idx) * 24 * 60 * 60 * 1000),
      });
    });
  }

  // Batticaloa camp (14 members)
  if (batticaloCamp) {
    const battiNames = [
      "Santhosh Kumar", "Priya Lakshmi", "Rajkumar Singh", "Deepa Nair", "Vikram Patel",
      "Anjana Gupta", "Mahesh Verma", "Neha Sharma", "Arun Singh", "Kavya Reddy",
      "Sanjiv Kumar", "Pooja Gupta", "Ravi Nair", "Sunita Joshi"
    ];
    battiNames.forEach((name, idx) => {
      checkInData.push({
        campId: batticaloCamp.id,
        personName: name,
        checkedInAt: new Date(now.getTime() - (14 - idx) * 24 * 60 * 60 * 1000),
      });
    });
  }

  // Anuradhapura camp (16 members)
  if (anuradhapuraCamp) {
    const anuNames = [
      "Thilak Gunawardena", "Samantha Silva", "Pradeep Jayasekera", "Damayanthi Wijesinghe", "Chaminda Perera",
      "Dilini Fernando", "Mithila Jayawardena", "Kusal Bandara", "Piumi Ranasinghe", "Nuwan Karunasena",
      "Amila Jayasekera", "Ishani De Silva", "Sandun Wijesinghe", "Roshani Perera", "Yohan Jayatilake",
      "Sachini Amarasinghe"
    ];
    anuNames.forEach((name, idx) => {
      checkInData.push({
        campId: anuradhapuraCamp.id,
        personName: name,
        checkedInAt: new Date(now.getTime() - (16 - idx) * 24 * 60 * 60 * 1000),
      });
    });
  }

  if (checkInData.length > 0) {
    await prisma.campCheckIn.createMany({ data: checkInData });
  }
  console.log("Camp check-ins seeded");

  await prisma.volunteer.createMany({
    data: [
      {
        name: "Dr. Priya Fernando",
        phone: "+94771234567",
        email: "priya.fernando@redcross.lk",
        location: "Colombo 7",
        lat: 6.9057,
        lng: 79.8634,
        skills: ["MEDICAL", "RESCUE"],
        status: "AVAILABLE",
      },
      {
        name: "Rizwan Ahamed",
        phone: "+94771110022",
        email: "rizwan.ahamed@rescue.lk",
        location: "Kandy",
        lat: 7.2906,
        lng: 80.6337,
        skills: ["TRANSPORT", "COMMUNICATION"],
        status: "DEPLOYED",
      },
    ],
  });
  console.log("Volunteers seeded");

  const activeDrive = await prisma.donationDrive.create({
    data: {
      organizationName: "Sri Lanka Red Cross Society",
      description:
        "Emergency relief for flood victims in Western Province. Food packs and medical supplies urgently needed.",
      needs: ["FOOD", "MEDICINE"],
      bankDetails:
        "Bank Name: Bank of Ceylon\nAccount Name: Sri Lanka Red Cross Society\nAccount Number: 0012345678\nBranch: Colombo Fort",
      externalLink: "https://www.redcross.lk/donate",
      isActive: true,
    },
  });

  await prisma.donationDrive.create({
    data: {
      organizationName: "District Welfare Board",
      description: "Completed campaign kept for admin history and filtering tests.",
      needs: ["CLOTHES", "CASH"],
      bankDetails:
        "Bank Name: Peoples Bank\nAccount Name: District Welfare Board\nAccount Number: 9988776655\nBranch: Kandy",
      isActive: false,
    },
  });

  await prisma.donationPledge.createMany({
    data: [
      {
        driveId: activeDrive.id,
        donorName: "S. Jayasinghe",
        donorPhone: "+94770001122",
        amount: 25000,
        donationType: "CASH",
        message: "Immediate family aid support.",
      },
      {
        driveId: activeDrive.id,
        donorName: "R. Fernando",
        donorPhone: "+94773334455",
        donationType: "MEDICINE",
        message: "Can provide first-aid kits.",
      },
    ],
  });
  console.log("Donations and pledges seeded");

  await prisma.broadcast.createMany({
    data: [
      {
        message:
          "WEATHER ALERT: Heavy rainfall expected across Western and Central provinces for next 48 hours.",
        severity: "INFO",
        isActive: false,
      },
      {
        message: "Road closure advisory has expired after clearance confirmation.",
        severity: "WARNING",
        isActive: false,
      },
    ],
  });
  console.log("Broadcasts seeded");

  console.log("Seeding complete!");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
