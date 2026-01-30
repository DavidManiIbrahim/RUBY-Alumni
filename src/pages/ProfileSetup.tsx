import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Profile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gem, Loader2, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

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
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email_address || user?.email || '');
  const [graduationYear, setGraduationYear] = useState<string>(profile?.graduation_year?.toString() || '');
  const [positionHeld, setPositionHeld] = useState(profile?.position_held || '');
  const [gender, setGender] = useState<Gender | ''>((profile?.gender as Gender | null) || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [currentLocation, setCurrentLocation] = useState(profile?.current_location || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [courseStudied, setCourseStudied] = useState(profile?.course_studied || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.profile_picture_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please select an image under 5MB', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
        error.errors.forEach((err) => { if (err.path[0]) newErrors[err.path[0] as string] = err.message; });
        setErrors(newErrors);
        return;
      }
    }

    if (!graduationYear) {
      setErrors({ graduationYear: 'Graduation year is required' });
      return;
    }

    if (!previewUrl) {
      toast({ title: 'Profile picture required', description: 'Please upload a photo.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const newProfile: any = {
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
        profile_picture_url: previewUrl,
        is_complete: true,
        approval_status: 'approved' // Auto-approve for localStorage demo
      };

      const profiles = JSON.parse(localStorage.getItem('ruby_profiles') || '[]');
      const index = profiles.findIndex((p: any) => p.user_id === user.id);

      if (index > -1) {
        profiles[index] = newProfile;
      } else {
        profiles.push(newProfile);
      }

      localStorage.setItem('ruby_profiles', JSON.stringify(profiles));
      localStorage.setItem('ruby_profile', JSON.stringify(newProfile));

      toast({ title: 'Profile saved!', description: 'Your profile has been updated successfully.' });

      // Force reload to get fresh profile from localStorage
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-ruby shadow-ruby rotate-3 mb-4">
            <Gem className="h-9 w-9 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">Tell us about yourself to connect with fellow alumni</p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Alumni Information</CardTitle>
            <CardDescription>This information will be visible to other approved alumni members</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Input id="profilePicture" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@gmail.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionHeld">Position Held *</Label>
                <Input id="positionHeld" value={positionHeld} onChange={(e) => setPositionHeld(e.target.value)} placeholder="e.g. Headboy, Prefect, etc" />
                {errors.positionHeld && <p className="text-sm text-destructive">{errors.positionHeld}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Select value={graduationYear} onValueChange={setGraduationYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {years.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.graduationYear && <p className="text-sm text-destructive">{errors.graduationYear}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University Attended (Optional)</Label>
                  <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. University of Lagos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseStudied">Course Studied (Optional)</Label>
                  <Input id="courseStudied" value={courseStudied} onChange={(e) => setCourseStudied(e.target.value)} placeholder="e.g. Computer Science" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="080xxxxxxxx" />
                {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentLocation">Current Location *</Label>
                <Select value={currentLocation} onValueChange={setCurrentLocation}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Enugu", "Outside Nigeria"].map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currentLocation && <p className="text-sm text-destructive">{errors.currentLocation}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio *</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a bit about yourself..." rows={4} maxLength={500} />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/500 characters</p>
                {errors.bio && <p className="text-sm text-destructive">{errors.bio}</p>}
              </div>

              <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Profile...</> : 'Complete Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
