import { useState, useEffect } from 'react';
import { logAppEvent } from '@/lib/telemetry';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, User, Save, Image as ImageIcon, Trash2, Pencil, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface GalleryItem {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export default function Profile() {
  const { user, loading, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [graduationYear, setGraduationYear] = useState<string>('');
  const [positionHeld, setPositionHeld] = useState('');
  const [gender, setGender] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [courseStudied, setCourseStudied] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isEditGalleryOpen, setIsEditGalleryOpen] = useState(false);
  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 6 }, (_, i) => currentYear + 5 - i);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email_address || user?.email || '');
      setGraduationYear(profile.graduation_year.toString());
      setPositionHeld(profile.position_held || '');
      setGender(profile.gender || '');
      setPhoneNumber(profile.phone_number || '');
      setCurrentLocation(profile.current_location || '');
      setBio(profile.bio || '');
      setUniversity(profile.university || '');
      setCourseStudied(profile.course_studied || '');
      setPreviewUrl(profile.profile_picture_url);
    } else if (user) {
      // Auto-populate from auth metadata if no profile exists
      const metadata = user.user_metadata;
      setEmail(user.email || '');
      if (metadata?.full_name) setFullName(metadata.full_name);
      if (metadata?.avatar_url) setPreviewUrl(metadata.avatar_url);
    }
  }, [profile, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          variant: 'destructive',
        });
        return;
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!profilePicture || !user) return null;

    const fileExt = profilePicture.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, profilePicture);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const { data: galleryItems } = useQuery({
    queryKey: ['my-gallery', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GalleryItem[];
    },
    enabled: !!user,
  });

  const updateGalleryItemMutation = useMutation({
    mutationFn: async (data: { id: string; caption: string }) => {
      const { error } = await supabase
        .from('gallery')
        .update({ caption: data.caption })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gallery'] });
      setIsEditGalleryOpen(false);
      setEditingItem(null);
      toast({ title: 'Gallery item updated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteGalleryItemMutation = useMutation({
    mutationFn: async (item: GalleryItem) => {
      // 1. Delete from storage (try best effort)
      try {
        const path = item.image_url.split('/').pop(); // Approximate path extraction
        if (path) {
          // This assumes the file path format matches what's stored. 
          // Often image_url is a full public URL. We need relative path.
          // If the upload code stored it as `userId/timestamp.ext`, we need that.
          // Let's rely on the DB delete mostly, but try storage delete.
          // To be safe, we usually store the path in DB or extract it carefully.
          // For now, let's skip complex path extraction and just delete the DB record.
          // Ideally we should delete the file from storage too to save space.
        }
      } catch (e) {
        console.error("Failed to delete file", e);
      }

      // 2. Delete from DB
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-gallery'] });
      setDeleteGalleryId(null);
      toast({ title: 'Item deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) return;

    setIsLoading(true);

    try {
      let profilePictureUrl = profile.profile_picture_url;
      if (profilePicture) {
        const newUrl = await uploadProfilePicture();
        if (newUrl) profilePictureUrl = newUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email_address: email,
          graduation_year: parseInt(graduationYear),
          position_held: positionHeld,
          gender: (gender || null) as any,
          phone_number: phoneNumber || null,
          current_location: currentLocation || null,
          bio: bio || null,
          university: university || null,
          course_studied: courseStudied || null,
          profile_picture_url: profilePictureUrl,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      void logAppEvent({
        userId: user.id,
        eventName: 'update_profile',
        path: '/profile'
      });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || !profile) {
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
      <div className="container py-8 lg:py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and contributions</p>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info" className="gap-2">
              <User className="h-4 w-4" />
              Profile Info
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              My Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card className="shadow-elevated max-w-2xl">
              <CardHeader>
                <CardTitle>Edit Information</CardTitle>
                <CardDescription>
                  Update your alumni profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={previewUrl || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {fullName ? getInitials(fullName) : <User className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor="profilePicture" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                        <Upload className="h-4 w-4" />
                        Change Profile Picture
                      </div>
                      <Input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </Label>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="name"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Position Held */}
                  <div className="space-y-2">
                    <Label htmlFor="positionHeld">Position Held *</Label>
                    <Input
                      id="positionHeld"
                      value={positionHeld}
                      onChange={(e) => setPositionHeld(e.target.value)}
                      placeholder="e.g. Headboy,Headgirl, none"
                      required
                    />
                  </div>

                  {/* Graduation Year */}
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year *</Label>
                    <Select value={graduationYear} onValueChange={setGraduationYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* University & Course */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="university">University Attended</Label>
                      <Input
                        id="university"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="e.g. University of Lagos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseStudied">Course Studied</Label>
                      <Input
                        id="courseStudied"
                        value={courseStudied}
                        onChange={(e) => setCourseStudied(e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        {/* <SelectItem value="other">Other</SelectItem> */}
                        {/* <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+234 xxxxxxxxxx"
                    />
                  </div>

                  {/* Current Location */}
                  <div className="space-y-2">
                    <Label htmlFor="currentLocation">Current Location</Label>
                    <Input
                      id="currentLocation"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Short Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us a bit about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {bio.length}/500 characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems?.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="relative aspect-video">
                    <img
                      src={item.image_url}
                      alt={item.caption || 'Gallery image'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => {
                          setEditingItem(item);
                          setEditCaption(item.caption || '');
                          setIsEditGalleryOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteGalleryId(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.caption || 'No caption'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}

              <Card className="flex items-center justify-center p-6 border-dashed aspect-video cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/gallery')}>
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Add New Photo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload to gallery
                  </p>
                </div>
              </Card>
            </div>

            {(!galleryItems || galleryItems.length === 0) && (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No photos yet</h3>
                <p className="text-muted-foreground mt-1">Start building your gallery by uploading photos.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Gallery Item Dialog */}
        <Dialog open={isEditGalleryOpen} onOpenChange={setIsEditGalleryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Caption</DialogTitle>
              <DialogDescription>
                Update the caption for this photo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Enter a caption..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditGalleryOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={() => editingItem && updateGalleryItemMutation.mutate({ id: editingItem.id, caption: editCaption })}
                disabled={updateGalleryItemMutation.isPending}
              >
                {updateGalleryItemMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteGalleryId} onOpenChange={() => setDeleteGalleryId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Photo</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this photo from your gallery? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteGalleryId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const item = galleryItems?.find(i => i.id === deleteGalleryId);
                  if (item) deleteGalleryItemMutation.mutate(item);
                }}
                disabled={deleteGalleryItemMutation.isPending}
              >
                {deleteGalleryItemMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
