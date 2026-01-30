import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            toast({
                title: 'Invalid Request',
                description: 'Please request a new password reset link.',
                variant: 'destructive',
            });
            navigate('/auth?mode=forgot');
        }
    }, [user, loading, navigate, toast]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const validateForm = () => {
        setErrors({});
        try {
            resetPasswordSchema.parse({ password, confirmPassword });
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
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                toast({
                    title: 'Error',
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Password Updated',
                    description: 'Your password has been successfully reset. You are now logged in.',
                });
                navigate('/dashboard');
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

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding (Reused from Auth.tsx for consistency) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 bg-cover bg-no-repeat opacity-50" />

                <div className="relative flex flex-col items-center justify-center w-full p-12 text-primary-foreground">
                    <Link to="/" className="flex items-center gap-3 mb-8">
                        <div className="h-20 w-20 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                            {/* <img src="/wchs logo-white.png" alt="" /> */}
                        </div>
                    </Link>

                    <h1 className="font-display text-4xl font-bold text-center mb-4">
                        Security Check
                    </h1>
                    <p className="text-center text-primary-foreground/80 max-w-md">
                        Update your password to secure your account.
                    </p>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background bg-cover bg-center bg-no-repeat">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="h-12 w-12 rounded-lg bg-gradient-navy flex items-center justify-center">
                            {/* <GraduationCap className="h-7 w-7 text-gold" /> */}
                            {/* <img src="/wchs logo-white.png" alt="logo" /> */}
                        </div>
                        <span className="font-display text-2xl font-bold">AFCS</span>
                    </Link>

                    <Card className="border-0 shadow-elevated">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="font-display text-2xl">
                                Set New Password
                            </CardTitle>
                            <CardDescription>
                                Please enter your new password below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
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

                                <Button
                                    type="submit"
                                    className="w-full"
                                    variant="gold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
