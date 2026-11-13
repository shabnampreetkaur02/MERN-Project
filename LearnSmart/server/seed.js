// Creates demo accounts and sample courses.
// Run with:  npm run seed
// Safe to run more than once: existing accounts and courses are skipped.

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Course = require("./models/Course");

const PASSWORD = "Learn@1234"; // demo password for all seeded accounts - change it after first login

const users = [
  { name: "Admin", email: "admin@learnsmart.com", role: "admin" },
  { name: "Aarav Mehta", email: "instructor@learnsmart.com", role: "instructor" },
  {
    name: "Demo Student",
    email: "student@learnsmart.com",
    role: "student",
    interests: ["web development", "react"],
    skills: ["html", "css", "javascript"]
  }
];

const courses = [
  {
    title: "Full Stack Web Development with MERN",
    description: "Build complete web applications with MongoDB, Express, React and Node.js.",
    category: "Web Development",
    level: "intermediate",
    skills: ["react", "node", "mongodb", "express", "javascript"],
    tags: ["mern", "full stack", "web"],
    price: 0,
    duration: 8,
    status: "published",
    lessons: [
      { title: "Introduction to the MERN stack", content: "How the four technologies fit together and how a request travels through them.", duration: 15 },
      { title: "Building a REST API with Express", content: "Routes, controllers and middleware.", duration: 40 },
      { title: "Modeling data with MongoDB and Mongoose", content: "Schemas, validation and relationships.", duration: 35 },
      { title: "React components and state", content: "Props, state and hooks.", duration: 45 },
      { title: "Connecting React to your API", content: "Axios, authentication and protected routes.", duration: 40 }
    ]
  },
  {
    title: "JavaScript for Beginners",
    description: "Learn the fundamentals of JavaScript from variables to functions and the DOM.",
    category: "Programming",
    level: "beginner",
    skills: ["javascript", "html", "css"],
    tags: ["javascript", "basics", "web"],
    price: 0,
    duration: 4,
    status: "published",
    lessons: [
      { title: "Variables and data types", content: "let, const and the core data types.", duration: 20 },
      { title: "Functions and scope", content: "Declaring functions, arrow functions and scope.", duration: 25 },
      { title: "Working with the DOM", content: "Selecting elements and handling events.", duration: 30 }
    ]
  },
  {
    title: "Python for Data Analysis",
    description: "Analyse data with Python, pandas and simple visualisations.",
    category: "Data Science",
    level: "beginner",
    skills: ["python", "pandas", "data analysis"],
    tags: ["python", "data", "analytics"],
    price: 499,
    duration: 6,
    status: "published",
    lessons: [
      { title: "Python basics refresher", content: "Lists, dictionaries and loops.", duration: 25 },
      { title: "Loading data with pandas", content: "Read CSV files and inspect a DataFrame.", duration: 30 },
      { title: "Cleaning and summarising data", content: "Missing values, grouping and aggregation.", duration: 35 }
    ]
  },
  {
    title: "Advanced React Patterns",
    description: "Custom hooks, context, performance and testing for production React apps.",
    category: "Web Development",
    level: "advanced",
    skills: ["react", "javascript", "hooks"],
    tags: ["react", "frontend", "advanced"],
    price: 799,
    duration: 5,
    status: "draft",
    lessons: [
      { title: "Custom hooks", content: "Extracting reusable logic.", duration: 30 }
    ]
  }
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Copy .env.example to .env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const hashed = await bcrypt.hash(PASSWORD, 12);
  const saved = {};

  for (const data of users) {
    let user = await User.findOne({ email: data.email });

    if (user) {
      console.log(`- ${data.email} already exists`);
    } else {
      user = await User.create({ ...data, password: hashed });
      console.log(`+ created ${data.role}: ${data.email}`);
    }

    saved[data.role] = user;
  }

  for (const data of courses) {
    const exists = await Course.findOne({ title: data.title });

    if (exists) {
      console.log(`- course "${data.title}" already exists`);
      continue;
    }

    await Course.create({ ...data, instructor: saved.instructor._id });
    console.log(`+ created course: ${data.title}`);
  }

  console.log(`\nDone. Demo password for all accounts: ${PASSWORD}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
