# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## Project Overview

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

*   **Authentication**: Secure user sign-up and login.
*   **Poll Management**: Users can create, view, and delete their own polls.
*   **Voting System**: A straightforward system for casting and viewing votes.
*   **User Dashboard**: A personalized space for users to manage their polls.

## Technology Stack

The application is built with a modern tech stack:

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Backend & Database**: [Supabase](https://supabase.io/)
*   **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
*   **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:
    -   Thoroughly review the codebase to find security weaknesses.
    -   Pay close attention to user authentication, data access, and business logic.
    -   Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:
    -   For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    -   Once a vulnerability is identified, ask your AI assistant to fix it.
    -   Write secure, efficient, and clean code to patch the security holes.
    -   Ensure that your fixes do not break existing functionality for legitimate users.

### Security Audit Findings & Remediation

During the security audit, several potential attack vectors were identified and subsequently remediated. This section outlines the discovered flaws and the steps taken to address them.

#### 1. Authorization Bypass Vulnerabilities

**Description**: Initially, several Server Actions lacked robust authorization checks, allowing unauthorized users to potentially view, update, or delete polls they did not own.
    -   `getPollById` did not verify poll ownership, enabling any user with a poll ID to view its details.
    -   `deletePoll` allowed any authenticated user to delete any poll by knowing its ID.
    -   `updatePoll` (via `EditPollPage.tsx`) could potentially render edit forms for non-owners.
    -   `submitVote` allowed unauthenticated voting and did not prevent duplicate votes.

**Remediation**:
    -   **`getPollById` and `deletePoll`**: Modified to include explicit checks (`.eq("user_id", user.id)`) to ensure only the authenticated owner can access or delete their polls.
    -   **`submitVote`**: Enhanced to require user login, validate `pollId` format and `optionIndex` range, and prevent duplicate votes from the same user on the same poll by checking for existing votes.
    -   **`EditPollPage.tsx`**: Updated to leverage the hardened `getPollById` function, preventing the rendering of the edit form for polls not owned by the current user.

#### 2. Information Disclosure (Error Messages)

**Description**: Raw error messages from Supabase were being directly exposed to the client in various Server Actions. This could potentially reveal sensitive internal system information or database structure to attackers.

**Remediation**:
    -   **`auth-actions.ts` and `poll-actions.ts`**: All Server Actions were updated to return generic, user-friendly error messages (e.g., "Invalid credentials.", "Failed to create poll.") instead of direct Supabase error messages, limiting information leakage.

#### 3. Inadequate Server-Side Input Validation

**Description**: The `createPoll` and `updatePoll` Server Actions had only basic length validation for poll questions and options, making them susceptible to malformed data or potential injection attacks (though mitigated by Supabase's ORM).

**Remediation**:
    -   **`createPoll` and `updatePoll`**: Implemented comprehensive server-side input validation for poll questions (length 1-255 characters) and options (at least two options, each 1-100 characters long, and trimmed). This helps prevent malicious or malformed data from being persisted.
    -   **`submitVote`**: Added specific validation for `pollId` (ensuring it's a string) and `optionIndex` (ensuring it's within the valid range of poll options).

#### 4. Client-Side Open Redirect

**Description**: The application used `window.location.href` for client-side redirections after certain actions (login, registration, poll creation/editing). While the targets were hardcoded in this instance, using `window.location.href` with dynamic, untrusted input could lead to open redirect vulnerabilities.

**Remediation**:
    -   **Client-Side Redirections**: All instances of `window.location.href` for internal navigation in `LoginPage.tsx`, `RegisterPage.tsx`, `PollCreateForm.tsx`, and `EditPollForm.tsx` were replaced with `next/navigation`'s `useRouter().push()`. This is a safer method for handling internal navigation within a Next.js application.

#### 5. Supabase Row Level Security (RLS) Misconfiguration (Critical Configuration Step)

**Description**: This is a critical configuration-level vulnerability that cannot be addressed directly within the codebase. Without properly configured Row Level Security (RLS) policies directly within the Supabase database, an attacker could bypass application-level authorization checks and directly access, modify, or delete data through the Supabase API, even with the server-side code remediations in place.

**Remediation (Action Required)**:
    -   **Manual Configuration in Supabase Dashboard**: It is imperative to **manually verify and configure your Row Level Security policies** in your Supabase dashboard for all relevant tables (e.g., `polls`, `votes`, `users`). Ensure RLS is enabled and policies are correctly defined to enforce:
        -   Users can only read their own polls or publicly shared polls.
        -   Users can only create, update, or delete polls they own.
        -   Users can only create a vote if they haven't already voted on that poll.
        -   Users can read vote counts for polls.
        -   Sensitive user data is protected.

**This step is crucial for the complete security of the application and must be performed directly in your Supabase project.**

---

## Getting Started: Local Development

To get the application running on your local machine, follow these steps:

### 1. Prerequisites

*   [Node.js](https://nodejs.org/) (v20.x or higher recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A [Supabase](https://supabase.io/) account and project.

### 2. Supabase Project Setup

1.  **Create a New Supabase Project**: Go to the [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2.  **Get your Project URL and Anon Key**: Navigate to `Project Settings` > `API` to find your `anon` public key and project URL. You will need these for your environment variables.
3.  **Set up Database Schema**: Create the necessary tables and their columns. Here's a basic schema:

    ```sql
    -- public.users table is managed by Supabase Auth

    CREATE TABLE public.polls (
        id uuid DEFAULT uuid_generate_v4() NOT NULL,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        question text NOT NULL,
        options text[] DEFAULT ARRAY[]::text[] NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT polls_pkey PRIMARY KEY (id)
    );

    CREATE TABLE public.votes (
        id uuid DEFAULT uuid_generate_v4() NOT NULL,
        poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        option_index integer NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT votes_pkey PRIMARY KEY (id),
        CONSTRAINT unique_vote_per_user_per_poll UNIQUE (poll_id, user_id)
    );
    ```

4.  **Configure Row Level Security (RLS)**: This is crucial for securing your data. Enable RLS for the `polls` and `votes` tables and define policies. (Refer to the `Security Audit Findings & Remediation` section above for detailed RLS remediation steps).

### 3. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 4. Environment Variables

Create a `.env.local` file in the root of your project and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY # Only needed for server-side operations, keep this secret!
```

**Important**: Never commit your `.env.local` file to version control.

### 5. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage Examples

### Creating a Poll

1.  **Register/Login**: Navigate to `/register` or `/login` to create an account or sign in.
2.  **Create Poll**: Go to `/create`. Enter your poll question and at least two options. Click "Create Poll".
3.  **View Your Polls**: After creation, you'll be redirected to `/polls` where you can see your newly created poll.

### Voting on a Poll

1.  **Access Poll**: Go to `/polls` and select a poll you wish to vote on, or use a direct link if shared.
2.  **Cast Your Vote**: Choose one of the available options and submit your vote. The system prevents duplicate votes from the same user on the same poll.

### Sharing a Poll

1.  **View Poll**: On the poll details page (`/polls/[id]`), you will see options to share the poll.
2.  **Copy Link or QR Code**: You can copy the shareable link or scan the generated QR code to share the poll with others.
3.  **Social Media Sharing**: Buttons are available for sharing on Twitter, Facebook, or via email.

---

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!
