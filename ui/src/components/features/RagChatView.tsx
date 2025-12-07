import React, { useState, useEffect, useRef } from 'react';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { ragApi } from '../../api/rag.api';
import { MessageSquare, Send, Paperclip, Bot, User, Database, Plus, Loader2, Sparkles, Search, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/ToastContext';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isTyping?: boolean;
}

const RagChatView: React.FC = () => {
    const [files, setFiles] = useState<OCRResult[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        const loadFiles = async () => {
            const res = await ocrApi.getList(1, 100);
            if (res.success) {
                setFiles(res.data.data.filter((f: OCRResult) => f.status.overall === 'SUCCESS'));
            }
        };
        loadFiles();
    }, []);

    const handleIngest = async (id: string) => {
        try {
            showToast('Ingesting document into Knowledge Base...', 'info');
            const res = await ragApi.ingest(id);
            if (res.success) showToast('Document Ingested Successfully', 'success');
        } catch (e) {
            showToast('Ingestion Failed', 'error');
        }
    };

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsTyping(true);

        try {
            // Check if user selected a file to filter context
            const res = await ragApi.chat(userMsg.content, selectedFileId || undefined);
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: res.data.answer || "I'm sorry, I couldn't generate an answer.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Error: Unable to reach the RAG engine. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
            {/* Sidebar: Knowledge Base */}
            <div className="w-80 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden flex flex-col shrink-0 hidden md:flex">
                <div className="p-5 border-b border-gray-800 bg-gray-950/30">
                    <h2 className="text-sm font-bold text-gray-200 uppercase flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-500" /> Knowledge Base
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {files.map(f => (
                        <div 
                            key={f._id} 
                            onClick={() => setSelectedFileId(f._id === selectedFileId ? '' : f._id)}
                            className={cn(
                                "p-3 rounded-xl border cursor-pointer group transition-all",
                                f._id === selectedFileId 
                                    ? "bg-emerald-900/20 border-emerald-500/50 hover:bg-emerald-900/30" 
                                    : "bg-gray-950/50 border-gray-800 hover:border-gray-700"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-bold text-gray-300 line-clamp-1 break-all" title={f.originalName}>
                                    {f.originalName}
                                </div>
                                {f._id === selectedFileId && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />}
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleIngest(f._id); }}
                                    className="text-[10px] flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors border border-gray-700"
                                >
                                    <Plus className="w-3 h-3" /> Ingest
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-3xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 z-10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-900/20">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white">AI Assistant</h1>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                                {selectedFileId && <span className="text-emerald-400 ml-2">• Focused on 1 doc</span>}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 pt-24 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <Sparkles className="w-16 h-16 text-indigo-400 mb-4" />
                            <h3 className="text-lg font-bold text-gray-400">How can I help you today?</h3>
                            <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">
                                I can analyze your documents, summarize content, or answer questions based on your specialized knowledge base.
                            </p>
                        </div>
                    )}
                    
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-4 max-w-3xl mx-auto", msg.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-2",
                                msg.role === 'user' ? "bg-gray-700" : "bg-indigo-600"
                            )}>
                                {msg.role === 'user' ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5 text-white" />}
                            </div>
                            
                            <div className={cn(
                                "p-4 rounded-2xl text-sm leading-relaxed shadow-md",
                                msg.role === 'user' 
                                    ? "bg-gray-800 text-gray-200 rounded-tr-none border border-gray-700" 
                                    : "bg-indigo-900/20 text-indigo-100 rounded-tl-none border border-indigo-500/20"
                            )}>
                                <ReactMarkdown 
                                    className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-800"
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4 max-w-3xl mx-auto">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-2">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-indigo-900/20 px-4 py-3 rounded-2xl rounded-tl-none border border-indigo-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-900 border-t border-gray-800">
                    <div className="max-w-3xl mx-auto relative group">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="w-full bg-gray-950 border border-gray-800 rounded-2xl pl-12 pr-14 py-4 min-h-[60px] max-h-32 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 outline-none resize-none custom-scrollbar shadow-inner"
                        />
                        <div className="absolute left-4 top-4 text-gray-500 group-hover:text-gray-400 transition-colors cursor-pointer">
                            <Paperclip className="w-5 h-5" />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!query.trim() || isTyping}
                            className={cn(
                                "absolute right-2 top-2 p-2 rounded-xl transition-all",
                                query.trim() ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20" : "bg-gray-800 text-gray-600 cursor-not-allowed"
                            )}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="max-w-3xl mx-auto text-center mt-2">
                        <p className="text-[10px] text-gray-600">AI can make mistakes. Verify important information.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RagChatView;
