import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Calendar } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function Announcements() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Load announcements from localStorage
    const loadAnnouncements = () => {
      const stored = localStorage.getItem('ruby_announcements');
      if (stored) {
        const data = JSON.parse(stored);
        setAnnouncements(data.sort((a: Announcement, b: Announcement) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
      setIsLoading(false);
    };

    if (user) {
      loadAnnouncements();
    }
  }, [user]);

  if (loading) {
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Announcements</h1>
            <p className="text-muted-foreground">
              Stay updated with the latest updates from the RUBY collective
            </p>
          </div>
          {user && (
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <Megaphone className="h-4 w-4" />
              Manage Announcements
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-48 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(announcement.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No announcements yet</h3>
              <p className="text-muted-foreground">
                Check back later for updates from the RUBY collective.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
