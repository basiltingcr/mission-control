import { NextResponse } from "next/server";
import { getDecisions, mutateDecisions, mutateActivityLog } from "@/lib/data";
import type { DecisionItem, ActivityEvent } from "@/lib/types";
import { decisionCreateSchema, decisionUpdateSchema, validateBody, DEFAULT_LIMIT } from "@/lib/validations";
import { generateId } from "@/lib/utils";
import { deriveResolution } from "@/lib/proposal";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const data = await getDecisions();

  const total = data.decisions.length;
  // Backfill proposal fields for decisions written before the fork added them
  let decisions = data.decisions.map((d) => ({
    ...d,
    recommendedOption: d.recommendedOption ?? null,
    door: d.door ?? null,
    evidence: d.evidence ?? "",
    expiresAt: d.expiresAt ?? null,
    onExpiry: d.onExpiry ?? null,
    resolution: d.resolution ?? null,
  }));

  if (status) {
    decisions = decisions.filter((d) => d.status === status);
  }

  // Sort: pending first, then by date newest first
  decisions.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Pagination
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const totalFiltered = decisions.length;
  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 50) : DEFAULT_LIMIT;
  const offset = Math.max(0, parseInt(offsetParam ?? "0", 10));
  decisions = decisions.slice(offset, offset + limit);

  return NextResponse.json(
    {
      data: decisions, decisions,
      meta: { total, filtered: totalFiltered, returned: decisions.length, limit, offset },
    },
    { headers: { "Cache-Control": "private, max-age=2, stale-while-revalidate=5" } },
  );
}

export async function POST(request: Request) {
  const validation = await validateBody(request, decisionCreateSchema);
  if (!validation.success) return validation.error;
  const body = validation.data;

  const newDecision = await mutateDecisions(async (data) => {
    const decision: DecisionItem = {
      id: generateId("dec"),
      requestedBy: body.requestedBy,
      taskId: body.taskId,
      question: body.question,
      options: body.options,
      context: body.context,
      status: "pending",
      answer: null,
      answeredAt: null,
      createdAt: body.createdAt ?? new Date().toISOString(),
      recommendedOption: body.recommendedOption,
      door: body.door,
      evidence: body.evidence,
      expiresAt: body.expiresAt,
      onExpiry: body.onExpiry,
      resolution: null,
    };
    data.decisions.push(decision);
    return decision;
  });

  // Log activity
  await mutateActivityLog(async (logData) => {
    const event: ActivityEvent = {
      id: generateId("evt"),
      type: "decision_requested",
      actor: newDecision.requestedBy,
      taskId: newDecision.taskId,
      summary: `Decision requested: ${newDecision.question.slice(0, 80)}`,
      details: newDecision.context,
      timestamp: new Date().toISOString(),
    };
    logData.events.push(event);
  });

  return NextResponse.json(newDecision, { status: 201 });
}

export async function PUT(request: Request) {
  const validation = await validateBody(request, decisionUpdateSchema);
  if (!validation.success) return validation.error;
  const body = validation.data;

  const result = await mutateDecisions(async (data) => {
    const idx = data.decisions.findIndex((d) => d.id === body.id);
    if (idx === -1) return null;

    // Auto-set status to "answered" when an answer is provided
    const effectiveStatus = body.answer && data.decisions[idx].status === "pending"
      ? "answered"
      : (body.status ?? data.decisions[idx].status);
    const wasAnswered = data.decisions[idx].status === "pending" && effectiveStatus === "answered";

    const existing = data.decisions[idx];
    data.decisions[idx] = {
      ...existing,
      ...body,
      status: effectiveStatus,
      answeredAt: wasAnswered ? new Date().toISOString() : existing.answeredAt,
      resolution: deriveResolution(
        { recommendedOption: existing.recommendedOption ?? null, resolution: existing.resolution ?? null },
        body.answer,
        body.resolution,
      ),
    };

    return { decision: data.decisions[idx], wasAnswered };
  });

  if (!result) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }

  // Log activity if decision was just answered
  if (result.wasAnswered) {
    await mutateActivityLog(async (logData) => {
      const event: ActivityEvent = {
        id: generateId("evt"),
        type: "decision_answered",
        actor: "me",
        taskId: result.decision.taskId,
        summary: body.answer
          ? `Answered: ${result.decision.question.slice(0, 60)} → "${body.answer}"`
          : `${result.decision.resolution === "rejected" ? "Rejected" : "Resolved"}: ${result.decision.question.slice(0, 60)}`,
        details: "",
        timestamp: new Date().toISOString(),
      };
      logData.events.push(event);
    });
  }

  return NextResponse.json(result.decision);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await mutateDecisions(async (data) => {
    data.decisions = data.decisions.filter((d) => d.id !== id);
  });

  return NextResponse.json({ ok: true });
}
