"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation for question and options
  if (!question || question.trim().length === 0 || question.length > 255) {
    return { error: "Poll question must be between 1 and 255 characters." };
  }

  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }

  for (const option of options) {
    if (option.trim().length === 0 || option.length > 100) {
      return { error: "Each option must be between 1 and 100 characters." };
    }
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: "Authentication failed." };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: "Failed to create poll." };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();

  // Authorization: Only allow authenticated users to view their own polls
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { poll: null, error: "You must be logged in to view this poll." };
  }

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // Ensure only owner can view
    .single();

  if (error) return { poll: null, error: "Failed to retrieve poll." };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require login to vote
  if (!user) {
    return { error: 'You must be logged in to vote.' };
  }

  // Validate pollId
  if (!pollId || typeof pollId !== 'string') {
    return { error: 'Invalid poll ID.' };
  }

  // Fetch poll to validate optionIndex and check if poll exists
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select('options')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return { error: 'Poll not found or an error occurred.' };
  }

  // Validate optionIndex
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: 'Invalid option selected.' };
  }

  // Check for duplicate votes from the same user on the same poll
  const { data: existingVote, error: existingVoteError } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', user.id)
    .single();

  if (existingVoteError && existingVoteError.code !== 'PGRST116') { // PGRST116 means no rows found
    return { error: 'Failed to check for existing vote.' };
  }

  if (existingVote) {
    return { error: 'You have already voted on this poll.' };
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user.id,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: "Failed to submit vote." };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();

  // Authorization: Only allow authenticated users to delete their own polls
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "You must be logged in to delete a poll." };
  }

  const { error } = await supabase.from("polls").delete().eq("id", id).eq("user_id", user.id); // Ensure only owner can delete
  if (error) return { error: "Failed to delete poll." };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation for question and options
  if (!question || question.trim().length === 0 || question.length > 255) {
    return { error: "Poll question must be between 1 and 255 characters." };
  }

  if (options.length < 2) {
    return { error: "Please provide at least two options." };
  }

  for (const option of options) {
    if (option.trim().length === 0 || option.length > 100) {
      return { error: "Each option must be between 1 and 100 characters." };
    }
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: "Authentication failed." };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update poll." };
  }

  return { error: null };
}
