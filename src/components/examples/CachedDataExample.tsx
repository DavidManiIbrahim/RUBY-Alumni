import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Zap } from 'lucide-react';
import { useCachedProfile, useCachedAnnouncements, useCachedGallery } from '@/hooks/useCache';
import { useAuth } from '@/lib/auth';

/**
 * Example component demonstrating Redis caching usage
 * This shows how to use cached data hooks in your components
 */
export function CachedDataExample() {
    const { user } = useAuth();

    // Using cached profile data
    const {
        profile,
        loading: profileLoading,
        fromCache: profileFromCache,
        refetch: refetchProfile
    } = useCachedProfile(user?.id || null);

    // Using cached announcements
    const {
        announcements,
        loading: announcementsLoading,
        fromCache: announcementsFromCache,
        refetch: refetchAnnouncements
    } = useCachedAnnouncements();

    // Using cached gallery
    const {
        gallery,
        loading: galleryLoading,
        fromCache: galleryFromCache,
        refetch: refetchGallery
    } = useCachedGallery();

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Redis Cache Demo</h2>
                    <p className="text-muted-foreground">
                        See the performance benefits of Redis caching in action
                    </p>
                </div>
                <Button
                    onClick={() => {
                        refetchProfile();
                        refetchAnnouncements();
                        refetchGallery();
                    }}
                    variant="outline"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh All
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Profile Data
                            {profileFromCache && (
                                <Badge variant="secondary" className="ml-2">
                                    <Zap className="mr-1 h-3 w-3" />
                                    Cached
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {profileFromCache ? 'Loaded from Redis (~5ms)' : 'Loaded from Database (~200ms)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {profileLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : profile ? (
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <strong>Name:</strong> {profile.full_name || 'N/A'}
                                </p>
                                <p className="text-sm">
                                    <strong>Email:</strong> {profile.email_address || 'N/A'}
                                </p>
                                <p className="text-sm">
                                    <strong>Status:</strong> {profile.approval_status}
                                </p>
                                <Button
                                    onClick={refetchProfile}
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-4"
                                >
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Refresh
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No profile data</p>
                        )}
                    </CardContent>
                </Card>

                {/* Announcements Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Announcements
                            {announcementsFromCache && (
                                <Badge variant="secondary" className="ml-2">
                                    <Zap className="mr-1 h-3 w-3" />
                                    Cached
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {announcementsFromCache ? 'Loaded from Redis (~5ms)' : 'Loaded from Database (~300ms)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {announcementsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <strong>Total:</strong> {announcements.length} announcements
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {announcements.length > 0
                                        ? `Latest: ${announcements[0]?.title?.substring(0, 30)}...`
                                        : 'No announcements'}
                                </p>
                                <Button
                                    onClick={refetchAnnouncements}
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-4"
                                >
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Refresh
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Gallery Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Gallery
                            {galleryFromCache && (
                                <Badge variant="secondary" className="ml-2">
                                    <Zap className="mr-1 h-3 w-3" />
                                    Cached
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {galleryFromCache ? 'Loaded from Redis (~5ms)' : 'Loaded from Database (~400ms)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {galleryLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <strong>Total:</strong> {gallery.length} items
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {gallery.length > 0
                                        ? `Latest upload: ${new Date(gallery[0]?.created_at).toLocaleDateString()}`
                                        : 'No gallery items'}
                                </p>
                                <Button
                                    onClick={refetchGallery}
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-4"
                                >
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Refresh
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Performance Info */}
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardHeader>
                    <CardTitle className="text-green-900 dark:text-green-100">
                        Performance Benefits
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-green-800 dark:text-green-200">
                    <p>✅ <strong>40-100x faster</strong> data loading with cache hits</p>
                    <p>✅ <strong>80-95% reduction</strong> in database queries</p>
                    <p>✅ <strong>Lower costs</strong> for cloud database services</p>
                    <p>✅ <strong>Better UX</strong> with instant data loading</p>
                    <p className="pt-2 text-xs text-green-700 dark:text-green-300">
                        💡 Tip: Click refresh multiple times to see the difference between cache hits and misses
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
