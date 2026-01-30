import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, Loader2, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { logAppEvent, markProfileCompleted } from '@/lib/telemetry';

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Valid email is required'),
  graduationYear: z.number().min(1950, 'Invalid year').max(new Date().getFullYear(), 'Invalid year'),
  positionHeld: z.string().min(1, 'Position is required').max(200),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Gender is required' })
  }),
  phoneNumber: z.string().length(11, 'Phone number must be exactly 11 digits'),
  currentLocation: z.string().min(1, 'Current location is required').max(100),
  bio: z.string().min(1, 'Bio is required').max(500),
  university: z.string().max(100).optional(),
  courseStudied: z.string().max(100).optional(),
});

export default function ProfileSetup() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const metadata = user?.user_metadata;
  const [fullName, setFullName] = useState(profile?.full_name || metadata?.full_name || metadata?.name || '');
  const [email, setEmail] = useState(profile?.email_address || user?.email || '');
  const [graduationYear, setGraduationYear] = useState<string>(profile?.graduation_year?.toString() || '');
  const [positionHeld, setPositionHeld] = useState(profile?.position_held || '');
  const [gender, setGender] = useState<Gender | ''>((profile?.gender as Gender | null) || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || metadata?.phone || '');
  const [currentLocation, setCurrentLocation] = useState(profile?.current_location || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [courseStudied, setCourseStudied] = useState(profile?.course_studied || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.profile_picture_url || metadata?.avatar_url || metadata?.picture || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Wait for loading to complete before redirecting
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const metadata = user?.user_metadata;

    // Prioritize Profile data (from database)
    if (profile) {
      setFullName(prev => prev || profile.full_name || '');
      setEmail(prev => prev || profile.email_address || '');
      setGraduationYear(prev => prev || profile.graduation_year?.toString() || '');
      setPositionHeld(prev => prev || profile.position_held || '');
      setGender(prev => prev || (profile.gender as Gender) || '');
      setPhoneNumber(prev => prev || profile.phone_number || '');
      setCurrentLocation(prev => prev || profile.current_location || '');
      setBio(prev => prev || profile.bio || '');
      setUniversity(prev => prev || profile.university || '');
      setCourseStudied(prev => prev || profile.course_studied || '');
      setPreviewUrl(prev => prev || profile.profile_picture_url || null);
    }
    // Fallback to Google/Auth metadata if profile is not yet loaded or missing fields
    else if (metadata) {
      setFullName(prev => prev || metadata.full_name || metadata.name || '');
      setEmail(prev => prev || user?.email || '');
      setPhoneNumber(prev => prev || metadata.phone || '');
      setPreviewUrl(prev => prev || metadata.avatar_url || metadata.picture || null);
    }
  }, [profile, user]);

  useEffect(() => {
    if (user) {
      void logAppEvent({
        userId: user.id,
        eventName: 'view_profile_setup',
        path: '/profile/setup'
      });
    }
  }, [user]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/auth');
      return;
    }

    setErrors({});

    const yearNum = parseInt(graduationYear);

    try {
      profileSchema.parse({
        fullName,
        email,
        graduationYear: yearNum,
        positionHeld,
        gender: gender as Gender,
        phoneNumber,
        currentLocation,
        bio,
        university,
        courseStudied,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    if (!graduationYear) {
      setErrors({ graduationYear: 'Graduation year is required' });
      return;
    }

    setIsLoading(true);

    try {
      // Validate profile picture - must be explicitly uploaded
      if (!profilePicture) {
        setErrors(prev => ({ ...prev, profilePicture: 'Profile picture is required' }));
        toast({
          title: 'Profile picture required',
          description: 'Please upload a photo to identify yourself to other alumni.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      let profilePictureUrl = null;

      // Upload the picture
      profilePictureUrl = await uploadProfilePicture();
      
      if (!profilePictureUrl) {
        throw new Error('Failed to upload profile picture');
      }

      const { error } = await supabase.from('profiles').upsert([{
        user_id: user.id,
        full_name: fullName,
        email_address: email,
        graduation_year: yearNum,
        position_held: positionHeld,
        gender: gender as Gender,
        phone_number: phoneNumber,
        current_location: currentLocation,
        bio: bio,
        university: university,
        course_studied: courseStudied,
        profile_picture_url: profilePictureUrl,
      }], { onConflict: 'user_id' }) as any;

      if (error) {
        throw error;
      } else {
        // Mark onboarding as completed (best-effort)
        void markProfileCompleted(user.id);
        void logAppEvent({
          userId: user.id,
          eventName: 'profile_completed',
          path: '/profile/setup',
        });
        await refreshProfile();
        toast({
          title: profile ? 'Profile updated!' : 'Profile created!',
          description: profile ? 'Your profile has been updated successfully.' : 'Your profile has been created successfully.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create profile',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-navy mb-4">
            <GraduationCap className="h-9 w-9 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Tell us about yourself to connect with fellow alumni
          </p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Alumni Information</CardTitle>
            <CardDescription>
              This information will be visible to other approved alumni members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-4">
                <Label htmlFor="profilePicture" className="cursor-pointer group flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-border shadow-sm transition-all group-hover:border-primary/50 group-hover:shadow-md">
                      <AvatarImage src={previewUrl || undefined} className="object-cover w-full h-full" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {fullName ? getInitials(fullName) : <User className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload Profile Picture
                  </div> */}

                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
                {errors.profilePicture && (
                  <p className="text-sm text-destructive mt-2">{errors.profilePicture}</p>
                )}
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
                  placeholder="Enter your full name"
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Position Held */}
              <div className="space-y-2">
                <Label htmlFor="positionHeld">Position Held *</Label>
                <Input
                  id="positionHeld"
                  value={positionHeld}
                  onChange={(e) => setPositionHeld(e.target.value)}
                  placeholder="e.g. Headboy, Prefect, etc"
                  className={errors.positionHeld ? 'border-destructive' : ''}
                />
                {errors.positionHeld && (
                  <p className="text-sm text-destructive">{errors.positionHeld}</p>
                )}
              </div>

              {/* Graduation Year */}
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Select value={graduationYear} onValueChange={setGraduationYear}>
                  <SelectTrigger className={errors.graduationYear ? 'border-destructive' : ''}>
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
                {errors.graduationYear && (
                  <p className="text-sm text-destructive">{errors.graduationYear}</p>
                )}
              </div>

              {/* University */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University Attended (Optional)</Label>
                  <Input
                    id="university"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. University of Lagos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseStudied">Course Studied (Optional)</Label>
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
                <Label htmlFor="gender">Gender *</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+234 xxxxxxxxxx"
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Current Location */}
              <div className="space-y-2">
                <Label htmlFor="currentLocation">Current Location *</Label>
                <Select value={currentLocation} onValueChange={setCurrentLocation}>
                  <SelectTrigger className={errors.currentLocation ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {[
                      "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
                      "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
                      "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
                      "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
                      "Sokoto", "Taraba", "Yobe", "Zamfara", "Outside Nigeria"
                    ].map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currentLocation && (
                  <p className="text-sm text-destructive">{errors.currentLocation}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio *</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  rows={4}
                  maxLength={500}
                  className={errors.bio ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/500 characters
                </p>
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio}</p>
                )}
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
                    Creating Profile...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
