import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch all projects for the current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, session.id))
      .orderBy(desc(projects.date));

    return NextResponse.json({ projects: userProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      clientProject,
      projectNumber,
      valueQuoted,
      quotedCurrency,
      valueSGD,
      numberOfStudies,
      purchaseOrder,
      fieldWorkStatus,
      fieldWorkStartDate,
      fieldWorkEndDate,
      reportStatus,
      invoiceStatus,
      invoiceDate,
    } = body;

    if (!date || !clientProject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        userId: session.id,
        date,
        clientProject,
        projectNumber,
        valueQuoted,
        quotedCurrency: quotedCurrency || "USD",
        valueSGD,
        numberOfStudies,
        purchaseOrder,
        fieldWorkStatus: fieldWorkStatus || "Not Started",
        fieldWorkStartDate,
        fieldWorkEndDate,
        reportStatus: reportStatus || "Not Started",
        invoiceStatus: invoiceStatus || "Not Issued",
        invoiceDate,
      })
      .returning();

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// PUT - Update a project
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
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const [project] = await db
      .update(projects)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, session.id)))
      .returning();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
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
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, session.id)));

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
