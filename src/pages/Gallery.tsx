
import { useState, useEffect } from 'react';
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
import { Gem, Plus, Loader2, Trash2, Camera, Edit2, Eye, X } from 'lucide-react';
import { useGallery, useProfiles } from '@/hooks/useFirebaseDB';
import { cloudinary } from '@/lib/cloudinary';

export default function Gallery() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const { gallery: items, loading: isLoading, refetch, createGalleryItem, updateGalleryItem, deleteGalleryItem } = useGallery();
    const { profiles } = useProfiles();

    const [isUploading, setIsUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [caption, setCaption] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingCaption, setEditingCaption] = useState('');
    const [isSavingCaption, setIsSavingCaption] = useState(false);
    const [viewingItem, setViewingItem] = useState<any | null>(null);

    const profilesMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));

    const enrichedItems = items.map(item => ({
        ...item,
        full_name: profilesMap.get(item.user_id) || 'Alumni'
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setFilesToUpload(prev => [...prev, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviews(prev => [...prev, event.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUpload = async () => {
        if (filesToUpload.length === 0 || !user) return;
        setIsUploading(true);

        try {
            console.log('[Gallery] Starting batch upload...', filesToUpload.length);
            for (const file of filesToUpload) {
                const { url, error } = await cloudinary.upload(file);
                if (error) {
                    console.error('[Gallery] Cloudinary Upload Failed:', error);
                    throw error;
                }
                if (url) {
                    await createGalleryItem({
                        user_id: user.id,
                        url: url,
                        caption: caption || null,
                        media_type: 'image',
                    });
                }
            }
            console.log('[Gallery] All uploads completed successfully');

            toast({ title: 'Success', description: `${filesToUpload.length} image(s) uploaded.` });
            setIsDialogOpen(false);
            setFilesToUpload([]);
            setPreviews([]);
            setCaption('');
            refetch();
        } catch (error: any) {
            console.error('[Gallery] Critical Error:', error);
            toast({ title: 'Upload failed', description: error.message || 'Check console for details', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            // In a full implementation, we'd also delete the file from storage
            // For now, just remove DB record
            await deleteGalleryItem(id);
            toast({ title: 'Deleted' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleSaveCaption = async () => {
        if (!editingItemId) return;
        setIsSavingCaption(true);
        try {
            await updateGalleryItem(editingItemId, { caption: editingCaption });
            setEditingItemId(null);
            toast({ title: 'Caption updated' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSavingCaption(false);
        }
    };

    return (
        <Layout showFooter={false}>
            <div className="container py-8 lg:py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-4xl font-bold bg-gradient-navy bg-clip-text text-transparent dark:text-white">Memory Gallery</h1>
                        <p className="text-muted-foreground mt-2">Share and relive memories with your fellow alumni</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gold" className="shadow-gold"><Plus className="h-4 w-4 mr-2" />Add Photo</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Upload Media</DialogTitle>
                                <DialogDescription>Share a moment with the RUBY community.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {previews.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 relative min-h-[200px]">
                                        <Camera className="h-10 w-10 mb-2 opacity-50" />
                                        <p className="text-sm">Click to select photos</p>
                                        <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                        {previews.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button onClick={() => {
                                                    setPreviews(prev => prev.filter((_, idx) => idx !== i));
                                                    setFilesToUpload(prev => prev.filter((_, idx) => idx !== i));
                                                }} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="caption">Caption (Optional)</Label>
                                    <Input id="caption" placeholder="Description..." value={caption} onChange={(e) => setCaption(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button variant="gold" onClick={handleUpload} disabled={filesToUpload.length === 0 || isUploading}>
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                    </div>
                ) : enrichedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {enrichedItems.map((item: any) => (
                            <Card key={item.id} className="group overflow-hidden border-none shadow-elevated transition-all hover:scale-[1.02]">
                                <div className="relative aspect-square overflow-hidden bg-muted">
                                    <img src={item.url} alt={item.caption || 'Gallery'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button variant="secondary" size="icon" onClick={() => setViewingItem(item)}><Eye className="h-4 w-4" /></Button>
                                        {user?.id === item.user_id && (
                                            <>
                                                <Button variant="secondary" size="icon" onClick={() => { setEditingItemId(item.id); setEditingCaption(item.caption || ''); }}><Edit2 className="h-4 w-4" /></Button>
                                                <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    {item.caption && <p className="text-sm font-medium mb-1 line-clamp-2">{item.caption}</p>}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>by {item.full_name}</span>
                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-muted-foreground">No memories yet</h3>
                    </div>
                )}
            </div>

            {viewingItem && (
                <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4">
                    <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full"><X className="h-8 w-8" /></button>
                    <img src={viewingItem.url} className="max-w-full max-h-full object-contain" />
                </div>
            )}

            <Dialog open={!!editingItemId} onOpenChange={(open) => !open && setEditingItemId(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Caption</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Caption</Label>
                        <Input value={editingCaption} onChange={(e) => setEditingCaption(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItemId(null)}>Cancel</Button>
                        <Button variant="gold" onClick={handleSaveCaption} disabled={isSavingCaption}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
