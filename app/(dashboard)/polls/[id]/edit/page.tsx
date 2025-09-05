import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound } from 'next/navigation';
// Import the client component
import EditPollForm from './EditPollForm';

/**
 * Server Component that renders the page for editing a specific poll.
 * Fetches poll data using a Server Action and performs authorization checks.
 * If the poll is not found or the user is not authorized, it renders the Next.js notFound page.
 * @param params - An object containing route parameters, specifically `id` for the poll ID.
 */
export default async function EditPollPage({ params }: { params: { id: string } }) {
  // Fetch the poll data using a server action. getPollById includes authorization checks.
  const { poll, error } = await getPollById(params.id);

  // If there's an error during fetching or the poll is not found (or unauthorized),
  // trigger the Next.js notFound page.
  if (error || !poll) {
    notFound();
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Poll</h1>
      {/* Render the client-side EditPollForm component, passing the fetched poll data. */}
      <EditPollForm poll={poll} />
    </div>
  );
}