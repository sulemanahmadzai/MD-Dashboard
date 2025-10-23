import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashflowTransactions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch all cashflow transactions for the current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await db
      .select()
      .from(cashflowTransactions)
      .where(eq(cashflowTransactions.userId, session.id))
      .orderBy(desc(cashflowTransactions.date));

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching cashflow transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Create a new cashflow transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, description, category, type, amount } = body;

    if (!date || !description || !category || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .insert(cashflowTransactions)
      .values({
        userId: session.id,
        date,
        description,
        category,
        type,
        amount,
      })
      .returning();

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error creating cashflow transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// PUT - Update a cashflow transaction
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, date, description, category, type, amount } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .update(cashflowTransactions)
      .set({
        date,
        description,
        category,
        type,
        amount,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(cashflowTransactions.id, id),
          eq(cashflowTransactions.userId, session.id)
        )
      )
      .returning();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error updating cashflow transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a cashflow transaction
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
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(cashflowTransactions)
      .where(
        and(
          eq(cashflowTransactions.id, id),
          eq(cashflowTransactions.userId, session.id)
        )
      );

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting cashflow transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
