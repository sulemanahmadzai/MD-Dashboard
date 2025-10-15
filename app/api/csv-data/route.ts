import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { csvUploads } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch CSV data (all authenticated users can read)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the latest active uploads for each file type
    const data = await db
      .select()
      .from(csvUploads)
      .where(eq(csvUploads.isActive, true))
      .orderBy(desc(csvUploads.uploadedAt));

    // Group by fileType and get the most recent for each type
    const latestData: Record<string, any> = {};
    data.forEach((upload) => {
      if (!latestData[upload.fileType]) {
        latestData[upload.fileType] = upload.data;
      }
    });

    return NextResponse.json({
      shopify: latestData.shopify || null,
      tiktok: latestData.tiktok || null,
      subscription: latestData.subscription || null,
      pl_client1: latestData.pl_client1 || null,
      pl_client2: latestData.pl_client2 || null,
    });
  } catch (error) {
    console.error("Error fetching CSV data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

// POST - Upload CSV data (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can upload data" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileType, data } = body;

    if (!fileType || !data) {
      return NextResponse.json(
        { error: "Missing fileType or data" },
        { status: 400 }
      );
    }

    // Validate fileType
    if (
      ![
        "shopify",
        "tiktok",
        "subscription",
        "pl_client1",
        "pl_client2",
      ].includes(fileType)
    ) {
      return NextResponse.json({ error: "Invalid fileType" }, { status: 400 });
    }

    // Remove ALL previous uploads of this type (hard delete)
    await db.delete(csvUploads).where(eq(csvUploads.fileType, fileType));

    // Insert new upload
    const [newUpload] = await db
      .insert(csvUploads)
      .values({
        fileType,
        data,
        uploadedBy: session.id,
      })
      .returning();

    return NextResponse.json({
      message: "Data uploaded successfully",
      upload: {
        id: newUpload.id,
        fileType: newUpload.fileType,
        uploadedAt: newUpload.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Error uploading CSV data:", error);
    return NextResponse.json(
      { error: "Failed to upload data" },
      { status: 500 }
    );
  }
}

// DELETE - Remove CSV data for a given fileType (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete data" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("fileType");

    if (
      !fileType ||
      ![
        "shopify",
        "tiktok",
        "subscription",
        "pl_client1",
        "pl_client2",
      ].includes(fileType)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing fileType" },
        { status: 400 }
      );
    }

    // Hard-delete all uploads for this file type
    await db.delete(csvUploads).where(eq(csvUploads.fileType, fileType));

    return NextResponse.json({
      message: "Data deleted successfully",
      fileType,
    });
  } catch (error) {
    console.error("Error deleting CSV data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
