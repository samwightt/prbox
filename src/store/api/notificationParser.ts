import type { ParsedNotification, StatusCheckState } from "../../types";

export interface UserInfo {
  login: string;
  teamSlugs: string[];
}

export interface GraphQLNotification {
  id: string;
  isUnread: boolean;
  isDone: boolean;
  reason: string;
  lastUpdatedAt: string;
  optionalSubject: {
    __typename: string;
    id: string;
    number?: number;
    title?: string;
    url?: string;
    headRefName?: string;
    isDraft?: boolean;
    merged?: boolean;
    closed?: boolean;
    createdAt?: string;
    author?: { login: string };
    repository?: { nameWithOwner: string };
    reviewRequests?: {
      nodes: {
        requestedReviewer: {
          login?: string;
          slug?: string;
        } | null;
      }[];
    };
    statusCheckRollup?: {
      state: string;
    } | null;
    latestReviews?: {
      nodes: {
        author: { login: string } | null;
        state: string;
        onBehalfOf?: {
          nodes: {
            slug: string;
          }[];
        };
      }[];
    } | null;
    reviewThreads?: {
      nodes: {
        comments: {
          nodes: {
            author: { login: string } | null;
            createdAt: string;
            replyTo: {
              author: { login: string };
            } | null;
          }[];
        };
      }[];
    } | null;
  } | null;
}

export interface GraphQLResponse {
  data: {
    viewer: {
      notificationThreads: {
        nodes: GraphQLNotification[];
      };
      login: string;
      organizations: {
        nodes: {
          teams: {
            nodes: {
              slug: string;
            }[];
          };
        }[];
      };
    };
  };
}

export interface SeenEntry {
  firstSeen: string;
  lastSeen: string;
  prNumber: number;
  repo: string;
  title: string;
  unsubscribed?: boolean;
  doneHistory?: string[];
}

export interface SeenData {
  seen: Record<string, SeenEntry>;
}

function parseStatusState(state: string | undefined): StatusCheckState | null {
  if (!state) return null;
  if (state === "SUCCESS") return "success";
  if (state === "FAILURE" || state === "ERROR") return "failure";
  return "pending";
}

/**
 * Returns who the review is requested from (team slug or username), or null if not applicable.
 * Prefers team over user if both match.
 */
function getReviewRequestedFrom(
  subject: GraphQLNotification["optionalSubject"],
  userInfo: UserInfo
): string | null {
  if (!subject?.reviewRequests?.nodes) return null;

  let userMatch: string | null = null;

  for (const req of subject.reviewRequests.nodes) {
    const reviewer = req.requestedReviewer;
    if (!reviewer) continue;

    // Check if one of user's teams is requested (prefer team over user)
    if (reviewer.slug && userInfo.teamSlugs.includes(reviewer.slug)) {
      return reviewer.slug;
    }

    // Check if user is directly requested
    if (reviewer.login && reviewer.login === userInfo.login) {
      userMatch = reviewer.login;
    }
  }

  return userMatch;
}

/**
 * Checks if someone reviewed on behalf of one of the user's teams.
 * Returns the reviewer login and team slug if found, null otherwise.
 */
function getTeamReviewedBy(
  subject: GraphQLNotification["optionalSubject"],
  userInfo: UserInfo
): { reviewer: string; team: string; state: string } | null {
  if (!subject?.latestReviews?.nodes) return null;

  for (const review of subject.latestReviews.nodes) {
    // Skip reviews by the user themselves
    if (review.author?.login === userInfo.login) continue;

    // Check if this review was on behalf of one of user's teams
    const onBehalfOfTeams = review.onBehalfOf?.nodes ?? [];
    for (const team of onBehalfOfTeams) {
      if (userInfo.teamSlugs.includes(team.slug)) {
        return {
          reviewer: review.author?.login ?? "unknown",
          team: team.slug,
          state: review.state,
        };
      }
    }
  }

  return null;
}

/**
 * Checks if someone replied to the user's comments in review threads.
 * Returns the login of who replied and when, or null if no replies found.
 */
function getRepliedToUser(
  subject: GraphQLNotification["optionalSubject"],
  userLogin: string
): { repliedBy: string; repliedAt: string } | null {
  if (!subject?.reviewThreads?.nodes) return null;

  let latestReply: { repliedBy: string; repliedAt: string } | null = null;

  for (const thread of subject.reviewThreads.nodes) {
    for (const comment of thread.comments.nodes) {
      // Check if this comment is a reply to the user
      if (comment.replyTo?.author?.login === userLogin && comment.author?.login !== userLogin) {
        const repliedAt = comment.createdAt;
        // Track the latest reply
        if (!latestReply || repliedAt > latestReply.repliedAt) {
          latestReply = {
            repliedBy: comment.author?.login ?? "unknown",
            repliedAt,
          };
        }
      }
    }
  }

  return latestReply;
}

/**
 * Extract user info from GraphQL response.
 */
export function extractUserInfo(response: GraphQLResponse): UserInfo {
  const teamSlugs = response.data.viewer.organizations.nodes.flatMap(
    (org) => org.teams.nodes.map((t) => t.slug)
  );

  return {
    login: response.data.viewer.login,
    teamSlugs,
  };
}

/**
 * Parse raw GraphQL notifications into ParsedNotification objects.
 */
export function parseNotifications(
  response: GraphQLResponse,
  seenData: SeenData
): ParsedNotification[] {
  const userInfo = extractUserInfo(response);
  const nodes = response.data.viewer.notificationThreads.nodes;

  // Filter to only PR notifications that aren't done
  const prNotifications = nodes.filter(
    (n) => !n.isDone && n.optionalSubject?.__typename === "PullRequest"
  );

  return prNotifications.map((n) => {
    const subject = n.optionalSubject!;
    let cleanTitle = (subject.title ?? "")
      .replace(/\[sc[- ]\d+\]\s*/i, "") // Remove Shortcut ID (sc-123 or sc 123)
      .replace(/^[\s\-:]+/, "") // Remove leading " - ", ": ", etc.
      .trim();

    // Check if this notification was previously unsubscribed
    if (seenData.seen[n.id]?.unsubscribed) {
      cleanTitle = `[unsubscribed] ${cleanTitle}`;
    }

    // Check if review is requested from user or their teams
    const reviewRequestedFrom = getReviewRequestedFrom(subject, userInfo);

    // Check if user has explicitly approved this PR
    const userApproved = subject.latestReviews?.nodes.some(
      (review) => review.author?.login === userInfo.login && review.state === "APPROVED"
    ) ?? false;

    // Check if user has already reviewed this PR (any review type)
    const userReviewed = subject.latestReviews?.nodes.some(
      (review) => review.author?.login === userInfo.login &&
        (review.state === "APPROVED" || review.state === "CHANGES_REQUESTED" || review.state === "COMMENTED")
    ) ?? false;

    // Check if a teammate reviewed on behalf of user's team
    const teamReviewedBy = getTeamReviewedBy(subject, userInfo);

    // Check if someone replied to the user's comments
    const replyInfo = getRepliedToUser(subject, userInfo.login);

    // Check if this is a NEW reply (newer than when we last marked done)
    const seenEntry = seenData.seen[n.id];
    const lastDoneAt = seenEntry?.doneHistory?.length
      ? seenEntry.doneHistory[seenEntry.doneHistory.length - 1]
      : null;
    const hasNewReply = replyInfo && (!lastDoneAt || replyInfo.repliedAt > lastDoneAt);

    // Override reason based on PR state
    // Priority: needs_review (unless user approved) > replied > closed > team_reviewed > merged > reviewed > draft > original
    let reason = n.reason.toLowerCase();
    const isClosed = !!(subject.closed && !subject.merged);
    if (subject.isDraft) reason = "draft";
    if (userReviewed) reason = "reviewed";
    if (subject.merged) reason = "merged";
    if (teamReviewedBy) reason = "team_reviewed";
    if (isClosed) reason = "closed";
    if (hasNewReply) reason = "replied";
    // Only set to needs_review if user hasn't already approved
    if (reviewRequestedFrom && !userApproved) reason = "needs_review";

    return {
      reason,
      repo: subject.repository?.nameWithOwner ?? "",
      cleanTitle,
      prNumber: subject.number ?? 0,
      branch: subject.headRefName ?? null,
      author: subject.author?.login ?? null,
      url: subject.url ?? "",
      id: n.id,
      subjectId: subject.id,
      unread: n.isUnread,
      updatedAt: n.lastUpdatedAt,
      createdAt: subject.createdAt ?? n.lastUpdatedAt,
      reviewRequestedFrom,
      statusCheck: parseStatusState(subject.statusCheckRollup?.state),
      isClosed,
      teamReviewedBy,
      repliedBy: hasNewReply ? replyInfo.repliedBy : null,
    };
  });
}
