"use client";

import { Clock, Lock, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DecisionItem, DecisionResolution } from "@/lib/types";

/** Proposal fields on a decision (fork, MC-004). Renders nothing for a plain decision. */
export function ProposalMeta({ decision }: { decision: DecisionItem }) {
  const door = decision.door ?? null;
  const expiresAt = decision.expiresAt ?? null;
  const evidence = decision.evidence ?? "";
  if (!door && !expiresAt && !evidence) return null;

  return (
    <div className="space-y-2">
      {(door || expiresAt) && (
        <div className="flex flex-wrap items-center gap-2">
          {door === "two_way" && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              <RotateCcw className="h-3 w-3" /> Two-way door
            </Badge>
          )}
          {door === "one_way" && (
            <Badge variant="destructive" className="gap-1 text-xs font-normal">
              <Lock className="h-3 w-3" /> One-way door
            </Badge>
          )}
          {expiresAt && (
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <Clock className="h-3 w-3" />
              Expires {new Date(expiresAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              {decision.onExpiry === "apply_recommendation" && " · then applies the recommendation"}
              {decision.onExpiry === "reject" && " · then rejected"}
            </Badge>
          )}
        </div>
      )}
      {evidence && (
        <div className="text-xs bg-muted/50 rounded-md px-3 py-2">
          <span className="font-medium text-foreground">Evidence: </span>
          <span className="text-muted-foreground whitespace-pre-line">{evidence}</span>
        </div>
      )}
    </div>
  );
}

export function isRecommended(decision: DecisionItem, option: string): boolean {
  return decision.recommendedOption !== null && decision.recommendedOption !== undefined && decision.recommendedOption === option;
}

export const RESOLUTION_LABEL: Record<DecisionResolution, string> = {
  accepted: "accepted the recommendation",
  edited: "chose a different option",
  rejected: "rejected",
  expired: "expired",
};
