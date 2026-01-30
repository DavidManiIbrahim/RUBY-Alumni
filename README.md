# WOSA - Alumni Community Platform

An exclusive alumni network platform connecting past students to share memories, communicate in real-time, and stay connected with their school community.

## Features & Functionality

### 🔐 **Authentication & Profiles**
- Email-based authentication with verification
- Google OAuth integration for quick sign-up
- Customizable alumni profiles with profile pictures
- Educational background information (graduation year, position)
- Profile setup wizard for new users

### 💬 **Real-Time Messaging**
- **WebSocket-powered chat** using Supabase Realtime for instant messaging
- Class-based chat rooms organized by graduation year
- General alumni chat channel
- Real-time message delivery with no polling overhead
- User presence and typing indicators
- Profile information displayed with each message

### 📸 **Memory Gallery**
- **Bulk image/video uploads** - Upload multiple photos and videos at once
- Drag-and-drop file upload with preview
- Support for images (JPG, PNG, etc.) and videos (MP4, WebM, etc.)
- Captions for all media with edit functionality
- **Caption editing** - Edit captions after upload (owner-only)
- Image deletion (owner-only)
- Image lazy loading for performance
- Beautiful grid layout with hover effects
- File size validation (up to 30MB per file)

### 📑 **Alumni Directory**
- Searchable alumni database
- Filter by graduation year and other criteria
- View alumni profiles and connect with classmates

### 📢 **Announcements**
- Official announcements feed
- Important updates from alumni leadership
- Timestamped posts with rich content

### 👥 **Admin Dashboard**
- Admin-only management panel
- User management capabilities
- Content moderation tools
- Analytics and monitoring

### 🎯 **Additional Features**
- **Email verification** - Ensures authentic alumni accounts
- **Role-based access control** - Different permissions for users and admins
- **Event logging & analytics** - Tracks user interactions for insights
- **Responsive design** - Works seamlessly on desktop, tablet, and mobile
- **Dark mode support** - Beautiful UI with Tailwind CSS
- **Toast notifications** - Real-time feedback for user actions

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui components library
- **Styling**: Tailwind CSS + PostCSS
- **Real-time**: Supabase Realtime (WebSockets)
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Caching**: Redis for optimized performance and reduced database load
- **File Storage**: Supabase Storage for images/videos
- **Testing**: Vitest
- **Linting**: ESLint
- **Deployment**: Vercel

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
