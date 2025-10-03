import { NextResponse } from "next/server";
import {
  createCustomerInfoTool,
  createCallbackSchedulingTool,
  createTransferCallTool,
  getAllTools,
  deleteTool,
} from "@/lib/vapi";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create":
        const { toolType } = body;
        let tool;

        switch (toolType) {
          case "customer_info":
            tool = await createCustomerInfoTool();
            break;
          case "callback_scheduling":
            tool = await createCallbackSchedulingTool();
            break;
          case "transfer_call":
            tool = await createTransferCallTool();
            break;
          default:
            return NextResponse.json(
              {
                error:
                  "Invalid toolType. Use 'customer_info', 'callback_scheduling', or 'transfer_call'",
              },
              { status: 400 }
            );
        }

        return NextResponse.json(
          {
            success: true,
            message: `VAPI ${toolType} tool created successfully!`,
            tool,
          },
          { status: 201 }
        );

      case "create_all":
        const tools = await Promise.all([
          createCustomerInfoTool(),
          createCallbackSchedulingTool(),
          createTransferCallTool(),
        ]);

        return NextResponse.json(
          {
            success: true,
            message: "All core VAPI tools created successfully!",
            tools,
            count: tools.length,
          },
          { status: 201 }
        );

      case "list":
        const allTools = await getAllTools();
        return NextResponse.json(
          {
            success: true,
            tools: allTools,
            count: allTools.length,
          },
          { status: 200 }
        );

      case "delete":
        const { toolId } = body;
        if (!toolId) {
          return NextResponse.json(
            { error: "toolId is required for delete action" },
            { status: 400 }
          );
        }
        const deleteResult = await deleteTool(toolId);
        return NextResponse.json(
          {
            success: true,
            message: "Tool deleted successfully!",
            result: deleteResult,
          },
          { status: 200 }
        );

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Use 'create', 'create_all', 'list', or 'delete'",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in VAPI tools endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process tool request",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tools = await getAllTools();
    return NextResponse.json(
      {
        success: true,
        message: "VAPI tools retrieved successfully!",
        tools,
        count: tools.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching VAPI tools:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch tools",
      },
      { status: 500 }
    );
  }
}
