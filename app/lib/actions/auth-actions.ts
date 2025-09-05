'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Handles user login by authenticating with Supabase.
 * On successful login, returns null for error. On failure, returns a generic error message.
 * @param data - An object containing user's email and password.
 * @returns An object with an error message if authentication fails, otherwise null.
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Attempt to sign in the user with the provided credentials.
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  // If an error occurs during sign-in, return a generic error message.
  if (error) {
    return { error: "Invalid credentials." };
  }

  // If login is successful, return no error.
  return { error: null };
}

/**
 * Handles user registration by creating a new user in Supabase.
 * On successful registration, returns null for error. On failure, returns a generic error message.
 * @param data - An object containing the new user's name, email, and password.
 * @returns An object with an error message if registration fails, otherwise null.
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Attempt to sign up the new user with the provided details.
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  // If an error occurs during sign-up, return a generic error message.
  if (error) {
    return { error: "Registration failed. Please try again." };
  }

  // If registration is successful, return no error.
  return { error: null };
}

/**
 * Handles user logout by signing out from Supabase.
 * @returns An object with an error message if logout fails, otherwise null.
 */
export async function logout() {
  const supabase = await createClient();
  // Attempt to sign out the current user.
  const { error } = await supabase.auth.signOut();
  // If an error occurs during sign-out, return a generic error message.
  if (error) {
    return { error: "Logout failed. Please try again." };
  }
  // If logout is successful, return no error.
  return { error: null };
}

/**
 * Retrieves the current authenticated user from Supabase.
 * @returns The user object if authenticated, otherwise null.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  // Fetch the current user session data.
  const { data } = await supabase.auth.getUser();
  // Return the user object from the session data.
  return data.user;
}

/**
 * Retrieves the current user session from Supabase.
 * @returns The session object if authenticated, otherwise null.
 */
export async function getSession() {
  const supabase = await createClient();
  // Fetch the current user session.
  const { data } = await supabase.auth.getSession();
  // Return the session object.
  return data.session;
}
