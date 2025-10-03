import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Captain from "@/lib/models/Captain";

export async function PATCH(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { captainId, vapiAssistantId } = body;

    if (!captainId || !vapiAssistantId) {
      return NextResponse.json(
        {
          success: false,
          error: "captainId and vapiAssistantId are required",
        },
        { status: 400 }
      );
    }

    const captain = await Captain.findById(captainId);
    if (!captain) {
      return NextResponse.json(
        {
          success: false,
          error: "Captain not found",
        },
        { status: 404 }
      );
    }

    captain.vapiAssistantId = vapiAssistantId;
    await captain.save();

    console.log(
      `✅ Captain ${captain.captainName} updated with assistant ID: ${vapiAssistantId}`
    );

    return NextResponse.json({
      success: true,
      message: "Assistant ID updated successfully",
      captain: {
        id: captain._id,
        captainName: captain.captainName,
        vapiAssistantId: captain.vapiAssistantId,
      },
    });
  } catch (error) {
    console.error("Error updating assistant ID:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update assistant ID",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Captain update endpoint",
      instructions:
        "Send a PATCH request with captainId and vapiAssistantId to update a captain's assistant ID",
    },
    { status: 200 }
  );
}
