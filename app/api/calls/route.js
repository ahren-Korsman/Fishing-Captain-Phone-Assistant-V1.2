import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Call from "@/lib/models/Call";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Captain from "@/lib/models/Captain";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const captainId = searchParams.get("captainId");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const page = parseInt(searchParams.get("page")) || 1;
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build query
    const query = {};
    if (captainId) {
      query.captainId = captainId;
    }
    if (status) {
      query.status = status;
    }
    if (dateFrom || dateTo) {
      query.startedAt = {};
      if (dateFrom) {
        query.startedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.startedAt.$lte = new Date(dateTo);
      }
    }

    // Get calls with pagination
    const skip = (page - 1) * limit;
    const calls = await Call.find(query)
      .populate("captainId", "captainName businessName")
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCalls = await Call.countDocuments(query);

    return NextResponse.json({
      success: true,
      calls,
      pagination: {
        page,
        limit,
        total: totalCalls,
        pages: Math.ceil(totalCalls / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch calls",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { captainId, callId, status, notes } = body;

    if (!captainId || !callId) {
      return NextResponse.json(
        {
          success: false,
          error: "captainId and callId are required",
        },
        { status: 400 }
      );
    }

    const call = await Call.findOne({
      callId,
      captainId,
    });

    if (!call) {
      return NextResponse.json(
        {
          success: false,
          error: "Call not found",
        },
        { status: 404 }
      );
    }

    // Update call
    if (status) {
      call.status = status;
    }
    if (notes) {
      call.notes = notes;
    }

    await call.save();

    return NextResponse.json({
      success: true,
      message: "Call updated successfully",
      call,
    });
  } catch (error) {
    console.error("Error updating call:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update call",
      },
      { status: 500 }
    );
  }
}
