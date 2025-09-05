'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePoll } from '@/app/lib/actions/poll-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Client component for editing an existing poll.
 * Manages the poll question and options dynamically, and submits the updated data to a Server Action.
 * @param poll - The poll object containing the initial question and options.
 */
export default function EditPollForm({ poll }: { poll: any }) {
  // State to manage the poll question.
  const [question, setQuestion] = useState(poll.question);
  // State to manage the list of poll options.
  const [options, setOptions] = useState<string[]>(poll.options || []);
  // State to manage and display any errors during poll update.
  const [error, setError] = useState<string | null>(null);
  // State to indicate successful poll update.
  const [success, setSuccess] = useState(false);
  // Next.js router for programmatic navigation.
  const router = useRouter();

  /**
   * Handles changes to an individual poll option input.
   * @param idx The index of the option being changed.
   * @param value The new value for the option.
   */
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  /**
   * Adds a new empty option field to the poll.
   */
  const addOption = () => setOptions((opts) => [...opts, '']);

  /**
   * Removes an option field from the poll.
   * Ensures that at least two options remain.
   * @param idx The index of the option to remove.
   */
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  return (
    <form
      // Form action to handle poll update asynchronously.
      action={async (formData) => {
        setError(null); // Clear previous errors.
        setSuccess(false); // Reset success state.
        // Manually set question and options on FormData to ensure they reflect current state.
        formData.set('question', question);
        formData.delete('options'); // Clear existing options to re-append updated ones.
        options.forEach((opt) => formData.append('options', opt)); // Append current options.
        const res = await updatePoll(poll.id, formData); // Call the server-side action.
        if (res?.error) {
          setError(res.error); // Display error if update fails.
        } else {
          setSuccess(true); // Indicate success.
          // Redirect to the polls page after a short delay.
          setTimeout(() => {
            router.push('/polls');
          }, 1200);
        }
      }}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input
          name="question"
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
            />
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll updated! Redirecting...</div>}
      <Button type="submit">Update Poll</Button>
    </form>
  );
}