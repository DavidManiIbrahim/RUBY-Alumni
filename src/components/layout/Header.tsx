import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { GraduationCap, Menu, X, LogOut, User, Shield, Users, Megaphone, Image as ImageIcon, MessageSquare, HomeIcon, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export function Header() {
  const { user, signOut, isAdmin, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (location.pathname === '/chat') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // Real-time chat notifications disabled (use polling or WebSockets if needed)
  // useEffect(() => {
  //   if (!user) return;
  //   // TODO: Implement Redis pub/sub or polling for chat notifications
  // }, [user, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-navy">
            {/* <img src="/wchs logo-white.png" alt="logo" /> */}
          </div>
          <div className="flex flex-col">
            <span className="font-display font-ariel text-xl font-bold text-foreground leading-none">
              AFCS
            </span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">AirForce Comprehensive yola <br /> Ex Airborne</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <HomeIcon className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/directory"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                Directory
              </Link>
              <Link
                to="/chat"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 relative"
              >
                <div className="relative flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[10px] absolute -top-2 -right-3 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </Link>
              <Link
                to="/announcements"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Megaphone className="h-4 w-4" />
                Announcements
              </Link>
              <Link
                to="/gallery"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ImageIcon className="h-4 w-4" />
                Gallery
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-gold hover:text-gold-dark transition-colors flex items-center gap-1"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.profile_picture_url || undefined} alt={profile?.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.full_name ? getInitials(profile.full_name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.full_name && (
                      <p className="font-medium">{profile.full_name}</p>
                    )}
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button variant="gold" onClick={() => navigate('/auth?mode=signup')}>
                Join AFCS
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/directory"
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Directory
                </Link>
                <Link
                  to="/chat"
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/announcements"
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Announcements
                </Link>
                <Link
                  to="/gallery"
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  to="/profile"
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-gold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Button variant="outline" onClick={handleSignOut} className="mt-2">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                  Sign In
                </Button>
                <Button variant="gold" onClick={() => { navigate('/auth?mode=signup'); setMobileMenuOpen(false); }}>
                  Join AFCS
                </Button>
              </>
            )}
            <div className="border-t border-border mt-2 pt-2">
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted w-full text-left flex items-center gap-2"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </>
                )}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
