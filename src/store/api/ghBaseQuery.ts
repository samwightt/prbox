import type { BaseQueryFn } from "@reduxjs/toolkit/query";

export interface GhGraphQLArgs {
  query: string;
  variables?: Record<string, string>;
}

export type GhGraphQLErrorType =
  | "GH_CLI_NOT_FOUND"
  | "AUTH_REQUIRED"
  | "MISSING_SCOPE"
  | "GRAPHQL_ERROR"
  | "UNKNOWN";

export interface GhGraphQLError {
  message: string;
  type: GhGraphQLErrorType;
}

/**
 * Custom baseQuery for RTK Query that uses the gh CLI for GitHub GraphQL.
 * This handles authentication automatically via gh's stored credentials.
 */
export const ghGraphQLBaseQuery: BaseQueryFn<
  GhGraphQLArgs,
  unknown,
  GhGraphQLError
> = async ({ query, variables = {} }) => {
  try {
    // Build variable args for gh CLI
    const varArgs: string[] = [];
    for (const [key, value] of Object.entries(variables)) {
      varArgs.push("-f", `${key}=${value}`);
    }

    // Execute GraphQL query via gh CLI
    const result = await Bun.$`gh api graphql -f query=${query} ${varArgs}`.json();

    // Check for GraphQL errors in the response
    if (result.errors?.length) {
      return {
        error: {
          message: result.errors.map((e: { message: string }) => e.message).join(", "),
          type: "GRAPHQL_ERROR",
        },
      };
    }

    return { data: result };
  } catch (e: unknown) {
    const message = String(e);

    // Parse common gh CLI errors
    if (message.includes("not found") || message.includes("command not found")) {
      return {
        error: {
          message:
            "GitHub CLI (gh) is not installed.\n\n" +
            "Install it with:\n" +
            "  brew install gh\n\n" +
            "Then authenticate with:\n" +
            "  gh auth login -s notifications,read:org",
          type: "GH_CLI_NOT_FOUND",
        },
      };
    }

    if (message.includes("not logged in")) {
      return {
        error: {
          message:
            "Not logged in to GitHub CLI.\n\n" +
            "Run:\n" +
            "  gh auth login -s notifications,read:org",
          type: "AUTH_REQUIRED",
        },
      };
    }

    if (message.includes("scope")) {
      return {
        error: {
          message:
            "Missing required scope.\n\n" +
            "Run:\n" +
            "  gh auth refresh -s notifications,read:org",
          type: "MISSING_SCOPE",
        },
      };
    }

    return {
      error: {
        message: message,
        type: "UNKNOWN",
      },
    };
  }
};
