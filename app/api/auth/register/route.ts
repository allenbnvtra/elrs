import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Student, Faculty, Admin, CourseType } from "@/models/User";

const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, studentNumber, email, password, userType, course } = body;

    console.log("📝 Signup request received:", { fullName, email, userType, course });

    // Validation
    if (!fullName || !email || !password || !userType) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Validate userType
    if (userType !== "student" && userType !== "faculty" && userType !== "admin") {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      );
    }

    // Student number is required only for students
    if (userType === "student" && !studentNumber) {
      return NextResponse.json(
        { error: "Student number is required for students" },
        { status: 400 }
      );
    }

    // Course is required for students and faculty
    if ((userType === "student" || userType === "faculty") && !course) {
      return NextResponse.json(
        { error: "Course is required" },
        { status: 400 }
      );
    }

    // Validate course
    if ((userType === "student" || userType === "faculty") && course !== "BSGE" && course !== "BSABEN") {
      return NextResponse.json(
        { error: "Invalid course. Must be BSGE or BSABEN" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Connect to database
    console.log("🔌 Attempting to connect to MongoDB...");
    const client = await clientPromise;
    console.log("✅ MongoDB client connected");
    
    const db = client.db(dbName);
    console.log(`✅ Database selected: ${dbName}`);
    
    const usersCollection = db.collection<User>("users");
    console.log("✅ Users collection accessed");

    // Check if email already exists
    console.log("🔍 Checking for existing email...");
    const existingEmail = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      console.log("⚠️ Email already exists");
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    console.log("✅ Email is unique");

    // Check if student number already exists (only for students)
    if (userType === "student") {
      console.log("🔍 Checking for existing student number...");
      const existingStudent = await usersCollection.findOne({ studentNumber: studentNumber });
      if (existingStudent) {
        console.log("⚠️ Student number already exists");
        return NextResponse.json(
          { error: "Student number already registered" },
          { status: 409 }
        );
      }
      console.log("✅ Student number is unique");
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log("✅ Password hashed");

    // Create user object based on type
    const now = new Date();
    let newUser: Omit<Student | Faculty | Admin, "_id">;

    if (userType === "student") {
      newUser = {
        name: fullName,
        email: email.toLowerCase(),
        passwordHash,
        role: "student",
        studentNumber: studentNumber,
        course: course as CourseType,
        enrolledCourseIds: [],
        createdAt: now,
        updatedAt: now,
      } as Omit<Student, "_id">;
    } else if (userType === "faculty") {
      newUser = {
        name: fullName,
        email: email.toLowerCase(),
        passwordHash,
        role: "faculty",
        course: course as CourseType,
        department: course === "BSGE" ? "Geodetic Engineering" : "Agricultural and Biosystems Engineering",
        courseIdsTeaching: [],
        createdAt: now,
        updatedAt: now,
      } as Omit<Faculty, "_id">;
    } else {
      // Admin
      newUser = {
        name: fullName,
        email: email.toLowerCase(),
        passwordHash,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      } as Omit<Admin, "_id">;
    }

    // Insert user into database
    console.log("💾 Inserting user into database...");
    const result = await usersCollection.insertOne(newUser as any);
    console.log("✅ User inserted with ID:", result.insertedId);

    // Fetch the created user (without password)
    console.log("🔍 Fetching created user...");
    const createdUser = await usersCollection.findOne(
      { _id: result.insertedId },
      { projection: { passwordHash: 0 } }
    );
    console.log("✅ User fetched successfully");

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: createdUser,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Signup error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" 
          ? error instanceof Error ? error.message : "Unknown error"
          : undefined
      },
      { status: 500 }
    );
  }
}