import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'signup' ? 'signup' :
      searchParams.get('mode') === 'forgot' ? 'forgot' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Removed: isAdminAccount state - admin role assignment is now admin-only via RLS
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract profile completion status to prevent redirect loops
  const { signIn, signUp, resetPassword, user, loading, isProfileComplete } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      if (isProfileComplete) {
        navigate('/dashboard');
      } else {
        navigate('/profile/setup');
      }
    }
  }, [user, loading, navigate, isProfileComplete]);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    setMode(modeParam === 'signup' ? 'signup' : modeParam === 'forgot' ? 'forgot' : 'signin');

    // Load remembered email
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [searchParams]);

  const validateForm = () => {
    setErrors({});

    try {
      if (mode === 'signup') {
        signUpSchema.parse({ fullName, email, password, confirmPassword });
      } else if (mode === 'forgot') {
        resetSchema.parse({ email });
      } else {
        signInSchema.parse({ email, password });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent you a password reset link. Please check your inbox.',
          });
          setMode('signin');
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome to AFCS!',
            description: 'Account created successfully. Complete your profile to continue.',
          });
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          navigate('/profile/setup');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Invalid credentials',
              description: 'Please check your email and password and try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex ">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden ">
        <div className="absolute inset-0 bg-primary/10 bg-cover bg-no-repeat  opacity-50" />
        {/* <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" /> */}

        <div className="relative flex flex-col items-center justify-center w-full p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="h-20 w-20 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              {/* <GraduationCap className="h-9 w-9 text-navy-dark" /> */}
              {/* <img src="/wchs logo-white.png" alt="" /> */}
            </div>
          </Link>

          <h1 className="font-display text-4xl font-bold text-center mb-4 dark:text-white">
            Welcome to AFCS
          </h1>
          <p className="text-center text-primary-foreground/80 max-w-md dark:text-white">
            AirForce Comprehensive yola Ex Airborne - Where alumni connect,
            network, and build lasting relationships.
          </p>

          <div className="absolute bottom-12 left-12 right-12">
            <blockquote className="border-l-4 border-gold pl-4">
              <p className="italic text-primary-foreground/80 dark:text-white">
                "Once a Winner, always a Winner."
              </p>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background inset-0 bg-cover bg-center bg-no-repeat">
        <div className="w-full max-w-md ">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-12 w-12 rounded-lg bg-gradient-navy text-border-white flex items-center justify-center">
              {/* <GraduationCap className="h-7 w-7 text-gold" /> */}
              {/* <br /> */}
              {/* <img src="/wchs logo-white.png" alt="" /> */}
              {/* <span className="font-display center text-2xl bg-blur  font-bold">WOSA</span> */}
            </div>
          </Link>

          <Card className="border-0 shadow-elevated">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="font-display text-2xl">
                {mode === 'signup' ? 'Create an account' :
                  mode === 'forgot' ? 'Reset your password' : 'Welcome back'}
              </CardTitle>
              <CardDescription>
                {mode === 'signup'
                  ? 'Enter your details to join the AFCS community'
                  : mode === 'forgot'
                    ? 'Enter your email and we\'ll send you a reset link'
                    : 'Enter your credentials to access your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>

              {mode === 'forgot' && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mb-4 -ml-2"
                  onClick={() => setMode('signin')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sign in
                </Button>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="name"
                      autoComplete="name"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'signup' ? "new-password" : "current-password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label
                        htmlFor="rememberMe"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 font-medium text-sm h-auto"
                      onClick={() => setMode('forgot')}
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="flex items-center space-x-2 pb-2">
                    {/* <Checkbox
                      id="isAdminAccount"
                      checked={isAdminAccount}
                      onCheckedChange={(checked) => setIsAdminAccount(checked === true)}
                    />
                    <Label
                      htmlFor="isAdminAccount"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Sign up as Administrator
                    </Label> */}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  variant="gold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === 'signup' ? (
                    'Create Account'
                  ) : mode === 'forgot' ? (
                    'Send Reset Link'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {mode === 'signup' ? (
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-semibold text-primary"
                      onClick={() => setMode('signin')}
                    >
                      Sign in
                    </Button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-semibold text-primary"
                      onClick={() => setMode('signup')}
                    >
                      Sign up
                    </Button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
