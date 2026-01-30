import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
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
  Eye,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<Profile | null>(null);
  const [alumniSearch, setAlumniSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    else if (!loading && !isAdmin) navigate('/dashboard');
  }, [user, loading, isAdmin, navigate]);

  const fetchData = () => {
    setIsLoading(true);
    const profiles = JSON.parse(localStorage.getItem('afcs_profiles') || '[]');
    const ann = JSON.parse(localStorage.getItem('afcs_announcements') || '[]');
    setAllProfiles(profiles);
    setAnnouncements(ann);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAlumni = useMemo(() => {
    const q = alumniSearch.toLowerCase();
    return allProfiles.filter(p =>
      p.full_name?.toLowerCase().includes(q) ||
      p.email_address?.toLowerCase().includes(q) ||
      p.graduation_year?.toString().includes(q)
    );
  }, [allProfiles, alumniSearch]);

  const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
    const profiles = [...allProfiles];
    const index = profiles.findIndex(p => p.id === id);
    if (index > -1) {
      profiles[index].approval_status = status;
      localStorage.setItem('afcs_profiles', JSON.stringify(profiles));
      setAllProfiles(profiles);
      toast({ title: `User ${status}` });
    }
  };

  const handleDeleteProfile = (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    const filtered = allProfiles.filter(p => p.id !== id);
    localStorage.setItem('afcs_profiles', JSON.stringify(filtered));
    setAllProfiles(filtered);
    toast({ title: 'Profile deleted' });
  };

  const handleSaveAnnouncement = () => {
    const ann = [...announcements];
    if (editingAnnouncement) {
      const index = ann.findIndex(a => a.id === editingAnnouncement.id);
      if (index > -1) {
        ann[index] = { ...editingAnnouncement, ...newAnnouncement };
      }
    } else {
      ann.push({
        id: Math.random().toString(36).substr(2, 9),
        ...newAnnouncement,
        created_at: new Date().toISOString()
      });
    }
    localStorage.setItem('afcs_announcements', JSON.stringify(ann));
    setAnnouncements(ann);
    setNewAnnouncement({ title: '', content: '' });
    setEditingAnnouncement(null);
    setIsAnnouncementDialogOpen(false);
    toast({ title: 'Announcement saved' });
  };

  const handleDeleteAnnouncement = (id: string) => {
    const filtered = announcements.filter(a => a.id !== id);
    localStorage.setItem('afcs_announcements', JSON.stringify(filtered));
    setAnnouncements(filtered);
    toast({ title: 'Announcement deleted' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return null;
    }
  };

  if (loading || !isAdmin) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Layout showFooter={false}>
      <div className="container py-8 lg:py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-lg bg-gradient-navy flex items-center justify-center"><Shield className="h-6 w-6 text-gold" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage alumni registrations and announcements</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card><CardContent className="flex items-center gap-4 pt-6"><Users className="h-6 w-6 text-success" /><div><p className="text-2xl font-bold">{allProfiles.length}</p><p className="text-sm text-muted-foreground">Total Users</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 pt-6"><Megaphone className="h-6 w-6 text-accent-foreground" /><div><p className="text-2xl font-bold">{announcements.length}</p><p className="text-sm text-muted-foreground">Announcements</p></div></CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 pt-6"><Clock className="h-6 w-6 text-amber-600" /><div><p className="text-2xl font-bold">{allProfiles.filter(p => p.approval_status === 'pending').length}</p><p className="text-sm text-muted-foreground">Pending Approvals</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Alumni</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Alumni Members</CardTitle>
                  <Input placeholder="Search..." className="max-w-xs" value={alumniSearch} onChange={e => setAlumniSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAlumni.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar><AvatarImage src={p.profile_picture_url || ''} /><AvatarFallback>{p.full_name?.[0]}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-semibold">{p.full_name} {getStatusBadge(p.approval_status)}</p>
                          <p className="text-sm text-muted-foreground">Class of {p.graduation_year} • {p.email_address}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedUserDetail(p)}><Eye className="h-4 w-4" /></Button>
                        {p.approval_status === 'pending' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(p.id, 'approved')}><CheckCircle className="h-4 w-4 text-success" /></Button>}
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteProfile(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Announcements</CardTitle><CardDescription>Post updates for the community</CardDescription></div>
                <Button variant="gold" onClick={() => { setEditingAnnouncement(null); setNewAnnouncement({ title: '', content: '' }); setIsAnnouncementDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Announcement</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map(a => (
                    <div key={a.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{a.title}</h4>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingAnnouncement(a); setNewAnnouncement({ title: a.title, content: a.content }); setIsAnnouncementDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteAnnouncement(a.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAnnouncement ? 'Edit' : 'New'} Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newAnnouncement.title} onChange={e => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))} rows={5} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveAnnouncement}>Save Announcement</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedUserDetail} onOpenChange={() => setSelectedUserDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Alumni Profile: {selectedUserDetail?.full_name}</DialogTitle></DialogHeader>
          {selectedUserDetail && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Full Name</Label><p>{selectedUserDetail.full_name}</p></div>
              <div><Label className="text-xs">Email</Label><p>{selectedUserDetail.email_address}</p></div>
              <div><Label className="text-xs">Graduation Year</Label><p>{selectedUserDetail.graduation_year}</p></div>
              <div><Label className="text-xs">Location</Label><p>{selectedUserDetail.current_location}</p></div>
              <div className="col-span-2"><Label className="text-xs">Bio</Label><p className="text-sm">{selectedUserDetail.bio}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
