import React from "react";
import { Box, Text } from "ink";
import type { ParsedNotification, StatusCheckState } from "../types";

function shortTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

function StatusCheck({ status, isRead }: { status: StatusCheckState | null; isRead: boolean }) {
  if (!status) return null;

  if (status === "success") {
    return <Text color={isRead ? "gray" : "green"}> ✓</Text>;
  }

  if (status === "failure") {
    return <Text color={isRead ? "gray" : "red"}> ✗</Text>;
  }

  // pending
  return <Text color={isRead ? "gray" : "yellow"}> ○</Text>;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

interface NotificationItemProps {
  notification: ParsedNotification;
  isSelected: boolean;
}

// Reasons that have their own dedicated tabs
const MAIN_REASONS = ["needs_review", "replied", "reviewed", "team_reviewed", "mention", "comment", "merged", "draft", "closed"];

export function NotificationItem({ notification, isSelected }: NotificationItemProps) {
  const isRead = !notification.unread;

  // Show reason label for "other" tab items (reasons without dedicated tabs)
  const showReason = !MAIN_REASONS.includes(notification.reason);

  // Bullet color based on unread status, shape based on selection
  const bulletColor = notification.unread ? "cyan" : "gray";
  const bullet = isSelected ? (
    <Text color={bulletColor} bold>{"❯ "}</Text>
  ) : notification.unread ? (
    <Text color="cyan">● </Text>
  ) : (
    <Text color="gray">○ </Text>
  );

  return (
    <Box flexDirection="column">
      {/* Line 1: bullet + title + author + PR number + branch */}
      <Text>
        {bullet}
        <Text bold={!isRead} color={isSelected ? "white" : isRead ? "gray" : notification.isClosed ? "red" : notification.reason === "merged" ? "magenta" : undefined}>
          {truncate(notification.cleanTitle, 50)}
        </Text>
        {notification.isClosed && <Text color={isRead ? "gray" : "red"}> (closed)</Text>}
        {notification.author && (
          <Text color={isSelected ? "white" : "gray"} italic bold={false}> @{notification.author}</Text>
        )}
        <Text dimColor italic>
          {" "}{shortTimeAgo(notification.updatedAt)}
          {Date.now() - new Date(notification.createdAt).getTime() >= 14 * 24 * 60 * 60 * 1000 && (
            <Text>, created {shortTimeAgo(notification.createdAt)}</Text>
          )}
        </Text>
        {notification.reviewRequestedFrom && (
          <Text color={isRead ? "gray" : "yellow"}> review: {notification.reviewRequestedFrom}</Text>
        )}
        {notification.teamReviewedBy && (
          <Text color={isRead ? "gray" : "cyan"}> {notification.teamReviewedBy.reviewer} {
            notification.teamReviewedBy.state === "APPROVED" ? "approved" :
            notification.teamReviewedBy.state === "CHANGES_REQUESTED" ? "requested changes" :
            "commented"
          } for {notification.teamReviewedBy.team}</Text>
        )}
        {notification.repliedBy && (
          <Text color={isRead ? "gray" : "magenta"}> {notification.repliedBy} replied</Text>
        )}
        {/* <StatusCheck status={notification.statusCheck} isRead={isRead} /> */}
        {/* {isSelected && (
          <>
            {" "}<Text color={isRead ? "gray" : "cyan"}>#{notification.prNumber}</Text>
            {notification.branch && (
              <Text dimColor> ⎇ {truncate(notification.branch, 25)}</Text>
            )}
          </>
        )} */}
        {showReason && (
          <Text color={isRead ? "gray" : "blue"}> [{notification.reason}]</Text>
        )}
      </Text>
    </Box>
  );
}
