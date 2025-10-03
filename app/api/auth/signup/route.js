import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, email, password",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // Check if this email should be admin (from environment variables)
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const isAdmin = adminEmails.includes(email.toLowerCase());

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      provider: "credentials",
      role: isAdmin ? "admin" : "captain",
      isActive: true,
    });

    await user.save();

    console.log(`✅ New user created: ${user.email} (${user.role})`);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully!",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create user",
      },
      { status: 500 }
    );
  }
}
