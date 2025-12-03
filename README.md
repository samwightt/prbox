# prbox - A GitHub Notifications CLI tool

`prbox` is a CLI tool that makes GitHub notifications actually useful. It lets you easily triage and manage
your notifications via the CLI.

## The problem

Teams with monorepos or whose members are assigned to multiple GitHub teams often have very large notification volume.
At my current job, it's normal for me to get more than 50+ notifications per day. The issue is that I do not need to see
most of these notifications. Most of them are:

- Notifications other coworkers have already reviewed.
- PRs that my team was added as a reviewer to and then removed from (but I still receive notifications).
- PRs that are drafts, merged, or closed.
- PRs that I have already reviewed and do not need to see again.

For the notifications that I *do* need to see, GitHub's default notification dashboard gives me no way to tell *why* I'm
receiving the notification. All of the following notification types have the exact same presentation in the GitHub notification UI:

- Someone pushed a commit to the PR.
- Someone left a comment on the PR that does not mention me.
- A bot left a comment on the PR.
- Someone changed the PR title, description, or otherwise.
- Someone replied to a comment I left on a review.
- Someone re-requested my review.
- Someone requested a review from my team.

Because GitHub doesn't show me this info *in the notification UI itself*, I have to go into each and every notification myself.
This is slow, because GitHub is slow, and I have to scroll around on the page to see what's changed.

Altogether, this makes GitHub notifications impossible for me to manage. I know that you can technically send them to your email,
but I get enough emails as it is and don't want to have to set up 20 filters to filter by title. So my current workflow, up until I built
this CLI, was to go through all of my notifications manually each day, which could easily take 2+ hours.

## How does `prbox` fix this?

First, `prbox` breaks down your notifications into categories. These are different from the 'filters' availble in the GitHub UI. GitHub's filter
search is limited and doesn't let you search for the things we search for (details about PRs).

Here's the categories:

- `needs your review`: PRs where someone requested you or your team's review, and that request is still pending in the UI. 
`prbox` fetches the pending reviewers of each PR **as of right now**, compares it to the teams that you're on, and will only include a PR here if there is a pending request **right now** and you haven't already reviewed the PR.
  - This panel shows you *which team had review requested*, and groups the notifications by team. If you're on multiple teams, this is invaluable.
  - In contrast, GitHub's 'review requested' filter shows any notifications where a review has *ever* been requested from your team. So if someone adds you as a reviewer and removes you from a reviewer, you will forever receive notifications about their PR here until you unsubscribe from it.
- `replied to you`: Any PRs where someone replied to a comment you left on one of their PRs. `prbox` gets the review comments for each PR, finds review comemnts you made, and looks for review comments that are replies to you.
  - GitHub's notification panel cannot do this, which means it's easy to miss replies unless someone remembers to @mention you.
- `already reviewed`: PRs that you have **currently** approved. If you open a notification, approve it, then come back and refresh notifications, the notification will be moved to this tab. `prbox` always checks the current PR statuses, not whatever the notifications says (if it even does).
- `merged` - This is any closed / merged PRs. 
- `drafts` - 
  - GitHub's notification panel again cannot do this.
- `team reviewed` - PRs where your team's review was requested, but someone on your team already reviewed it. This again checks the **current status** of the PR. `prbox` checks the current approvals, and shows you *which team member* approved it and for *what team*. This also applies to the `needs your review` section.
  - GitHub's notification panel cannot do this. When someone else takes care of a PR review for your team, GitHub does not delete the notification. It stays there in your notification inbox. It's almost *never* something you need to review yourself, yet you are given no context to know whether or not these are these types of notifications.
  - When I review notifications, easily 50-60% of them are these types and I can just mark them as done without having to view them.
- `mention` - Any mentions go here. This acts the same as GitHub's mentions panel.
- `comment` - Any comments go here. This acts the same as GitHub's comments panel.
- `other` - Anything we haven't figured out how to smartly categorize yet.

The second thing `prbox` lets you do is use keyboard shortcuts. You can use vim-style navigation to go between panels, and use different letters to mark notifications as read / unread, unsubscribe from them, mark them done, etc.

Last, `prbox` will smartly display only the relevant info for each PR notification. It shows the team member who handled the review request for your team (and only for your teams). It shows which of your teams need to review PRs. For PRs that are older, it'll include their age.
Small things like this make it easier to know what you need to look at, and what you can just mark as done.