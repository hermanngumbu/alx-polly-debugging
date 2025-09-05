'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/app/lib/actions/auth-actions';

/**
 * Renders the login page, allowing users to authenticate.
 * This client component handles form submission, displays loading states, and shows error messages.
 */
export default function LoginPage() {
  // State to manage and display authentication errors.
  const [error, setError] = useState<string | null>(null);
  // State to manage the loading status during form submission.
  const [loading, setLoading] = useState(false);
  // Next.js router for programmatic navigation.
  const router = useRouter();

  /**
   * Handles the submission of the login form.
   * Prevents default form submission, sets loading state, calls the login Server Action,
   * and handles success or error responses, including redirection.
   * @param event The form submission event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default browser form submission.
    setLoading(true); // Indicate that the login process is in progress.
    setError(null); // Clear any previous errors.

    // Extract form data for email and password.
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Call the server-side login action.
    const result = await login({ email, password });

    // Handle the result from the login action.
    if (result?.error) {
      setError(result.error); // Display the error message.
      setLoading(false); // Reset loading state.
    } else {
      // On successful login, redirect to the polls page.
      router.push('/polls');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to ALX Polly</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}