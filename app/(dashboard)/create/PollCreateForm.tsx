"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Client component for creating a new poll.
 * Manages the poll question and options dynamically, and submits the form data to a Server Action.
 */
export default function PollCreateForm() {
  // State to manage the list of poll options.
  const [options, setOptions] = useState(["", ""]);
  // State to manage and display any errors during poll creation.
  const [error, setError] = useState<string | null>(null);
  // State to indicate successful poll creation.
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
  const addOption = () => setOptions((opts) => [...opts, ""]);

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
      // Form action to handle poll creation asynchronously.
      action={async (formData) => {
        setError(null); // Clear previous errors.
        setSuccess(false); // Reset success state.
        const res = await createPoll(formData); // Call the server-side action.
        if (res?.error) {
          setError(res.error); // Display error if creation fails.
        } else {
          setSuccess(true); // Indicate success.
          // Redirect to the polls page after a short delay.
          setTimeout(() => {
            router.push("/polls");
          }, 1200);
        }
      }}
      className="space-y-6 max-w-md mx-auto"
    >
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input name="question" id="question" required />
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
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      <Button type="submit">Create Poll</Button>
    </form>
  );
} 