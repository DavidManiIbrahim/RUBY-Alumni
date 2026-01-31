import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Profile } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Megaphone,
  User,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  Image as ImageIcon,
  Shield
} from 'lucide-react';
import { useAnnouncements, useProfiles } from '@/hooks/useFirebaseDB';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { announcements, error: announcementsError } = useAnnouncements(3);
  const { profiles, error: profilesError } = useProfiles();
  const [stats, setStats] = useState({ totalAlumni: 0 });

  useEffect(() => {
    if (announcementsError) console.error('[Dashboard] Announcements error:', announcementsError);
    if (profilesError) console.error('[Dashboard] Profiles error:', profilesError);
  }, [announcementsError, profilesError]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profiles.length > 0) {
      setStats({ totalAlumni: profiles.length });
    }
  }, [profiles]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="container py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.profile_picture_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {profile?.full_name ? getInitials(profile.full_name) : <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-display text-2xl lg:text-3xl font-bold">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Alumni'}!
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">Class of {profile?.graduation_year || 'N/A'}</span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="card-hover cursor-pointer" onClick={() => navigate('/directory')}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Alumni Directory</h3>
                <p className="text-sm text-muted-foreground">Find and connect with alumni</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => navigate('/announcements')}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Announcements</h3>
                <p className="text-sm text-muted-foreground">Latest news and updates</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => navigate('/chat')}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Alumni Chat</h3>
                <p className="text-sm text-muted-foreground">Connect with your class</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => navigate('/gallery')}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Photo Gallery</h3>
                <p className="text-sm text-muted-foreground">Share your memories</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => navigate('/profile')}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Your Profile</h3>
                <p className="text-sm text-muted-foreground">View and edit your details</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="card-hover cursor-pointer border-amber-200" onClick={() => navigate('/admin')}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900">Admin Dashboard</h3>
                  <p className="text-sm text-amber-700/80">Manage application settings</p>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-600" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Admin Stats */}
        {isAdmin && (
          <div className="mb-8">
            <Card className="bg-gradient-navy text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  Total Members
                </CardTitle>
                <p className="text-4xl font-black text-white">{stats.totalAlumni}</p>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Recent Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Latest updates from RUBY</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => navigate('/announcements')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <h4 className="font-semibold">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No announcements yet. Check back soon!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
