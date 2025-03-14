import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import dotenv from 'dotenv';

dotenv.config();



// GET user by address
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  const userId = req.nextUrl.searchParams.get("userId");

  try {
    let user;
    if (address) {
      user = await prisma.user.findUnique({
        where: {
          address: address,
        },
      });
    }
    if (userId) {
      user = await prisma.user.findFirst({
        where: {
          userId: userId,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, userId, privateKey } = body;


    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }


    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        address: address,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        address: address,
        privateKey: privateKey,
        userId: userId,
      } as any,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update user information
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, ...otherUpdates } = body;

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        address: address,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user if there are any updates
    if (Object.keys(otherUpdates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        address: address,
      },
      data: otherUpdates,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 
