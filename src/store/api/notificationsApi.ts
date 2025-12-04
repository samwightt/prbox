import { createApi } from "@reduxjs/toolkit/query/react";
import { $ } from "execa";
import { ghGraphQLBaseQuery } from "./ghBaseQuery";
import { parseNotifications, type GraphQLResponse } from "./notificationParser";
import { loadSeenNotifications } from "./seenStorage";
import type { ParsedNotification } from "../../types";

interface GhAuthStatus {
  hosts: {
    "github.com"?: {
      login: string;
      scopes: string;
    }[];
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

async function checkGhCliAndAuth(): Promise<{ login: string }> {
  // Check if gh CLI is installed
  try {
    await $`which gh`;
  } catch {
    throw new Error(
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
    const { stdout } = await $`gh auth status --json hosts`;
    authStatus = JSON.parse(stdout) as GhAuthStatus;
  } catch {
    throw new Error(
      "Not logged in to GitHub CLI.\n\n" +
      "Run:\n" +
      "  gh auth login -s notifications,read:org"
    );
  }

  const githubHosts = authStatus.hosts["github.com"];
  if (!githubHosts?.[0]?.login) {
    throw new Error(
      "Not logged in to GitHub.\n\n" +
      "Run:\n" +
      "  gh auth login -s notifications,read:org"
    );
  }

  const scopes = githubHosts[0].scopes ?? "";
  if (!scopes.includes("notifications")) {
    throw new Error(
      "Missing 'notifications' scope.\n\n" +
      "Run:\n" +
      "  gh auth refresh -s notifications"
    );
  }

  return { login: githubHosts[0].login };
}

// All batch executors register themselves here
const allBatchExecutors: { flush: () => Promise<number> | null }[] = [];

/**
 * Debounced batch executor for GraphQL mutations.
 * Collects IDs and fires a single batched mutation after a delay.
 */
function createBatchedMutationExecutor(
  mutationTemplate: (ids: string[]) => string,
  debounceMs = 5000
) {
  let pendingIds: string[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingIds.length === 0) return null;

    const ids = pendingIds;
    pendingIds = [];

    const mutation = mutationTemplate(ids);
    const proc = $({ reject: false })`gh api graphql -f query=${mutation}`;
    return proc;
  };

  const enqueue = (id: string) => {
    pendingIds.push(id);
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(flush, debounceMs);
  };

  enqueue.flush = flush;

  // Auto-register
  allBatchExecutors.push({ flush });

  return enqueue;
}

// Batched mutation executors for each operation type
const batchMarkAsRead = createBatchedMutationExecutor(
  (ids) => `mutation { markNotificationsAsRead(input: { ids: ${JSON.stringify(ids)} }) { success } }`
);

const batchMarkAsUnread = createBatchedMutationExecutor(
  (ids) => `mutation { markNotificationsAsUnread(input: { ids: ${JSON.stringify(ids)} }) { success } }`
);

const batchMarkAsDone = createBatchedMutationExecutor(
  (ids) => `mutation { markNotificationsAsDone(input: { ids: ${JSON.stringify(ids)} }) { success } }`
);

const batchUnsubscribe = createBatchedMutationExecutor(
  (ids) => `mutation { unsubscribeFromNotifications(input: { ids: ${JSON.stringify(ids)} }) { success } }`
);

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: ghGraphQLBaseQuery,
  tagTypes: ["Notification"],

  endpoints: (builder) => ({
    getNotifications: builder.query<ParsedNotification[], void>({
      queryFn: async (_, _api, _extraOptions, baseQuery) => {
        try {
          // Check gh CLI installation and auth
          const { login } = await checkGhCliAndAuth();

          // Fetch notifications via baseQuery
          const result = await baseQuery({
            query: NOTIFICATIONS_QUERY,
            variables: { login },
          });

          if (result.error) {
            return { error: result.error };
          }

          // Load seen data for parsing
          const seenData = await loadSeenNotifications();

          // Parse the response
          const parsed = parseNotifications(
            result.data as GraphQLResponse,
            seenData
          );

          return { data: parsed };
        } catch (e) {
          return {
            error: {
              message: String(e),
              type: "UNKNOWN" as const,
            },
          };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Notification" as const, id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    markAsRead: builder.mutation<void, string>({
      queryFn: async (id) => {
        batchMarkAsRead(id);
        return { data: undefined };
      },
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        // Optimistic update
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const notification = draft.find((n) => n.id === id);
            if (notification) {
              notification.unread = false;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    markAsUnread: builder.mutation<void, string>({
      queryFn: async (id) => {
        batchMarkAsUnread(id);
        return { data: undefined };
      },
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        // Optimistic update
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const notification = draft.find((n) => n.id === id);
            if (notification) {
              notification.unread = true;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    markAsDone: builder.mutation<void, { id: string; subjectId: string }>({
      queryFn: async ({ id }) => {
        batchMarkAsDone(id);
        return { data: undefined };
      },
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
        // Optimistic update - remove from list
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const index = draft.findIndex((n) => n.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    unsubscribe: builder.mutation<void, { id: string; subjectId: string }>({
      queryFn: async ({ subjectId }) => {
        // Use subjectId (PR's GraphQL ID) for unsubscribe
        batchUnsubscribe(subjectId);
        return { data: undefined };
      },
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
        // Optimistic update - prefix title
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const notification = draft.find((n) => n.id === id);
            if (notification && !notification.cleanTitle.startsWith("[unsubscribed]")) {
              notification.cleanTitle = `[unsubscribed] ${notification.cleanTitle}`;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    approvePullRequest: builder.mutation<void, { id: string; subjectId: string }>({
      queryFn: async ({ subjectId }) => {
        // Fire and forget - approve the PR
        const mutation = `mutation($prId: ID!) { addPullRequestReview(input: { pullRequestId: $prId, event: APPROVE }) { clientMutationId } }`;
        void $({ reject: false })`gh api graphql -f query=${mutation} -f prId=${subjectId}`;
        return { data: undefined };
      },
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled }) => {
        // Optimistic update - prefix title with [approved]
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("getNotifications", undefined, (draft) => {
            const notification = draft.find((n) => n.id === id);
            if (notification && !notification.cleanTitle.startsWith("[approved]")) {
              notification.cleanTitle = `[approved] ${notification.cleanTitle}`;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useMarkAsDoneMutation,
  useUnsubscribeMutation,
  useApprovePullRequestMutation,
} = notificationsApi;

/** Flush all pending batched mutations and wait for them to complete */
export async function flushPendingMutations(): Promise<void> {
  const promises = allBatchExecutors
    .map((e) => e.flush())
    .filter((p): p is Promise<number> => p !== null);

  await Promise.all(promises);
}
