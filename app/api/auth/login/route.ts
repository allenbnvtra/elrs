import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";
import { verifyPassword, generateToken } from "@/lib/auth";
import { User, Student, Faculty } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("🔐 Login attempt for:", email);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCollection = db.collection<User>("users");

    // Find user by email
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      console.log("❌ Invalid password");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check account approval status for students and faculty
    if (user.role === "student" || user.role === "faculty") {
      const userWithStatus = user as Student | Faculty;
      
      if (userWithStatus.status === "pending") {
        console.log("⏳ Account pending approval for:", email);
        return NextResponse.json(
          { 
            error: user.role === "student" 
              ? "Your account is pending approval. Please wait for verification from your coordinator or administrator."
              : "Your coordinator account is pending admin approval. Please wait for verification.",
            status: "pending"
          },
          { status: 403 }
        );
      }

      if (userWithStatus.status === "rejected") {
        console.log("❌ Account rejected for:", email);
        return NextResponse.json(
          { 
            error: "Your account has been rejected. Please contact support for more information.",
            status: "rejected"
          },
          { status: 403 }
        );
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    console.log("✅ Login successful for:", email, "Role:", user.role);

    // Create response with user data (excluding password)
    const userData: any = {
      id: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Add role-specific fields
    if (user.role === "student") {
      const student = user as Student;
      userData.studentNumber = student.studentNumber;
      userData.course = student.course;
      userData.status = student.status;
      userData.enrolledCourseIds = student.enrolledCourseIds || [];
    } else if (user.role === "faculty") {
      const faculty = user as Faculty;
      userData.course = faculty.course;
      userData.department = faculty.department;
      userData.status = faculty.status;
      userData.contributions = faculty.contributions || 0;
      userData.courseIdsTeaching = faculty.courseIdsTeaching || [];
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: userData,
        token,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with token
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("❌ Login error:", error);
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