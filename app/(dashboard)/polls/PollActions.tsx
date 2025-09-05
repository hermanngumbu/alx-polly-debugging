"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

interface Poll {
  id: string;
  question: string;
  options: any[];
  user_id: string;
}

interface PollActionsProps {
  poll: Poll;
}

/**
 * Client component that displays a single poll and provides action buttons (Edit, Delete)
 * for the poll owner. It uses the authenticated user context to determine ownership.
 * @param poll - The poll object to display and act upon.
 */
export default function PollActions({ poll }: PollActionsProps) {
  // Access the authenticated user from the authentication context.
  const { user } = useAuth();

  /**
   * Handles the deletion of a poll.
   * Confirms with the user before calling the server-side `deletePoll` action
   * and then reloads the window to reflect the changes.
   */
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(poll.id); // Call the server-side delete action.
      window.location.reload(); // Reload the page to show updated poll list.
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      {/* Conditionally render Edit and Delete buttons only if the current user is the poll owner. */}
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
