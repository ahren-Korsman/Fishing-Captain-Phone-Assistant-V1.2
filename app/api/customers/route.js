import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Customer from "@/lib/models/Customer";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const captainId = searchParams.get("captainId");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const page = parseInt(searchParams.get("page")) || 1;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query
    const query = {};
    if (captainId) {
      query.captainId = captainId;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get customers with pagination
    const skip = (page - 1) * limit;
    const customers = await Customer.find(query)
      .populate("captainId", "captainName businessName")
      .sort({ lastCallDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalCustomers = await Customer.countDocuments(query);

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total: totalCustomers,
        pages: Math.ceil(totalCustomers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { captainId, customerId, status, notes } = body;

    if (!captainId || !customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "captainId and customerId are required",
        },
        { status: 400 }
      );
    }

    const customer = await Customer.findOne({
      _id: customerId,
      captainId,
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
        },
        { status: 404 }
      );
    }

    // Update customer
    if (status) {
      customer.status = status;
    }
    if (notes) {
      customer.notes = notes;
    }

    await customer.save();

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update customer",
      },
      { status: 500 }
    );
  }
}
