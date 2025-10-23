import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pipelineDeals } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch all pipeline deals for the current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deals = await db
      .select()
      .from(pipelineDeals)
      .where(eq(pipelineDeals.userId, session.id))
      .orderBy(desc(pipelineDeals.createdAt));

    return NextResponse.json({ deals });
  } catch (error) {
    console.error("Error fetching pipeline deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// POST - Create a new pipeline deal
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientName,
      dealName,
      dealValue,
      stage,
      probability,
      expectedCloseDate,
      revenueBreakdown,
    } = body;

    if (!clientName || !dealName || !dealValue || !stage || !probability) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [deal] = await db
      .insert(pipelineDeals)
      .values({
        userId: session.id,
        clientName,
        dealName,
        dealValue,
        stage,
        probability,
        expectedCloseDate: expectedCloseDate || null,
        revenueBreakdown: revenueBreakdown || [],
      })
      .returning();

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error creating pipeline deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}

// PUT - Update a pipeline deal
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      clientName,
      dealName,
      dealValue,
      stage,
      probability,
      expectedCloseDate,
      revenueBreakdown,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Deal ID is required" },
        { status: 400 }
      );
    }

    const [deal] = await db
      .update(pipelineDeals)
      .set({
        clientName,
        dealName,
        dealValue,
        stage,
        probability,
        expectedCloseDate,
        revenueBreakdown,
        updatedAt: new Date(),
      })
      .where(
        and(eq(pipelineDeals.id, id), eq(pipelineDeals.userId, session.id))
      )
      .returning();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error updating pipeline deal:", error);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pipeline deal
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Deal ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(pipelineDeals)
      .where(
        and(eq(pipelineDeals.id, id), eq(pipelineDeals.userId, session.id))
      );

    return NextResponse.json({ message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Error deleting pipeline deal:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
