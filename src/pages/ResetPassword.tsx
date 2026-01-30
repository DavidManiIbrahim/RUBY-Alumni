import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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
        if (!loading && !user) navigate('/auth?mode=forgot');
    }, [user, loading, navigate]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            resetPasswordSchema.parse({ password, confirmPassword });
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach(err => { if (err.path[0]) newErrors[err.path[0] as string] = err.message; });
                setErrors(newErrors);
            }
            return;
        }

        setIsLoading(true);
        try {
            const users = JSON.parse(localStorage.getItem('afcs_users') || '[]');
            const index = users.findIndex((u: any) => u.id === user?.id);
            if (index > -1) {
                users[index].password = password; // In a real app, this should be hashed
                localStorage.setItem('afcs_users', JSON.stringify(users));
                toast({ title: 'Password Updated', description: 'Your password has been successfully reset.' });
                navigate('/dashboard');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update password.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden flex-col items-center justify-center p-12 text-primary-foreground">
                <h1 className="font-display text-4xl font-bold mb-4">Security Check</h1>
                <p className="text-center opacity-80 max-w-md">Update your password to secure your account.</p>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    <Card className="shadow-elevated">
                        <CardHeader><CardTitle className="font-display text-2xl">Set New Password</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                                </div>
                                <Button type="submit" className="w-full" variant="gold" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
