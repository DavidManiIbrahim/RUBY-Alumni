# RUBY - The Elite Alumni Network

A premium, exclusive alumni network platform designed for the graduates of **RUBY College**. RUBY provides a high-end space to reconnect, share legacy memories, and synergize professionally.

## 🚀 Key Features

### 🔐 **Elite Authentication & Profiles**
- **Dual Auth System**: Standard email authentication and secure **Google OAuth** integration.
- **Profile Excellence**: Mandatory profile setup for all alumni ensuring data integrity.
- **Verification Loop**: Role-based access with approval workflows for new members.

### 🖼️ **Legacy Gallery**
- **High-Performance Media**: Powered by **Cloudinary** for lightning-fast image/video delivery.
- **Bulk Operations**: Upload entire class memories at once with drag-and-drop.
- **Smart Filtering**: Categorize media by "Public", "My Class Set", or "Memories".

### 🤖 **RUBY Concierge (AI Assistant)**
- **Gemini Powered**: Integrated with **Google Gemini 1.5 Flash** for intelligent assistance.
- **Alumni Specialization**: Specifically trained to help users navigate the network, find classmates, and understand association goals.
- **Real-time Streaming**: Instant AI responses with a premium glassmorphic chat interface.

### 📑 **Alumni Directory & Synergy**
- **Dynamic Search**: Find classmates by graduation year, Nigerian state, or name.
- **Global Reach**: Connect with the elite RUBY network across the world.
- **Real-time Announcements**: Stay updated with official leadership communiqués.

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend-as-a-Service**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage)
- **Media Management**: [Cloudinary](https://cloudinary.com/) (CDN-based image processing)
- **AI Intelligence**: [Google Gemini 1.5 API](https://ai.google.dev/)
- **State Management**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Deployment**: [Vercel](https://vercel.com/)

## 💻 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Setup
1. Clone the repository:
   ```sh
   git clone <repository-url>
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the root with the following:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_CLOUDINARY_CLOUD_NAME=...
   VITE_CLOUDINARY_UPLOAD_PRESET=...
   VITE_GEMINI_API=...
   ```
4. Run Development Server:
   ```sh
   npm run dev
   ```

## 🔒 Security & Privacy
RUBY is designed with privacy in mind. Media ownership is strictly enforced, and the member directory is only accessible to verified alumni.

#admin
admin recovery pin = 7788

---
*Built for the RUBY Elite.*
