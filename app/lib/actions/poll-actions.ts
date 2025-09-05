"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server Action to create a new poll.
 * Requires user to be logged in. Performs input validation on question and options.
 * @param formData - FormData object containing 'question' (string) and 'options' (array of strings).
 * @returns An object with an error message if creation fails or validation errors occur, otherwise null.
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation for question and options
  // Ensure question is provided and within acceptable length limits.
  if (!question || question.trim().length === 0 || question.length > 255) {
    return { error: "Poll question must be between 1 and 255 characters." };
  }

  // Ensure at least two options are provided.
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }

  // Validate each option for content and length.
  for (const option of options) {
    if (option.trim().length === 0 || option.length > 100) {
      return { error: "Each option must be between 1 and 100 characters." };
    }
  }

  // Get user from session to ensure authentication and associate poll with user.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  // Handle authentication errors.
  if (userError) {
    return { error: "Authentication failed." };
  }
  // Ensure user is logged in.
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  // Insert the new poll into the 'polls' table.
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id, // Associate poll with the creating user.
      question,
      options,
    },
  ]);

  // Handle database insertion errors.
  if (error) {
    return { error: "Failed to create poll." };
  }

  // Revalidate the '/polls' path to display the new poll.
  revalidatePath("/polls");
  // Return success.
  return { error: null };
}

/**
 * Server Action to retrieve all polls created by the current authenticated user.
 * @returns An object containing an array of polls and an error message if authentication fails or polls cannot be fetched.
 */
export async function getUserPolls() {
  const supabase = await createClient();
  // Get user from session to fetch only their polls.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // If user is not authenticated, return an empty array and an error.
  if (!user) return { polls: [], error: "Not authenticated" };

  // Fetch polls from the 'polls' table, filtered by user_id and ordered by creation date.
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id) // Ensure only owner's polls are fetched.
    .order("created_at", { ascending: false });

  // Handle database fetch errors.
  if (error) return { polls: [], error: error.message }; // Keep original error for internal use, as this is a dashboard view.
  // Return fetched polls or an empty array if none, and no error.
  return { polls: data ?? [], error: null };
}

/**
 * Server Action to retrieve a single poll by its ID.
 * Includes authorization to ensure only the poll owner can view it.
 * @param id - The ID of the poll to retrieve.
 * @returns An object containing the poll data or an error message if not found or unauthorized.
 */
export async function getPollById(id: string) {
  const supabase = await createClient();

  // Authorization: Only allow authenticated users to view their own polls
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { poll: null, error: "You must be logged in to view this poll." };
  }

  // Fetch the poll, ensuring it matches the provided ID and the authenticated user's ID.
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // Ensure only owner can view
    .single(); // Expecting a single result.

  // Handle database fetch errors or if the poll is not found.
  if (error) return { poll: null, error: "Failed to retrieve poll." };
  // Return the fetched poll data.
  return { poll: data, error: null };
}

/**
 * Server Action to submit a vote for a poll.
 * Requires user to be logged in, validates inputs, and prevents duplicate votes.
 * @param pollId - The ID of the poll being voted on.
 * @param optionIndex - The index of the chosen option (0-based).
 * @returns An object with an error message if submission fails or validation errors occur, otherwise null.
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  // Get user from session to associate vote with user and prevent duplicate voting.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require login to vote.
  if (!user) {
    return { error: 'You must be logged in to vote.' };
  }

  // Validate pollId to ensure it's a valid string.
  if (!pollId || typeof pollId !== 'string') {
    return { error: 'Invalid poll ID.' };
  }

  // Fetch poll to validate optionIndex and check if poll exists.
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('options') // Only fetch options to minimize data transfer.
    .eq('id', pollId)
    .single();

  // Handle errors during poll fetching or if the poll does not exist.
  if (pollError || !poll) {
    return { error: 'Poll not found or an error occurred.' };
  }

  // Validate optionIndex to ensure it's within the bounds of available options.
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: 'Invalid option selected.' };
  }

  // Check for duplicate votes from the same user on the same poll.
  const { data: existingVote, error: existingVoteError } = await supabase
    .from('votes')
    .select('id') // Only need to check for existence, so fetching 'id' is sufficient.
    .eq('poll_id', pollId)
    .eq('user_id', user.id)
    .single();

  // Handle errors during existing vote check, excluding 'PGRST116' which means no rows found.
  if (existingVoteError && existingVoteError.code !== 'PGRST116') { // PGRST116 means no rows found
    return { error: 'Failed to check for existing vote.' };
  }

  // If an existing vote is found, prevent duplicate voting.
  if (existingVote) {
    return { error: 'You have already voted on this poll.' };
  }

  // Insert the new vote into the 'votes' table.
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    },
  ]);

  // Handle database insertion errors for the vote.
  if (error) return { error: "Failed to submit vote." };
  // Return success.
  return { error: null };
}

/**
 * Server Action to delete a poll.
 * Requires user to be logged in and authorized as the poll owner.
 * @param id - The ID of the poll to delete.
 * @returns An object with an error message if deletion fails or is unauthorized, otherwise null.
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();

  // Authorization: Only allow authenticated users to delete their own polls.
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  // Handle authentication errors.
  if (userError || !user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Delete the poll from the 'polls' table, ensuring it matches both the ID and the user's ID.
  const { error } = await supabase.from("polls").delete().eq("id", id).eq("user_id", user.id); // Ensure only owner can delete
  // Handle database deletion errors.
  if (error) return { error: "Failed to delete poll." };
  // Revalidate the '/polls' path to reflect the deletion.
  revalidatePath("/polls");
  // Return success.
  return { error: null };
}

/**
 * Server Action to update an existing poll.
 * Requires user to be logged in and authorized as the poll owner. Performs input validation on question and options.
 * @param pollId - The ID of the poll to update.
 * @param formData - FormData object containing 'question' (string) and 'options' (array of strings).
 * @returns An object with an error message if update fails, validation errors occur, or is unauthorized, otherwise null.
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation for question and options
  // Ensure question is provided and within acceptable length limits.
  if (!question || question.trim().length === 0 || question.length > 255) {
    return { error: "Poll question must be between 1 and 255 characters." };
  }

  // Ensure at least two options are provided.
  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }

  // Validate each option for content and length.
  for (const option of options) {
    if (option.trim().length === 0 || option.length > 100) {
      return { error: "Each option must be between 1 and 100 characters." };
    }
  }

  // Get user from session to ensure authentication and authorize poll update.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  // Handle authentication errors.
  if (userError) {
    return { error: "Authentication failed." };
  }
  // Ensure user is logged in.
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user.
  // Update the poll in the 'polls' table, filtered by pollId and user_id.
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id); // Ensure only owner can update.

  // Handle database update errors.
  if (error) {
    return { error: "Failed to update poll." };
  }

  // Return success.
  return { error: null };
}
