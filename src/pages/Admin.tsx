import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Megaphone,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Plus,
  Loader2,
  GraduationCap,
  Crown,
  UserMinus,
  Pencil,
  MapPin,
  Phone,
  Calendar,
  Briefcase,
  Mail,
  BookOpen,
  Eye,
  User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const ADMIN_DELETE_USER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`;

async function adminDeleteUser(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('You must be signed in');

  const resp = await fetch(ADMIN_DELETE_USER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${resp.status}`);
  }
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  graduation_year: number | null;
  profile_picture_url: string | null;
  gender: string | null;
  current_location: string | null;
  bio: string | null;
  university: string | null;
  course_studied: string | null;
  email_address: string | null;
  phone_number: string | null;
  position_held: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
}

interface AuditLog {
  id: string;
  admin_id?: string; // Admin unique
  user_id?: string;  // App event unique
  action?: string;   // Admin unique
  event_name?: string; // App event unique
  target_user_id: string | null;
  details?: any;
  metadata?: any;
  created_at: string;
  path?: string;
}

interface UserOnboardingRow {
  user_id: string;
  signed_up_at: string;
  profile_completed_at: string | null;
}

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteUnverifiedUserId, setDeleteUnverifiedUserId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<Profile | null>(null);
  const [alumniSearch, setAlumniSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, navigate]);

  // Fetch pending profiles
  const { data: pendingProfiles } = useQuery({
    queryKey: ['pending-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch all profiles
  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user && isAdmin,
  });

  const filteredAlumni = useMemo(() => {
    const list = allProfiles ?? [];
    const q = alumniSearch.trim().toLowerCase();
    if (!q) return list;

    const includes = (value: unknown) => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(q);
    };

    return list.filter((p) => {
      return (
        includes(p.full_name) ||
        includes(p.email_address) ||
        includes(p.phone_number) ||
        includes(p.graduation_year) ||
        includes(p.university) ||
        includes(p.course_studied) ||
        includes(p.position_held) ||
        includes(p.current_location) ||
        includes(p.approval_status)
      );
    });
  }, [allProfiles, alumniSearch]);

  // Fetch users who signed up but haven't completed profile setup
  const { data: unverifiedOnboarding } = useQuery({
    queryKey: ['unverified-onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_onboarding' as any)
        .select('*')
        .is('profile_completed_at', null)
        .order('signed_up_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as UserOnboardingRow[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch app events (user interactions)
  const { data: appEvents } = useQuery({
    queryKey: ['app-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_events' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as AuditLog[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch user roles
  const { data: userRoles, refetch: refetchUserRoles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        // audit_logs may be added via migration; keep query simple to avoid FK assumptions
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as AuditLog[];
    },
    enabled: !!user && isAdmin,
  });

  const logAction = async (action: string, targetId?: string, details?: any) => {
    try {
      if (!user?.id) return;
      await supabase.from('audit_logs' as any).insert({
        admin_id: user.id,
        action,
        target_user_id: targetId,
        details
      });
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  // Update profile status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      const profileName = allProfiles?.find(p => p.id === variables.id)?.full_name || 'User';
      logAction(`${variables.status === 'approved' ? 'Approved' : 'Rejected'} profile for ${profileName}`, variables.id, { status: variables.status });
      toast({ title: `User ${variables.status}` });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      await adminDeleteUser(data.user_id);
    },
    onSuccess: (_data, deletedId) => {
      const profileName = allProfiles?.find(p => p.id === deletedId)?.full_name || 'User';
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['pending-profiles'] });
      setDeleteConfirmId(null);
      logAction(`Permanently deleted profile for ${profileName}`, deletedId);
      toast({ title: 'Profile deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Delete unverified user mutation (deletes onboarding row and profile if exists)
  const deleteUnverifiedUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await adminDeleteUser(userId);
    },
    onSuccess: (_data, deletedUserId) => {
      const profile = allProfiles?.find(p => p.user_id === deletedUserId);
      const displayName = profile?.full_name || 'Unverified User';
      queryClient.invalidateQueries({ queryKey: ['unverified-onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['pending-profiles'] });
      setDeleteUnverifiedUserId(null);
      logAction(`Deleted unverified user account: ${displayName} (${deletedUserId})`, deletedUserId);
      toast({ title: 'Unverified user deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from('announcements')
        .update({ title: data.title, content: data.content })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setNewAnnouncement({ title: '', content: '' });
      setEditingAnnouncement(null);
      setIsAnnouncementDialogOpen(false);
      logAction(`Updated announcement: "${variables.title}"`, variables.id, { title: variables.title });
      toast({ title: 'Announcement updated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const { error } = await supabase
        .from('announcements')
        .insert([{ ...data, author_id: user?.id }] as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      const title = newAnnouncement.title;
      setNewAnnouncement({ title: '', content: '' });
      setIsAnnouncementDialogOpen(false);
      logAction(`Published new announcement: "${title}"`);
      toast({ title: 'Announcement posted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, deletedAnnouncementId) => {
      const title = announcements?.find(a => a.id === deletedAnnouncementId)?.title || 'Announcement';
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      logAction(`Deleted announcement: "${title}"`, deletedAnnouncementId);
      toast({ title: 'Announcement deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Promote user to admin mutation
  const promoteToAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingRole) {
        return; // Already admin
      }

      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: 'admin' }] as any);

      if (error) throw error;
    },
    onSuccess: (_data, userId) => {
      refetchUserRoles();
      const userName = allProfiles?.find(p => p.user_id === userId)?.full_name || 'User';
      logAction(`Granted Admin privileges to ${userName}`, userId);
      toast({ title: 'User promoted to admin' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  // Demote admin to regular user mutation
  const demoteFromAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;
    },
    onSuccess: (_data, userId) => {
      refetchUserRoles();
      const userName = allProfiles?.find(p => p.user_id === userId)?.full_name || 'User';
      logAction(`Revoked Admin privileges for ${userName}`, userId);
      toast({ title: 'Admin privileges revoked' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
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

  const getStatusBadge = (status: string) => {
    switch (status) {
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
            <span className="hidden md:inline">Pending</span>
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

  const formatGender = (gender: string | null) => {
    if (!gender) return null;
    return gender.charAt(0).toUpperCase() + gender.slice(1).replace('_', ' ');
  };

  const isUserAdmin = (userId: string) => {
    return userRoles?.some(role => role.user_id === userId && role.role === 'admin') || false;
  };

  if (loading || !isAdmin) {
    return (
      <Layout showFooter={false}>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="container py-8 lg:py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-lg bg-gradient-navy flex items-center justify-center">
            <Shield className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage alumni registrations and announcements</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allProfiles?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <UserMinus className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {unverifiedOnboarding?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Unverified Users</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{announcements?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Announcements</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(auditLogs?.length || 0) + (appEvents?.length || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Activity</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full h-auto p-1 lg:flex lg:w-auto">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              Alumni ({allProfiles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="unverified" className="gap-2">
              <UserMinus className="h-4 w-4" />
              Unverified ({unverifiedOnboarding?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Clock className="h-4 w-4" />
              Activity Feed ({(auditLogs?.length || 0) + (appEvents?.length || 0)})
            </TabsTrigger>
          </TabsList>



          {/* All Alumni Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Alumni</CardTitle>
                <CardDescription>Manage all registered alumni profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="w-full sm:max-w-md">
                    <Label htmlFor="alumni-search" className="sr-only">Search alumni</Label>
                    <Input
                      id="alumni-search"
                      value={alumniSearch}
                      onChange={(e) => setAlumniSearch(e.target.value)}
                      placeholder="Search by name, year, email, university, position…"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredAlumni.length}</span> of{' '}
                    <span className="font-medium text-foreground">{allProfiles?.length || 0}</span>
                  </p>
                </div>

                {filteredAlumni && filteredAlumni.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAlumni.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile.profile_picture_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(profile.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{profile.full_name}</span>
                              {getStatusBadge(profile.approval_status)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              Class of {profile.graduation_year}
                              {isUserAdmin(profile.user_id) && (
                                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserDetail(profile)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {profile.approval_status !== 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: profile.id, status: 'approved' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {isUserAdmin(profile.user_id) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 hover:bg-orange-100"
                              onClick={() => demoteFromAdminMutation.mutate(profile.user_id)}
                              disabled={demoteFromAdminMutation.isPending || profile.user_id === user?.id}
                              title={profile.user_id === user?.id ? "You can't demote yourself" : 'Revoke admin privileges'}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-100"
                              onClick={() => promoteToAdminMutation.mutate(profile.user_id)}
                              disabled={promoteToAdminMutation.isPending}
                              title="Make admin"
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteConfirmId(profile.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {alumniSearch.trim() ? 'No matching alumni found' : 'No alumni profiles yet'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unverified Users Tab */}
          <TabsContent value="unverified">
            <Card>
              <CardHeader>
                <CardTitle>Unverified Users</CardTitle>
                <CardDescription>Users who have signed up but haven't completed their profile setup</CardDescription>
              </CardHeader>
              <CardContent>
                {unverifiedOnboarding && unverifiedOnboarding.length > 0 ? (
                  <div className="space-y-4">
                    {unverifiedOnboarding.map((row) => {
                      const profile = allProfiles?.find(p => p.user_id === row.user_id);
                      const displayName = profile?.full_name ?? 'New User';
                      return (
                        <div
                          key={row.user_id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={profile?.profile_picture_url || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{displayName}</p>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                  Incomplete
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                User ID: {row.user_id}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (profile) {
                                  setSelectedUserDetail(profile);
                                } else {
                                  // Create a placeholder profile for users with no profiles table entry yet
                                  setSelectedUserDetail({
                                    id: 'placeholder',
                                    user_id: row.user_id,
                                    full_name: 'New Member (Setup Pending)',
                                    email_address: null,
                                    phone_number: null,
                                    graduation_year: null,
                                    profile_picture_url: null,
                                    gender: null,
                                    current_location: null,
                                    bio: 'User has signed up but not yet initialized their profile record.',
                                    university: null,
                                    course_studied: null,
                                    position_held: null,
                                    approval_status: 'pending',
                                    created_at: row.signed_up_at
                                  });
                                }
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => setDeleteUnverifiedUserId(row.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No unverified users found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>Post and manage announcements</CardDescription>
                </div>
                <Button variant="gold" onClick={() => {
                  setEditingAnnouncement(null);
                  setNewAnnouncement({ title: '', content: '' });
                  setIsAnnouncementDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </CardHeader>
              <CardContent>
                {announcements && announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold">{announcement.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {announcement.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Posted on {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAnnouncement(announcement);
                                setNewAnnouncement({ title: announcement.title, content: announcement.content });
                                setIsAnnouncementDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                              disabled={deleteAnnouncementMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No announcements yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>History of administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Combined Activity Feed */}
                  {(() => {
                    const combined = [
                      ...(auditLogs || []).map(l => ({ ...l, type: 'admin' })),
                      ...(appEvents || []).map(e => ({ ...e, type: 'user' }))
                    ].sort((a, b) => {
                      const dateA = new Date(a.created_at).getTime();
                      const dateB = new Date(b.created_at).getTime();
                      // Sort descending (Newest first)
                      return dateB - dateA;
                    });

                    return combined.length > 0 ? (
                      combined.map((log) => {
                        const performerId = log.admin_id || log.user_id;
                        const performer = allProfiles?.find(p => p.user_id === performerId);
                        const performerName = performer?.full_name || (log.type === 'admin' ? 'Admin' : 'User');
                        const actionDisplay = log.action || log.event_name || 'Action';

                        return (
                          <div key={log.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg text-sm bg-card/50 hover:bg-card transition-colors">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${log.type === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {log.type}
                                </span>
                                <p className="font-semibold">{actionDisplay}</p>
                              </div>
                              <p className="text-muted-foreground">
                                Performed by: <span className="font-medium text-foreground">{performerName}</span>
                                {log.path && <span className="text-xs ml-2">on {log.path}</span>}
                              </p>
                              {log.target_user_id && (
                                <p className="text-xs text-muted-foreground mt-1 text-gold">
                                  Target User: {allProfiles?.find(p => p.user_id === log.target_user_id)?.full_name || log.target_user_id}
                                </p>
                              )}
                            </div>
                            <div className="text-muted-foreground sm:text-right mt-2 sm:mt-0 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No activity logs found</p>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Announcement Dialog */}
        <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Post New Announcement'}</DialogTitle>
              <DialogDescription>
                {editingAnnouncement ? 'Update the details of this announcement' : 'This announcement will be visible to all approved alumni'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={() => {
                  if (editingAnnouncement) {
                    updateAnnouncementMutation.mutate({ ...newAnnouncement, id: editingAnnouncement.id });
                  } else {
                    createAnnouncementMutation.mutate(newAnnouncement);
                  }
                }}
                disabled={!newAnnouncement.title || !newAnnouncement.content || createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
              >
                {createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  editingAnnouncement ? 'Update Announcement' : 'Post Announcement'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Profile</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this profile? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteProfileMutation.mutate(deleteConfirmId)}
                disabled={deleteProfileMutation.isPending}
              >
                {deleteProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Unverified User Confirmation Dialog */}
        <Dialog open={!!deleteUnverifiedUserId} onOpenChange={() => setDeleteUnverifiedUserId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Unverified User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this unverified user? This will remove their onboarding record and any partial profile data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteUnverifiedUserId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteUnverifiedUserId && deleteUnverifiedUserMutation.mutate(deleteUnverifiedUserId)}
                disabled={deleteUnverifiedUserMutation.isPending}
              >
                {deleteUnverifiedUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUserDetail} onOpenChange={() => setSelectedUserDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUserDetail?.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(selectedUserDetail?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span>{selectedUserDetail?.full_name || 'Unknown User'}</span>
                  {selectedUserDetail && getStatusBadge(selectedUserDetail.approval_status)}
                </div>
              </DialogTitle>
              <DialogDescription>
                User profile details
              </DialogDescription>
            </DialogHeader>

            {selectedUserDetail && (
              <div className="space-y-4 mt-4">
                {/* Bio */}
                {selectedUserDetail.bio && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">About</h4>
                    <p className="text-foreground">{selectedUserDetail.bio}</p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Graduation Year</p>
                      <p className="font-medium">{selectedUserDetail.graduation_year || 'Not set'}</p>
                    </div>
                  </div>

                  {selectedUserDetail.current_location && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium">{selectedUserDetail.current_location}</p>
                      </div>
                    </div>
                  )}

                  {selectedUserDetail.gender && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="font-medium">{formatGender(selectedUserDetail.gender)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-medium">
                        {new Date(selectedUserDetail.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin can see sensitive info */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Admin-Only Information</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 col-span-2">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email Address</p>
                          {selectedUserDetail.email_address ? (
                            <a
                              href={`mailto:${selectedUserDetail.email_address}`}
                              className="font-medium text-sm break-all text-amber-700 hover:underline"
                            >
                              {selectedUserDetail.email_address}
                            </a>
                          ) : (
                            <p className="font-medium text-sm text-muted-foreground">Not provided</p>
                          )}
                        </div>
                      </div>
                      {selectedUserDetail.email_address && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                          onClick={() => window.location.href = `mailto:${selectedUserDetail.email_address}`}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Mail
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <Phone className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">
                          {selectedUserDetail.phone_number || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Position Held</p>
                        <p className="font-medium">
                          {selectedUserDetail.position_held || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Education</p>
                        <p className="font-medium">
                          {selectedUserDetail.university
                            ? `${selectedUserDetail.university}${selectedUserDetail.course_studied ? ` - ${selectedUserDetail.course_studied}` : ''}`
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2">
                  User ID: {selectedUserDetail.user_id}
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setSelectedUserDetail(null)}>
                Close
              </Button>
              {selectedUserDetail && selectedUserDetail.approval_status !== 'approved' && (
                <Button
                  variant="gold"
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selectedUserDetail.id, status: 'approved' });
                    setSelectedUserDetail(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
