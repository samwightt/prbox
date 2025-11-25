export type StatusCheckState = "success" | "pending" | "failure";

export interface ParsedNotification {
  reason: string;
  repo: string;
  cleanTitle: string;
  prNumber: number;
  branch: string | null;
  author: string | null;
  url: string;
  /** GraphQL node ID (NT_kwDO...) for mutations */
  id: string;
  unread: boolean;
  updatedAt: Date;
  createdAt: Date;
  /** Who the review is requested from (team slug or username) - only set for needs_review */
  reviewRequestedFrom: string | null;
  /** Status check state for the PR */
  statusCheck: StatusCheckState | null;
  /** Whether the PR was closed without merging */
  isClosed: boolean;
  /** Info about a teammate who reviewed on behalf of user's team */
  teamReviewedBy: { reviewer: string; team: string; state: string } | null;
  /** Who replied to the user's comment, if any */
  repliedBy: string | null;
}

export type DisplayItem =
  | { type: "repo"; repo: string }
  | { type: "reason"; repo: string; reason: string; count: number }
  | { type: "notification"; repo: string; reason: string; notification: ParsedNotification; flatIndex: number };
