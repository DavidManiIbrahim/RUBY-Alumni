import { useState, useEffect, useRef } from 'react';
import { logAppEvent } from '@/lib/telemetry';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Message {
    id: string;
    user_id: string;
    content: string;
    room_id: string;
    created_at: string;
    profile?: {
        full_name: string;
        profile_picture_url: string | null;
    };
}

export default function Chat() {
    const { user, profile } = useAuth();
    const [activeRoom, setActiveRoom] = useState('general');
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [authorProfiles, setAuthorProfiles] = useState<Record<string, { full_name: string | null, profile_picture_url: string | null }>>({});

    const graduationYear = profile?.graduation_year?.toString();
    const classRoomId = graduationYear ? `class_${graduationYear}` : null;

    // Initial fetch of messages
    const { data: initialMessages, refetch } = useQuery({
        queryKey: ['chat-messages', activeRoom],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', activeRoom)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            return data as Message[];
        },
        enabled: !!activeRoom,
    });

    // Sync state with fetching
    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages);
            fetchAuthors(initialMessages);
        }
    }, [initialMessages]);

    const fetchAuthors = async (msgs: Message[]) => {
        const userIds = [...new Set(msgs.map(m => m.user_id))];
        const missingIds = userIds.filter(id => !authorProfiles[id]);

        if (missingIds.length > 0) {
            const { data } = await supabase
                .from('profiles')
                .select('user_id, full_name, profile_picture_url')
                .in('user_id', missingIds);

            if (data) {
                setAuthorProfiles(prev => {
                    const newProfiles = { ...prev };
                    data.forEach(p => {
                        newProfiles[p.user_id] = {
                            full_name: p.full_name,
                            profile_picture_url: p.profile_picture_url
                        };
                    });
                    return newProfiles;
                });
            }
        }
    };

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('chat_updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${activeRoom}`,
                },
                async (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => [...prev, newMsg]);
                    // Fetch author if unknown
                    if (!authorProfiles[newMsg.user_id]) {
                        const { data } = await supabase.from('profiles').select('full_name, profile_picture_url').eq('user_id', newMsg.user_id).single();
                        if (data) {
                            setAuthorProfiles(prev => ({
                                ...prev,
                                [newMsg.user_id]: { full_name: data.full_name, profile_picture_url: data.profile_picture_url }
                            }));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeRoom]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const msg = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        const { error } = await supabase.from('chat_messages').insert({
            user_id: user.id,
            content: msg,
            room_id: activeRoom,
        });

        if (error) {
            console.error('Error sending message:', error);
            // Ideally handle error UI
        } else {
            void logAppEvent({
                userId: user.id,
                eventName: 'send_message',
                path: '/chat',
                metadata: { room: activeRoom }
            });
        }
    };

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

    const formatTime = (date: string) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diffHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

        if (diffHours < 24) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getRoomLabel = () => {
        if (activeRoom === 'general') return 'General Chat';
        return `Class of ${graduationYear}`;
    };

    return (
        <Layout showFooter={false}>
            <div className="flex h-[calc(100vh-80px)] bg-background overflow-hidden">
                {/* Sidebar - Room List */}
                <div className="hidden md:flex flex-col w-72 border-r border-border bg-muted/20 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-border">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Chats
                        </h2>
                    </div>

                    {/* Room List */}
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {/* General Chat */}
                            <button
                                onClick={() => setActiveRoom('general')}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                    activeRoom === 'general'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted/40 text-foreground'
                                }`}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-blue-500 text-white">G</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">General</p>
                                    <p className="text-xs opacity-70 truncate">Alumni General Chat</p>
                                </div>
                            </button>

                            {/* Class Chat */}
                            {classRoomId && (
                                <button
                                    onClick={() => setActiveRoom(classRoomId)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                                        activeRoom === classRoomId
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted/40 text-foreground'
                                    }`}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-green-500 text-white">{graduationYear?.slice(-2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">Class of {graduationYear}</p>
                                        <p className="text-xs opacity-70 truncate">Your class chat</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-border bg-muted/20 px-6 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="md:hidden">
                                <Button variant="outline" size="sm" onClick={() => setActiveRoom('general')}>
                                    {getRoomLabel()}
                                </Button>
                            </div>
                            <div className="hidden md:block">
                                <h3 className="font-semibold text-foreground">{getRoomLabel()}</h3>
                                <p className="text-xs text-muted-foreground">Active now</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 overflow-hidden bg-background">
                        <div className="flex flex-col p-4 space-y-3 h-full">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                    <MessageSquare className="h-12 w-12 opacity-20" />
                                    <p className="text-center max-w-xs">
                                        No messages yet. Start the conversation!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((item, index) => {
                                        const isMe = item.user_id === user?.id;
                                        const author = authorProfiles[item.user_id];
                                        const showAvatar = index === 0 || messages[index - 1].user_id !== item.user_id;
                                        const showTimestamp = index === 0 || 
                                            new Date(messages[index - 1].created_at).toDateString() !== new Date(item.created_at).toDateString() ||
                                            (new Date(item.created_at).getTime() - new Date(messages[index - 1].created_at).getTime()) > 5 * 60 * 1000;

                                        return (
                                            <div key={item.id}>
                                                {showTimestamp && (
                                                    <div className="flex items-center justify-center my-2">
                                                        <div className="text-[11px] text-muted-foreground bg-muted rounded-full px-3 py-1">
                                                            {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`flex gap-2 items-flex-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    {!isMe && showAvatar && (
                                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                                            <AvatarImage src={author?.profile_picture_url || undefined} />
                                                            <AvatarFallback>{getInitials(author?.full_name || 'U')}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    {!isMe && !showAvatar && (
                                                        <div className="w-8 flex-shrink-0" />
                                                    )}

                                                    <div className={`flex flex-col max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                                                        {!isMe && showAvatar && (
                                                            <span className="text-xs font-medium text-muted-foreground mb-1 px-3">
                                                                {author?.full_name || 'Unknown'}
                                                            </span>
                                                        )}
                                                        <div
                                                            className={`px-4 py-2 rounded-2xl text-sm break-words ${
                                                                isMe
                                                                    ? 'bg-primary text-primary-foreground rounded-br-none shadow-sm'
                                                                    : 'bg-muted text-foreground rounded-bl-none'
                                                            }`}
                                                        >
                                                            {item.content}
                                                        </div>
                                                        <span className={`text-[11px] text-muted-foreground mt-0.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                            {formatTime(item.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="h-20 border-t border-border bg-background px-4 py-3 flex-shrink-0">
                        <form onSubmit={handleSendMessage} className="flex gap-3 items-end h-full">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 rounded-full border-muted bg-muted/50 focus:bg-muted"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-full flex-shrink-0 h-10 w-10"
                                disabled={!newMessage.trim()}
                                variant={newMessage.trim() ? 'default' : 'outline'}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Mobile Room Selector - Drawer Style */}
                {false && (
                    <div className="md:hidden absolute inset-0 bg-background p-4 space-y-2">
                        <Button
                            onClick={() => setActiveRoom('general')}
                            variant={activeRoom === 'general' ? 'secondary' : 'ghost'}
                            className="w-full justify-start gap-2"
                        >
                            <Users className="h-4 w-4" />
                            General
                        </Button>
                        {classRoomId && (
                            <Button
                                onClick={() => setActiveRoom(classRoomId)}
                                variant={activeRoom === classRoomId ? 'secondary' : 'ghost'}
                                className="w-full justify-start gap-2"
                            >
                                <Users className="h-4 w-4" />
                                Class of {graduationYear}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
