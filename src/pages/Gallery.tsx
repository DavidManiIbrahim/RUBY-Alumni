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

interface GalleryItem {
    id: string;
    image_url: string;
    caption: string | null;
    user_id: string;
    created_at: string;
    full_name?: string;
}

export default function Gallery() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    const [caption, setCaption] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingCaption, setEditingCaption] = useState('');
    const [isSavingCaption, setIsSavingCaption] = useState(false);
    const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);

    const fetchGallery = () => {
        setIsLoading(true);
        const storedGallery = localStorage.getItem('ruby_gallery');
        if (storedGallery) {
            const data = JSON.parse(storedGallery) as GalleryItem[];
            // Mock profile join
            const profiles = JSON.parse(localStorage.getItem('ruby_profiles') || '[]');
            const profilesMap = new Map(profiles.map((p: any) => [p.user_id, p.full_name]));

            const enriched = data.map(item => ({
                ...item,
                full_name: profilesMap.get(item.user_id) || 'Alumni'
            })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setItems(enriched);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, { file, url: reader.result as string }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUpload = async () => {
        if (previews.length === 0 || !user) return;
        setIsUploading(true);

        try {
            const newItems = previews.map(p => ({
                id: Math.random().toString(36).substr(2, 9),
                user_id: user.id,
                image_url: p.url,
                caption: caption || null,
                created_at: new Date().toISOString()
            }));

            const gallery = JSON.parse(localStorage.getItem('ruby_gallery') || '[]');
            localStorage.setItem('ruby_gallery', JSON.stringify([...gallery, ...newItems]));

            toast({ title: 'Success', description: `${previews.length} image(s) uploaded.` });
            setIsDialogOpen(false);
            setPreviews([]);
            setCaption('');
            fetchGallery();
        } catch (error: any) {
            toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Delete this image?')) return;
        const gallery = JSON.parse(localStorage.getItem('ruby_gallery') || '[]');
        const updated = gallery.filter((i: any) => i.id !== id);
        localStorage.setItem('ruby_gallery', JSON.stringify(updated));
        fetchGallery();
        toast({ title: 'Deleted' });
    };

    const handleSaveCaption = () => {
        if (!editingItemId) return;
        setIsSavingCaption(true);
        const storedGallery = JSON.parse(localStorage.getItem('afcs_gallery') || '[]');
        const index = storedGallery.findIndex((i: any) => i.id === editingItemId);
        if (index > -1) {
            storedGallery[index].caption = editingCaption;
            localStorage.setItem('afcs_gallery', JSON.stringify(storedGallery));
            fetchGallery();
            setEditingItemId(null);
            toast({ title: 'Caption updated' });
        }
        setIsSavingCaption(false);
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
                                <DialogDescription>Share a moment with the AFCS community.</DialogDescription>
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
                                        {previews.map((p, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                                                <img src={p.url} className="w-full h-full object-cover" />
                                                <button onClick={() => setPreviews(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1"><Trash2 className="h-3 w-3" /></button>
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
                                <Button variant="gold" onClick={handleUpload} disabled={previews.length === 0 || isUploading}>
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
                ) : items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="group overflow-hidden border-none shadow-elevated transition-all hover:scale-[1.02]">
                                <div className="relative aspect-square overflow-hidden bg-muted">
                                    <img src={item.image_url} alt={item.caption || 'Gallery'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-muted-foreground">No memories yet</h3>
                    </div>
                )}
            </div>

            {viewingItem && (
                <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4">
                    <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full"><X className="h-8 w-8" /></button>
                    <img src={viewingItem.image_url} className="max-w-full max-h-full object-contain" />
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
