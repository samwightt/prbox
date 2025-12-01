import { useState, useEffect } from "react";
import { homedir } from "os";
import { join } from "path";
import type { ParsedNotification, StatusCheckState } from "../types";

// Path to store seen notifications
const SEEN_FILE = join(homedir(), ".gh-notifications-seen.json");

interface SeenData {
  seen: Record<string, {
    firstSeen: string;
    lastSeen: string;
    prNumber: number;
    repo: string;
    title: string;
    unsubscribed?: boolean;
    doneHistory?: string[]; // Array of timestamps when marked as done
  }>;
}

async function loadSeenNotifications(): Promise<SeenData> {
  try {
    const file = Bun.file(SEEN_FILE);
    if (await file.exists()) {
      return await file.json();
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return { seen: {} };
}

async function saveSeenNotifications(data: SeenData): Promise<void> {
  await Bun.write(SEEN_FILE, JSON.stringify(data, null, 2));
}

interface UserInfo {
  login: string;
  teamSlugs: string[];
}

interface GraphQLNotification {
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

interface GraphQLResponse {
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

const NOTIFICATIONS_QUERY = `
query($login: String!) {
  viewer {
    login
    organizations(first: 20) {
      nodes {
        teams(first: 50, userLogins: [$login]) {
          nodes {
            slug
          }
        }
      }
    }
    notificationThreads(first: 100, filterBy: {
      statuses: [READ, UNREAD]
    }) {
      nodes {
        id
        isUnread
        isDone
        reason
        lastUpdatedAt
        optionalSubject {
          __typename
          ... on PullRequest {
            id
            number
            title
            url
            headRefName
            isDraft
            merged
            closed
            createdAt
            author { login }
            repository {
              nameWithOwner
            }
            reviewRequests(first: 20) {
              nodes {
                requestedReviewer {
                  ... on User { login }
                  ... on Team { slug }
                }
              }
            }
            statusCheckRollup {
              state
            }
            latestReviews(first: 20) {
              nodes {
                author { login }
                state
                onBehalfOf(first: 5) {
                  nodes {
                    slug
                  }
                }
              }
            }
            reviewThreads(last: 10) {
              nodes {
                comments(last: 5) {
                  nodes {
                    author { login }
                    createdAt
                    replyTo {
                      author { login }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

interface GhAuthStatus {
  hosts: {
    "github.com"?: {
      login: string;
      scopes: string;
    }[];
  };
}

export class GhCliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GhCliError";
  }
}

async function checkGhCliAndAuth(): Promise<{ login: string }> {
  // Check if gh CLI is installed
  try {
    await Bun.$`which gh`.quiet();
  } catch {
    throw new GhCliError(
      "GitHub CLI (gh) is not installed.\n\n" +
      "Install it with:\n" +
      "  brew install gh\n\n" +
      "Then authenticate with:\n" +
      "  gh auth login -s notifications,read:org"
    );
  }

  // Check auth status and scopes
  let authStatus: GhAuthStatus;
  try {
    authStatus = await Bun.$`gh auth status --json hosts`.json() as GhAuthStatus;
  } catch {
    throw new GhCliError(
      "Not logged in to GitHub CLI.\n\n" +
      "Run:\n" +
      "  gh auth login -s notifications,read:org"
    );
  }

  const githubHosts = authStatus.hosts["github.com"];
  if (!githubHosts?.[0]?.login) {
    throw new GhCliError(
      "Not logged in to GitHub.\n\n" +
      "Run:\n" +
      "  gh auth login -s notifications,read:org"
    );
  }

  const scopes = githubHosts[0].scopes ?? "";
  if (!scopes.includes("notifications")) {
    throw new GhCliError(
      "Missing 'notifications' scope.\n\n" +
      "Run:\n" +
      "  gh auth refresh -s notifications"
    );
  }

  return { login: githubHosts[0].login };
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

export function useNotifications() {
  const [notifications, setNotifications] = useState<ParsedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchNotifications(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      // Check gh CLI installation and auth (no API call)
      const { login } = await checkGhCliAndAuth();

      // Fetch notifications and teams in one GraphQL query
      const result = await Bun.$`gh api graphql -f query=${NOTIFICATIONS_QUERY} -f login=${login}`.json() as GraphQLResponse;

      // Extract team slugs from all organizations
      const teamSlugs = result.data.viewer.organizations.nodes.flatMap(
        (org) => org.teams.nodes.map((t) => t.slug)
      );

      const userInfo: UserInfo = {
        login: result.data.viewer.login,
        teamSlugs,
      };

      const nodes = result.data.viewer.notificationThreads.nodes;

      // Filter to only PR notifications that aren't done
      const prNotifications = nodes.filter(
        (n) => !n.isDone && n.optionalSubject?.__typename === "PullRequest"
      );

      // Load seen data to check for previously unsubscribed notifications
      const seenData = await loadSeenNotifications();

      const parsed: ParsedNotification[] = prNotifications.map((n) => {
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
          updatedAt: new Date(n.lastUpdatedAt),
          createdAt: new Date(subject.createdAt ?? n.lastUpdatedAt),
          reviewRequestedFrom,
          statusCheck: parseStatusState(subject.statusCheckRollup?.state),
          isClosed,
          teamReviewedBy,
          repliedBy: hasNewReply ? replyInfo.repliedBy : null,
        };
      });

      setNotifications(parsed);
      setLoading(false);
      setRefreshing(false);

      // Track seen notifications (reuse seenData loaded earlier)
      const now = new Date().toISOString();
      for (const n of parsed) {
        const existing = seenData.seen[n.id];
        if (existing) {
          existing.lastSeen = now;
        } else {
          seenData.seen[n.id] = {
            firstSeen: now,
            lastSeen: now,
            prNumber: n.prNumber,
            repo: n.repo,
            title: n.cleanTitle,
          };
        }
      }
      await saveSeenNotifications(seenData);
    } catch (e) {
      if (e instanceof GhCliError) {
        setError(e.message);
      } else {
        setError(String(e));
      }
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    fetchNotifications(true);
  };

  const markAsRead = (id: string) => {
    const mutation = `
      mutation($id: ID!) {
        markNotificationAsRead(input: { id: $id }) {
          success
        }
      }
    `;
    Bun.spawn(["gh", "api", "graphql", "-f", `query=${mutation}`, "-f", `id=${id}`]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAsUnread = (id: string) => {
    const mutation = `
      mutation($id: ID!) {
        markNotificationsAsUnread(input: { ids: [$id] }) {
          success
        }
      }
    `;
    Bun.spawn(["gh", "api", "graphql", "-f", `query=${mutation}`, "-f", `id=${id}`]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: true } : n))
    );
  };

  const markAsDone = async (id: string) => {
    const mutation = `
      mutation($id: ID!) {
        markNotificationAsDone(input: { id: $id }) {
          success
        }
      }
    `;
    Bun.spawn(["gh", "api", "graphql", "-f", `query=${mutation}`, "-f", `id=${id}`]);

    // Record this done timestamp in history
    const seenData = await loadSeenNotifications();
    const now = new Date().toISOString();
    if (seenData.seen[id]) {
      seenData.seen[id].doneHistory = [...(seenData.seen[id].doneHistory ?? []), now];
    } else {
      const notification = notifications.find((n) => n.id === id);
      seenData.seen[id] = {
        firstSeen: now,
        lastSeen: now,
        prNumber: notification?.prNumber ?? 0,
        repo: notification?.repo ?? "",
        title: notification?.cleanTitle ?? "",
        doneHistory: [now],
      };
    }
    await saveSeenNotifications(seenData);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unsubscribe = async (id: string) => {
    // Find the notification to get its subjectId (the PR's GraphQL ID)
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    const mutation = `
      mutation($id: ID!) {
        unsubscribeFromNotifications(input: { ids: [$id] }) {
          success
        }
      }
    `;
    // Use the PR's subjectId, not the notification thread ID
    Bun.spawn(["gh", "api", "graphql", "-f", `query=${mutation}`, "-f", `id=${notification.subjectId}`]);

    // Mark as unsubscribed in seen data
    const seenData = await loadSeenNotifications();
    if (seenData.seen[id]) {
      seenData.seen[id].unsubscribed = true;
    } else {
      seenData.seen[id] = {
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        prNumber: notification.prNumber,
        repo: notification.repo,
        title: notification.cleanTitle,
        unsubscribed: true,
      };
    }
    await saveSeenNotifications(seenData);

    // Update UI to show unsubscribed
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, cleanTitle: `[unsubscribed] ${n.cleanTitle}` } : n
      )
    );
  };

  return { notifications, loading, refreshing, error, markAsRead, markAsUnread, markAsDone, unsubscribe, refresh };
}
