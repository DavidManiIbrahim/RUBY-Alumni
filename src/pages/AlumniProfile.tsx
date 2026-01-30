import { useEffect } from 'react';
import { logAppEvent } from '@/lib/telemetry';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, GraduationCap, Phone, User, Calendar, Briefcase, Mail, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AlumniProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Use profiles_public for other users (excludes sensitive fields like email/phone)
  // Use profiles for own profile (full access)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['alumni-profile', id, user?.id],
    queryFn: async () => {
      // First check the owner to determine what fields to select
      const { data: userData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', id)
        .single();

      const isOwnProfile = userData?.user_id === user?.id;

      if (isOwnProfile) {
        // Own profile - select all fields including sensitive ones
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      } else {
        // Other user's profile - select only public fields
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            full_name,
            graduation_year,
            profile_picture_url,
            gender,
            current_location,
            bio,
            university,
            course_studied,
            position_held,
            created_at
          `)
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      }
    },
    enabled: !!user && !!id,
  });

  useEffect(() => {
    if (user && profile) {
      void logAppEvent({
        userId: user.id,
        eventName: 'view_alumni_profile',
        path: `/alumni/${id}`,
        metadata: { target_alumni_id: profile.user_id, target_name: profile.full_name }
      });
    }
  }, [user, profile, id]);

  const isOwnProfile = profile?.user_id === user?.id;

  /* Fetch Gallery Items */
  const { data: galleryItems } = useQuery({
    queryKey: ['alumni-gallery', profile?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.user_id,
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

  const formatGender = (gender: string | null) => {
    if (!gender) return null;
    return gender.charAt(0).toUpperCase() + gender.slice(1).replace('_', ' ');
  };

  if (loading || profileLoading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout showFooter={false}>
        <div className="container py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground">
                This alumni profile doesn't exist or is not accessible.
              </p>
              <Button className="mt-4" onClick={() => navigate('/directory')}>
                Back to Directory
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="container py-8 lg:py-12 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/directory')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

        <Card className="overflow-hidden">
          {/* Header with gradient background */}
          <div className="h-32 bg-gradient-navy" />

          <CardHeader className="relative pt-0 pb-4">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-32 w-32 -mt-16 border-4 border-background shadow-elevated">
                <AvatarImage src={profile.profile_picture_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="font-display text-2xl lg:text-3xl font-bold">
                  {profile.full_name}
                </h1>
                <Badge variant="secondary" className="mt-2">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Class of {profile.graduation_year}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {profile.current_location && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{profile.current_location}</p>
                  </div>
                </div>
              )}

              {profile.position_held && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Position Held</p>
                    <p className="font-medium">{profile.position_held}</p>
                  </div>
                </div>
              )}

              {/* Email and phone only shown for own profile (from profiles table, not profiles_public) */}
              {isOwnProfile && 'email_address' in profile && (profile as { email_address?: string }).email_address && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{(profile as { email_address: string }).email_address}</p>
                  </div>
                </div>
              )}

              {isOwnProfile && 'phone_number' in profile && (profile as { phone_number?: string }).phone_number && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{(profile as { phone_number: string }).phone_number}</p>
                  </div>
                </div>
              )}

              {profile.university && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Education</p>
                    <p className="font-medium">
                      {profile.university}
                      {profile.course_studied && ` - ${profile.course_studied}`}
                    </p>
                  </div>
                </div>
              )}

              {profile.gender && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{formatGender(profile.gender)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Section */}
        {galleryItems && galleryItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {galleryItems.map((item) => (
                <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden border shadow-sm group bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.caption || 'Gallery image'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm truncate">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout >
  );
}
