import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    user_id: string;
    content: string;
    room_id: string;
    created_at: string;
}

export default function Chat() {
    const { user, profile } = useAuth();
    const [activeRoom, setActiveRoom] = useState('general');
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [authorProfiles, setAuthorProfiles] = useState<Record<string, any>>({});

    const graduationYear = profile?.graduation_year?.toString();
    const classRoomId = graduationYear ? `class_${graduationYear}` : null;

    useEffect(() => {
        const fetchMessages = () => {
            const stored = localStorage.getItem('afcs_chat_messages');
            if (stored) {
                const allMessages = JSON.parse(stored) as Message[];
                setMessages(allMessages.filter(m => m.room_id === activeRoom));
            }
        };

        const fetchProfiles = () => {
            const stored = localStorage.getItem('afcs_profiles');
            if (stored) {
                const profiles = JSON.parse(stored);
                const map: any = {};
                profiles.forEach((p: any) => { map[p.user_id] = p; });
                setAuthorProfiles(map);
            }
        };

        fetchMessages();
        fetchProfiles();

        const interval = setInterval(fetchMessages, 3000); // Poll for updates
        return () => clearInterval(interval);
    }, [activeRoom]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const newMsg: Message = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: user.id,
            content: newMessage.trim(),
            room_id: activeRoom,
            created_at: new Date().toISOString()
        };

        const stored = JSON.parse(localStorage.getItem('afcs_chat_messages') || '[]');
        localStorage.setItem('afcs_chat_messages', JSON.stringify([...stored, newMsg]));
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoomLabel = () => activeRoom === 'general' ? 'General Chat' : `Class of ${graduationYear}`;

    return (
        <Layout showFooter={false}>
            <div className="flex h-[calc(100vh-80px)] bg-background overflow-hidden">
                <div className="hidden md:flex flex-col w-72 border-r border-border bg-muted/20 overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" /> Chats
                        </h2>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            <button onClick={() => setActiveRoom('general')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeRoom === 'general' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/40 text-foreground'}`}>
                                <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-500 text-white">G</AvatarFallback></Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">General</p>
                                    <p className="text-xs opacity-70 truncate">Alumni General Chat</p>
                                </div>
                            </button>
                            {classRoomId && (
                                <button onClick={() => setActiveRoom(classRoomId)} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeRoom === classRoomId ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/40 text-foreground'}`}>
                                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-green-500 text-white">{graduationYear?.slice(-2)}</AvatarFallback></Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">Class of {graduationYear}</p>
                                        <p className="text-xs opacity-70 truncate">Your class chat</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-16 border-b border-border bg-muted/20 px-6 flex items-center justify-between">
                        <h3 className="font-semibold">{getRoomLabel()}</h3>
                    </div>
                    <ScrollArea className="flex-1 bg-background">
                        <div className="flex flex-col p-4 space-y-3">
                            {messages.map((item, index) => {
                                const isMe = item.user_id === user?.id;
                                const author = authorProfiles[item.user_id];
                                return (
                                    <div key={item.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                                            {!isMe && <span className="text-xs font-medium text-muted-foreground mb-1">{author?.full_name || 'Alumni'}</span>}
                                            <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'}`}>
                                                {item.content}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-0.5">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="h-20 border-t border-border bg-background px-4 py-3">
                        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                            <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="rounded-full flex-1" />
                            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim()}><Send className="h-5 w-5" /></Button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
