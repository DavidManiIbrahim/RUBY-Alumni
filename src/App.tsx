import { Suspense, lazy, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { Loader2 } from "lucide-react";
import { logAppEvent } from "@/lib/telemetry";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Profile = lazy(() => import("./pages/Profile"));
const Directory = lazy(() => import("./pages/Directory"));
const AlumniProfile = lazy(() => import("./pages/AlumniProfile"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Admin = lazy(() => import("./pages/Admin"));
const Chat = lazy(() => import("./pages/Chat"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Immediately stale to trigger background refetch (Stale-While-Revalidate)
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (keep in cache/storage)
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

function AppContent() {
  const { user, profile, loading, isProfileComplete, hasFetchedProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const lastTrackedPathRef = useRef<string | null>(null);
  const { toast } = useToast();
  const hasRemindedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      // console.log("Profile verification:", { isProfileComplete, path: location.pathname, hasFetchedProfile });

      // 1. Strict Enforcement: Redirect to setup if profile is incomplete AND we've confirmed it's missing (hasFetchedProfile)
      if (hasFetchedProfile && !isProfileComplete) {
        if (location.pathname !== '/profile/setup') {
          // Force redirect to setup
          navigate('/profile/setup', { replace: true });

          if (!hasRemindedRef.current) {
            hasRemindedRef.current = true;
            toast({
              title: "Profile Incomplete",
              description: "You must complete your profile setup before accessing the dashboard.",
              variant: "destructive"
            });
          }
        }
        return;
      }

      // 2. Prevent accessing setup if already complete
      if (location.pathname === '/profile/setup' && isProfileComplete) {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [user, isProfileComplete, hasFetchedProfile, loading, location.pathname, navigate, toast]);

  // Basic interaction tracking: page views (best-effort)
  useEffect(() => {
    if (!user) return;
    if (lastTrackedPathRef.current === location.pathname) return;
    lastTrackedPathRef.current = location.pathname;

    void logAppEvent({
      userId: user.id,
      eventName: "page_view",
      path: location.pathname,
    });
  }, [user, location.pathname]);

  // Show chatbot only for authenticated users and not on landing/auth pages
  const showChatbot = false; // user && location.pathname !== '/' && location.pathname !== '/auth';

  return (
    <>
      <Toaster />
      <Sonner />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/setup" element={<ProfileSetup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/alumni/:id" element={<AlumniProfile />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showChatbot && <AIChatbot />}
    </>
  );
}

const App = () => (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </PersistQueryClientProvider>
);

export default App;
