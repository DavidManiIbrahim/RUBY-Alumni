import { useState, useEffect } from 'react';
import { logAppEvent } from '@/lib/telemetry';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Image as ImageIcon, Plus, Loader2, Trash2, Camera, Edit2, Eye, X } from 'lucide-react';

interface GalleryItem {
    id: string;
    image_url: string;
    caption: string | null;
    user_id: string;
    created_at: string;
    profiles: {
        full_name: string;
    } | null;
}

export default function Gallery() {
    const { user, profile, approvalStatus, isAdmin } = useAuth();
    const { toast } = useToast();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [caption, setCaption] = useState('');
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingCaption, setEditingCaption] = useState('');
    const [isSavingCaption, setIsSavingCaption] = useState(false);
    const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);
    const MAX_UPLOAD_MB = 30;
    const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

    const fetchGallery = async () => {
        setIsLoading(true);
        try {
            // First try with the join
            let { data, error } = await supabase
                .from('gallery')
                .select('*, profiles(full_name)')
                .order('created_at', { ascending: false });

            // If there's an error related to relationships, fallback to manual join
            if (error && (error.message.includes('relationship') || error.code === 'PGRST200')) {
                console.warn('Relationship lookup failed, falling back to manual join');

                // Fetch gallery items only
                const { data: galleryItems, error: galleryError } = await supabase
                    .from('gallery')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (galleryError) throw galleryError;

                if (!galleryItems || galleryItems.length === 0) {
                    setItems([]);
                    return;
                }

                // Fetch profiles for these items manually
                const userIds = [...new Set(galleryItems.map((item: any) => item.user_id))];
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('user_id, full_name')
                    .in('user_id', userIds);

                if (profilesError) console.error('Error fetching fallback profiles:', profilesError);

                // Merge data
                const profilesMap = new Map(profiles?.map((p: any) => [p.user_id, p]));
                data = galleryItems.map((item: any) => ({
                    ...item,
                    profiles: profilesMap.get(item.user_id) || { full_name: 'Alumni' }
                }));

                // Clear the original error since we handled it
                error = null;
            } else if (error) {
                throw error;
            }

            setItems(data as unknown as GalleryItem[]);
        } catch (error: any) {
            console.error('Gallery fetch error:', error);
            toast({
                title: 'Error fetching gallery',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate each file
        const validFiles: File[] = [];
        for (const file of files) {
            if (file.size > MAX_UPLOAD_BYTES) {
                toast({
                    title: 'File too large',
                    description: `${file.name} exceeds ${MAX_UPLOAD_MB}MB limit`,
                    variant: 'destructive',
                });
                continue;
            }
            validFiles.push(file);
        }

        // Create preview URLs
        const newPreviews = validFiles.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index: number) => {
        const preview = previews[index];
        URL.revokeObjectURL(preview.url);

        setPreviews(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0 || !user) return;

        setIsUploading(true);
        try {
            const uploadPromises = selectedFiles.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const filePath = fileName;

                const { error: uploadError } = await supabase.storage
                    .from('gallery')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('gallery')
                    .getPublicUrl(filePath);

                return {
                    user_id: user.id,
                    image_url: publicUrl,
                    caption: caption || null,
                };
            });

            const uploadedImages = await Promise.all(uploadPromises);

            const { error: dbError } = await supabase
                .from('gallery')
                .insert(uploadedImages);

            if (dbError) throw dbError;

            void logAppEvent({
                userId: user.id,
                eventName: 'gallery_upload',
                path: '/gallery',
                metadata: { count: selectedFiles.length, has_caption: !!caption }
            });

            toast({
                title: 'Success',
                description: `${selectedFiles.length} image(s) uploaded to gallery`,
            });

            setIsDialogOpen(false);
            setSelectedFiles([]);
            setCaption('');
            previews.forEach(p => URL.revokeObjectURL(p.url));
            setPreviews([]);
            fetchGallery();
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (item: GalleryItem) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            // Extract file path from URL
            const url = new URL(item.image_url);
            const pathParts = url.pathname.split('/');
            const fileName = pathParts.slice(pathParts.indexOf('gallery') + 1).join('/');

            const { error: storageError } = await supabase.storage
                .from('gallery')
                .remove([fileName]);

            if (storageError) console.error('Storage deletion error:', storageError);

            const { error: dbError } = await supabase
                .from('gallery')
                .delete()
                .eq('id', item.id);

            if (dbError) throw dbError;

            void logAppEvent({
                userId: user.id,
                eventName: 'gallery_delete',
                path: '/gallery',
                metadata: { item_id: item.id }
            });

            setItems(items.filter(i => i.id !== item.id));
            toast({
                title: 'Deleted',
                description: 'Image removed from gallery',
            });
        } catch (error: any) {
            toast({
                title: 'Deletion failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleEditCaption = (item: GalleryItem) => {
        setEditingItemId(item.id);
        setEditingCaption(item.caption || '');
    };

    const handleSaveCaption = async () => {
        if (!editingItemId) return;

        setIsSavingCaption(true);
        try {
            const { error } = await supabase
                .from('gallery')
                .update({ caption: editingCaption })
                .eq('id', editingItemId);

            if (error) throw error;

            void logAppEvent({
                userId: user.id,
                eventName: 'gallery_edit_caption',
                path: '/gallery',
                metadata: { item_id: editingItemId }
            });

            setItems(items.map(item =>
                item.id === editingItemId
                    ? { ...item, caption: editingCaption }
                    : item
            ));

            toast({
                title: 'Updated',
                description: 'Caption updated successfully',
            });

            setEditingItemId(null);
            setEditingCaption('');
        } catch (error: any) {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsSavingCaption(false);
        }
    };

    const isApproved = true; // Status removed as per user request

    const isVideo = (url: string) => {
        try {
            const urlObj = new URL(url);
            const ext = urlObj.pathname.split('.').pop()?.toLowerCase();
            return ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '');
        } catch {
            return false;
        }
    };

    const getCurrentItemIndex = () => {
        return items.findIndex(item => item.id === viewingItem?.id);
    };

    const handlePreviousImage = () => {
        const currentIndex = getCurrentItemIndex();
        if (currentIndex > 0) {
            setViewingItem(items[currentIndex - 1]);
        }
    };

    const handleNextImage = () => {
        const currentIndex = getCurrentItemIndex();
        if (currentIndex < items.length - 1) {
            setViewingItem(items[currentIndex + 1]);
        }
    };

    useEffect(() => {
        if (!viewingItem) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePreviousImage();
            if (e.key === 'ArrowRight') handleNextImage();
            if (e.key === 'Escape') setViewingItem(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewingItem, items]);

    return (
        <>
            {viewingItem ? (
                // Fullscreen Viewer - No navbar
                <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 w-screen h-screen overflow-hidden">
                    <div className="relative w-full h-full flex flex-col items-center justify-between max-w-6xl max-h-screen">
                        {/* Close Button */}
                        <button
                            onClick={() => setViewingItem(null)}
                            className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Media Container */}
                        <div className="flex-1 w-full flex items-center justify-center relative">
                            {isVideo(viewingItem.image_url) ? (
                                <video
                                    src={viewingItem.image_url}
                                    controls
                                    className="w-auto h-auto max-w-full max-h-[calc(100vh-200px)] object-contain"
                                />
                            ) : (
                                <img
                                    src={viewingItem.image_url}
                                    alt={viewingItem.caption || 'Gallery Image'}
                                    className="w-auto h-auto max-w-full max-h-[calc(100vh-200px)] object-contain"
                                />
                            )}

                            {/* Previous Button */}
                            {getCurrentItemIndex() > 0 && (
                                <button
                                    onClick={handlePreviousImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                                    title="Previous image (←)"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}

                            {/* Next Button */}
                            {getCurrentItemIndex() < items.length - 1 && (
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                                    title="Next image (→)"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Info Footer */}
                        <div className="w-full text-white text-center py-4">
                            {viewingItem.caption && (
                                <p className="text-lg mb-2">{viewingItem.caption}</p>
                            )}
                            <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
                                <span>by {viewingItem.profiles?.full_name || 'Alumni'}</span>
                                <span>•</span>
                                <span>{new Date(viewingItem.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{getCurrentItemIndex() + 1} / {items.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Normal Gallery with Layout
                <Layout showFooter={false}>
                    <div className="container py-8 lg:py-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="font-display text-4xl font-bold bg-gradient-navy bg-clip-text text-transparent dark:text-white">
                                    Memory Gallery
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Share and relive memories with your fellow alumni
                                </p>
                                <p className="text-sm font-medium text-muted-foreground mt-3">
                                    {items.length} {items.length === 1 ? 'image' : 'images'} uploaded
                                </p>
                            </div>

                            {isApproved && (
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="gold" className="shadow-gold">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Photo/Video
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Upload Media</DialogTitle>
                                            <DialogDescription>
                                                Share a moment with the AFCS community.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 py-4">
                                            {previews.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 transition-colors hover:border-primary/50 relative overflow-hidden min-h-[200px]">
                                                    <div className="flex flex-col items-center text-muted-foreground">
                                                        <Camera className="h-10 w-10 mb-2 opacity-50" />
                                                        <p className="text-sm">Click to select or drag and drop</p>
                                                        <p className="text-xs mt-1">Images or Videos up to {MAX_UPLOAD_MB}MB</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*,video/*"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                                        onChange={handleFileChange}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                                        {previews.map((preview, index) => (
                                                            <div key={index} className="relative group">
                                                                <div className="relative aspect-square overflow-hidden bg-muted rounded-lg border border-muted-foreground/20">
                                                                    {preview.file.type.startsWith('video/') ? (
                                                                        <video
                                                                            src={preview.url}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <img
                                                                            src={preview.url}
                                                                            alt={`Preview ${index + 1}`}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFile(index)}
                                                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                                <p className="text-xs text-muted-foreground mt-1 truncate">{preview.file.name}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-4 transition-colors hover:border-primary/50 relative overflow-hidden">
                                                        <div className="flex flex-col items-center text-muted-foreground text-center">
                                                            <Plus className="h-6 w-6 mb-1 opacity-50" />
                                                            <p className="text-xs">Add more photos/videos</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*,video/*"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                                            onChange={handleFileChange}
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="caption">Caption (Optional - applies to all)</Label>
                                                <Input
                                                    id="caption"
                                                    placeholder="What's happening in these moments?"
                                                    value={caption}
                                                    onChange={(e) => setCaption(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="gold"
                                                onClick={handleUpload}
                                                disabled={selectedFiles.length === 0 || isUploading}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Uploading {selectedFiles.length}...
                                                    </>
                                                ) : (
                                                    `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {/* Status banner removed */}

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="aspect-square rounded-xl" />
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : items.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {items.map((item) => (
                                    <Card key={item.id} className="group overflow-hidden border-none shadow-elevated transition-all hover:scale-[1.02]">
                                        <div className="relative aspect-square overflow-hidden bg-muted">
                                            {isVideo(item.image_url) ? (
                                                <video
                                                    src={item.image_url}
                                                    controls
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.caption || 'Gallery Image'}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="rounded-full shadow-lg pointer-events-auto"
                                                    onClick={() => setViewingItem(item)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {user?.id === item.user_id && (
                                                    <>
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="rounded-full shadow-lg pointer-events-auto"
                                                            onClick={() => handleEditCaption(item)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="rounded-full shadow-lg pointer-events-auto"
                                                            onClick={() => handleDelete(item)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            {item.caption && (
                                                <p className="text-sm font-medium mb-1 line-clamp-2">{item.caption}</p>
                                            )}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>by {item.profiles?.full_name || 'Alumni'}</span>
                                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/10">
                                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                                <h3 className="text-lg font-medium text-muted-foreground">No memories yet</h3>
                                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                                    Be the first to share a moment from your school days!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Edit Caption Dialog */}
                    <Dialog open={!!editingItemId} onOpenChange={(open) => {
                        if (!open) {
                            setEditingItemId(null);
                            setEditingCaption('');
                        }
                    }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit Caption</DialogTitle>
                                <DialogDescription>
                                    Update the caption for this image.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-caption">Caption</Label>
                                    <Input
                                        id="edit-caption"
                                        placeholder="What's happening in this moment?"
                                        value={editingCaption}
                                        onChange={(e) => setEditingCaption(e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingItemId(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="gold"
                                    onClick={handleSaveCaption}
                                    disabled={isSavingCaption}
                                >
                                    {isSavingCaption ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </Layout>
            )}
        </>
    );
}
