import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";
import Call from "@/lib/models/Call";
import Customer from "@/lib/models/Customer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const useSampleData = searchParams.get("useSampleData") === "true";

    await connectDB();

    // Get total counts
    const totalCaptains = await Captain.countDocuments();
    const totalCalls = await Call.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const activeCaptains = await Captain.countDocuments({
      serviceEnabled: true,
    });

    // Get call statistics for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStats = await Call.aggregate([
      {
        $match: {
          startedAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          completedCalls: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          avgDuration: { $avg: "$duration" },
          inProgressCalls: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
          },
        },
      },
    ]);

    const callStats = todayStats[0] || {
      totalCalls: 0,
      completedCalls: 0,
      avgDuration: 0,
      inProgressCalls: 0,
    };

    // Get top captains by call count
    const topCaptains = await Call.aggregate([
      {
        $group: {
          _id: "$captainId",
          callCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "captains",
          localField: "_id",
          foreignField: "_id",
          as: "captain",
        },
      },
      {
        $unwind: "$captain",
      },
      {
        $project: {
          _id: "$captain._id",
          captainName: "$captain.captainName",
          businessName: "$captain.businessName",
          callCount: 1,
        },
      },
      {
        $sort: { callCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Get calls by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const callsByMonth = await Call.aggregate([
      {
        $match: {
          startedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$startedAt" },
            month: { $month: "$startedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get customers by month (last 6 months)
    const customersByMonth = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Generate sample data if no real data exists
    const generateSampleData = () => {
      const months = [];
      const currentDate = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
          },
          count: Math.floor(Math.random() * 50) + 20, // 20-70 calls
        });
      }
      return months;
    };

    const generateSampleCustomers = () => {
      const months = [];
      const currentDate = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        months.push({
          _id: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
          },
          count: Math.floor(Math.random() * 30) + 10, // 10-40 customers
        });
      }
      return months;
    };

    const generateSampleCaptains = () => {
      const sampleNames = [
        {
          captainName: "Captain Mike",
          businessName: "Mike's Deep Sea Charters",
        },
        {
          captainName: "Captain Sarah",
          businessName: "Sarah's Fishing Adventures",
        },
        { captainName: "Captain Tom", businessName: "Tom's Offshore Tours" },
        { captainName: "Captain Lisa", businessName: "Lisa's Charter Service" },
        { captainName: "Captain Dave", businessName: "Dave's Fishing Fleet" },
      ];

      return sampleNames.map((captain, index) => ({
        _id: `sample-${index}`,
        captainName: captain.captainName,
        businessName: captain.businessName,
        callCount: Math.floor(Math.random() * 100) + 20, // 20-120 calls
      }));
    };

    // Use sample data only if explicitly requested
    const finalCallsByMonth = useSampleData
      ? generateSampleData()
      : callsByMonth;
    const finalCustomersByMonth = useSampleData
      ? generateSampleCustomers()
      : customersByMonth;
    const finalTopCaptains = useSampleData
      ? generateSampleCaptains()
      : topCaptains;

    const stats = {
      totalCaptains: useSampleData
        ? Math.floor(Math.random() * 20) + 15
        : totalCaptains,
      totalCalls: useSampleData
        ? Math.floor(Math.random() * 500) + 200
        : totalCalls,
      totalCustomers: useSampleData
        ? Math.floor(Math.random() * 300) + 150
        : totalCustomers,
      activeCaptains: useSampleData
        ? Math.floor(Math.random() * 15) + 10
        : activeCaptains,
      callStats: useSampleData
        ? {
            totalCalls: Math.floor(Math.random() * 20) + 5,
            completedCalls: Math.floor(Math.random() * 15) + 3,
            avgDuration: Math.floor(Math.random() * 300) + 120,
            inProgressCalls: Math.floor(Math.random() * 3),
          }
        : callStats,
      topCaptains: finalTopCaptains,
      callsByMonth: finalCallsByMonth,
      customersByMonth: finalCustomersByMonth,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch admin statistics",
      },
      { status: 500 }
    );
  }
}
