import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Megaphone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  Image as ImageIcon,
  Shield
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { user, loading, profile, approvalStatus, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['recent-announcements'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Users can browse the dashboard without a profile - they'll set it up when they click on profile

  const { data: announcements } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { count: totalAlumni } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const pendingCount = 0; // No longer used

      return {
        totalAlumni: totalAlumni || 0,
        pendingApprovals: pendingCount || 0,
      };
    },
    enabled: !!user && isAdmin,
  });

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

  const getStatusBadge = () => {
    switch (approvalStatus) {
      case 'approved':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 md:mr-1" />
            <span className="hidden md:inline">Approved</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 md:mr-1" />
            <span className="hidden md:inline">Pending Approval</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 md:mr-1" />
            <span className="hidden md:inline">Rejected</span>
          </Badge>
        );
      default:
        return null;
    }
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
                  <span className="text-muted-foreground">Class of {profile?.graduation_year}</span>
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
        {
          isAdmin && stats && (
            <div className="mb-8">
              <Card className="bg-gradient-navy text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 dark:text-gold-light">
                    <Users className="h-5 w-5 " />
                    Total Alumni
                  </CardTitle>
                  <p className="text-4xl font-bold dark:text-gold-light">{stats.totalAlumni}</p>
                </CardHeader>
              </Card>
            </div>
          )
        }

        {/* Recent Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Latest updates from AFCS</CardDescription>
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
      </div >
    </Layout >
  );
}
