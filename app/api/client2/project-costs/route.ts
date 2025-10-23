import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectCosts } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch all project costs for the current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const costs = await db
      .select()
      .from(projectCosts)
      .where(eq(projectCosts.userId, session.id))
      .orderBy(desc(projectCosts.monthYear));

    return NextResponse.json({ projectCosts: costs });
  } catch (error) {
    console.error("Error fetching project costs:", error);
    return NextResponse.json(
      { error: "Failed to fetch project costs" },
      { status: 500 }
    );
  }
}

// POST - Create a new project cost
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      monthYear,
      projectName,
      client,
      market,
      baseAmountUSD,
      dataUSD,
      totalAmountUSD,
      baseAmountSGD,
      dataSGD,
      totalAmountSGD,
      projectRevenue,
      costPercentage,
      status,
    } = body;

    if (!monthYear || !projectName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [cost] = await db
      .insert(projectCosts)
      .values({
        userId: session.id,
        monthYear,
        projectName,
        client,
        market,
        baseAmountUSD,
        dataUSD,
        totalAmountUSD,
        baseAmountSGD,
        dataSGD,
        totalAmountSGD,
        projectRevenue,
        costPercentage,
        status: status || "Pending",
      })
      .returning();

    return NextResponse.json({ projectCost: cost });
  } catch (error) {
    console.error("Error creating project cost:", error);
    return NextResponse.json(
      { error: "Failed to create project cost" },
      { status: 500 }
    );
  }
}

// PUT - Update a project cost
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Project cost ID is required" },
        { status: 400 }
      );
    }

    const [cost] = await db
      .update(projectCosts)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(projectCosts.id, id), eq(projectCosts.userId, session.id)))
      .returning();

    if (!cost) {
      return NextResponse.json(
        { error: "Project cost not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ projectCost: cost });
  } catch (error) {
    console.error("Error updating project cost:", error);
    return NextResponse.json(
      { error: "Failed to update project cost" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project cost
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
        { error: "Project cost ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(projectCosts)
      .where(and(eq(projectCosts.id, id), eq(projectCosts.userId, session.id)));

    return NextResponse.json({ message: "Project cost deleted successfully" });
  } catch (error) {
    console.error("Error deleting project cost:", error);
    return NextResponse.json(
      { error: "Failed to delete project cost" },
      { status: 500 }
    );
  }
}
