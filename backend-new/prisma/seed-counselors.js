/**
 * Database Seeder: Register 12 diverse counselors across all academic and industry streams.
 * Password requirement: "@Name2003" where Name is the counselor's first name capitalized.
 */

import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';

const counselorsData = [
  {
    firstName: 'Aarav',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@sarthi.com',
    stream: 'Engineering',
    specialization: 'Computer Science & Artificial Intelligence',
    experience: 8,
    rating: 4.9,
    totalRatings: 34,
    gender: 'Male',
    mobile: '+91 9876543201',
    bio: 'Senior Technical Lead & Tech Career Counselor. Specializes in CS/IT branches, coding bootcamps, AI/ML career transitions, and software engineering interviews at top tech firms.',
  },
  {
    firstName: 'Priya',
    name: 'Priya Nair',
    email: 'priya.nair@sarthi.com',
    stream: 'Medical',
    specialization: 'Medicine & Clinical Healthcare',
    experience: 11,
    rating: 4.8,
    totalRatings: 42,
    gender: 'Female',
    mobile: '+91 9876543202',
    bio: 'Healthcare Mentor and Medical Admissions Advisor. Guides NEET aspirants, MBBS students, public healthcare specializations, and overseas clinical certifications (USMLE/PLAB).',
  },
  {
    firstName: 'Rohan',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@sarthi.com',
    stream: 'Commerce',
    specialization: 'Investment Banking & Corporate Finance',
    experience: 9,
    rating: 4.9,
    totalRatings: 29,
    gender: 'Male',
    mobile: '+91 9876543203',
    bio: 'Chartered Financial Analyst (CFA) & former Wall Street Equity Analyst. Advises students on CA/CFA pathways, fintech careers, equity research, and Ivy League finance programs.',
  },
  {
    firstName: 'Ananya',
    name: 'Ananya Sen',
    email: 'ananya.sen@sarthi.com',
    stream: 'Design',
    specialization: 'UI/UX & Interactive Product Design',
    experience: 7,
    rating: 4.8,
    totalRatings: 25,
    gender: 'Female',
    mobile: '+91 9876543204',
    bio: 'Staff Product Designer and NID Alumna. Mentors creative aspirants in building portfolio case studies, entrance exam prep (UCEED/NID/NIFT), and tech UX/AR design careers.',
  },
  {
    firstName: 'Vikram',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@sarthi.com',
    stream: 'Arts',
    specialization: 'Corporate Law & Public Policy',
    experience: 12,
    rating: 4.7,
    totalRatings: 38,
    gender: 'Male',
    mobile: '+91 9876543205',
    bio: 'Senior Advocate and Judicial Career Consultant. Guides CLAT aspirants, corporate law associates, international trade law careers, and UPSC/civil service preparation.',
  },
  {
    firstName: 'Neha',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@sarthi.com',
    stream: 'Management',
    specialization: 'Strategy, Product & General Management',
    experience: 10,
    rating: 4.9,
    totalRatings: 46,
    gender: 'Female',
    mobile: '+91 9876543206',
    bio: 'IIM Ahmedabad Alumna and Management Consultant. Specializes in CAT/GMAT coaching, business school admissions, product management, and management consulting prep.',
  },
  {
    firstName: 'Siddharth',
    name: 'Siddharth Rao',
    email: 'siddharth.rao@sarthi.com',
    stream: 'Science',
    specialization: 'Data Science & Statistical Modeling',
    experience: 6,
    rating: 4.7,
    totalRatings: 21,
    gender: 'Male',
    mobile: '+91 9876543207',
    bio: 'Lead Data Scientist advising undergraduate math and physics majors on transitioning into high-paying big data, quantitative modeling, and applied research roles.',
  },
  {
    firstName: 'Meera',
    name: 'Meera Deshmukh',
    email: 'meera.deshmukh@sarthi.com',
    stream: 'Arts',
    specialization: 'Organizational Psychology & Career Counseling',
    experience: 14,
    rating: 5.0,
    totalRatings: 53,
    gender: 'Female',
    mobile: '+91 9876543208',
    bio: 'Licensed Psychologist and Academic Counselor. Helps students overcome career anxiety, resolve stream confusion, and match their personality archetype to sustainable life goals.',
  },
  {
    firstName: 'Karan',
    name: 'Karan Patel',
    email: 'karan.patel@sarthi.com',
    stream: 'Engineering',
    specialization: 'Robotics & Mechanical Systems',
    experience: 8,
    rating: 4.6,
    totalRatings: 19,
    gender: 'Male',
    mobile: '+91 9876543209',
    bio: 'Industrial Automation Specialist & Robotics Mentor. Guides students through EV engineering, mechatronics, aerospace research, and Master’s applications in Germany/US.',
  },
  {
    firstName: 'Tanvi',
    name: 'Tanvi Joshi',
    email: 'tanvi.joshi@sarthi.com',
    stream: 'Science',
    specialization: 'Biotechnology & Genetic Engineering',
    experience: 7,
    rating: 4.8,
    totalRatings: 22,
    gender: 'Female',
    mobile: '+91 9876543210',
    bio: 'Ph.D. Researcher in Molecular Biology. Mentors students exploring career trajectories in pharmaceuticals, genetic therapy, bioinformatics, and R&D fellowships.',
  },
  {
    firstName: 'Aditya',
    name: 'Aditya Verma',
    email: 'aditya.verma@sarthi.com',
    stream: 'Commerce',
    specialization: 'Chartered Accountancy & Tax Advisory',
    experience: 10,
    rating: 4.8,
    totalRatings: 31,
    gender: 'Male',
    mobile: '+91 9876543211',
    bio: 'Practicing CA and Financial Auditor. Dedicated advisor for CA Foundation/Inter/Final aspirants, forensic auditing careers, and Big 4 corporate accounting.',
  },
  {
    firstName: 'Zoya',
    name: 'Zoya Akhtar',
    email: 'zoya.akhtar@sarthi.com',
    stream: 'Design',
    specialization: 'Animation, VFX & Game Development',
    experience: 9,
    rating: 4.9,
    totalRatings: 27,
    gender: 'Female',
    mobile: '+91 9876543212',
    bio: 'Award-winning Creative Director in game art & visual storytelling. Advises students aiming for careers in international game studios, concept art, and 3D modeling.',
  },
];

// Standard recurring weekly availability slots for each counselor
const defaultSlots = [
  { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }, // Mon
  { dayOfWeek: 1, startTime: '14:00', endTime: '15:00' },
  { dayOfWeek: 2, startTime: '11:00', endTime: '12:00' }, // Tue
  { dayOfWeek: 2, startTime: '16:00', endTime: '17:00' },
  { dayOfWeek: 3, startTime: '10:00', endTime: '11:00' }, // Wed
  { dayOfWeek: 3, startTime: '15:00', endTime: '16:00' },
  { dayOfWeek: 4, startTime: '11:00', endTime: '12:00' }, // Thu
  { dayOfWeek: 4, startTime: '17:00', endTime: '18:00' },
  { dayOfWeek: 5, startTime: '09:00', endTime: '10:00' }, // Fri
  { dayOfWeek: 5, startTime: '14:00', endTime: '15:00' },
  { dayOfWeek: 6, startTime: '10:00', endTime: '11:00' }, // Sat
  { dayOfWeek: 6, startTime: '12:00', endTime: '13:00' },
];

async function seedCounselors() {
  console.log('--- Registering Counselors with @Name2003 Credentials ---');

  for (const c of counselorsData) {
    const rawPassword = `@${c.firstName}2003`;
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    // Upsert counselor by email
    const counselor = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        name: c.name,
        password: hashedPassword,
        role: 'counselor',
        stream: c.stream,
        specialization: c.specialization,
        experience: c.experience,
        rating: c.rating,
        totalRatings: c.totalRatings,
        gender: c.gender,
        mobile: c.mobile,
        bio: c.bio,
      },
      create: {
        name: c.name,
        email: c.email,
        password: hashedPassword,
        role: 'counselor',
        stream: c.stream,
        specialization: c.specialization,
        experience: c.experience,
        rating: c.rating,
        totalRatings: c.totalRatings,
        gender: c.gender,
        mobile: c.mobile,
        bio: c.bio,
      },
    });

    // Populate weekly availability slots for seamless booking
    await prisma.availabilitySlot.deleteMany({ where: { counselorId: counselor.id } });
    await prisma.availabilitySlot.createMany({
      data: defaultSlots.map((s) => ({
        counselorId: counselor.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: true,
      })),
    });

    console.log(`Registered: ${c.name.padEnd(20)} | Email: ${c.email.padEnd(28)} | Password: ${rawPassword} | Stream: ${c.stream}`);
  }

  const totalCount = await prisma.user.count({ where: { role: 'counselor' } });
  console.log(`\nAll 12 counselors registered successfully! Total counselors in database: ${totalCount}`);
}

seedCounselors()
  .catch((err) => {
    console.error('Error registering counselors:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
