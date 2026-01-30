import { useState, useEffect } from 'react';
import { logAppEvent } from '@/lib/telemetry';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, GraduationCap, User, Users, Filter, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

export default function Directory() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (searchQuery || yearFilter !== 'all')) {
      const timer = setTimeout(() => {
        void logAppEvent({
          userId: user.id,
          eventName: 'directory_search',
          path: '/directory',
          metadata: { query: searchQuery, year: yearFilter }
        });
      }, 1000); // Debounce logging
      return () => clearTimeout(timer);
    }
  }, [searchQuery, yearFilter, user]);

  const { data: result, isLoading: profilesLoading } = useQuery({
    queryKey: ['alumni-profiles', searchQuery, yearFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Query profiles table directly to ensure visibility
      let query = supabase
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
          course_studied
        `, { count: 'exact' })
        .order('graduation_year', { ascending: false });

      if (searchQuery) {
        query = query.ilike('full_name', `%${searchQuery}%`);
      }

      if (yearFilter && yearFilter !== 'all') {
        query = query.eq('graduation_year', parseInt(yearFilter));
      }

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;
      return { data: data as Profile[], count: count || 0 };
    },
    enabled: !!user,
  });

  const profiles = result?.data || [];
  const totalCount = result?.count || 0;

  const { data: years } = useQuery({
    queryKey: ['graduation-years'],
    queryFn: async () => {
      // Use profiles table directly
      const { data, error } = await supabase
        .from('profiles')
        .select('graduation_year')
        .order('graduation_year', { ascending: false });

      if (error) throw error;

      const uniqueYears = [...new Set(data.map(p => p.graduation_year).filter(Boolean))];
      return uniqueYears;
    },
    enabled: !!user,
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  // No need to slice locally anymore
  const paginatedProfiles = profiles;

  if (loading || !user) {
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
      <div className="container py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Alumni Directory</h1>
          <p className="text-muted-foreground">
            Connect with fellow alumni from RUBY Peculiar College
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={yearFilter} onValueChange={(value) => {
              setYearFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years?.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    Class of {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          {totalCount} alumni found
        </p>

        {/* Alumni Grid */}
        {profilesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-muted mb-4" />
                    <div className="h-4 w-32 bg-muted rounded mb-2" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedProfiles.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProfiles.map((profile) => (
                <Card
                  key={profile.id}
                  className="card-hover cursor-pointer"
                  onClick={() => navigate(`/alumni/${profile.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarImage src={profile.profile_picture_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                      <Badge variant="secondary" className="mt-2">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Class of {profile.graduation_year}
                      </Badge>
                      {profile.university && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {profile.university}
                        </p>
                      )}
                      {profile.current_location && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {profile.current_location}
                        </p>
                      )}
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No alumni found</h3>
              <p className="text-muted-foreground">
                {searchQuery || yearFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No alumni profiles yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
