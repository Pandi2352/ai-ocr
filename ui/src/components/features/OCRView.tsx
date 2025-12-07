import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { FileText, Clock, File, RefreshCw, CheckCircle, AlertTriangle, Loader2, Calendar, HardDrive, Brain, Eye, FileSearch, Layers, Database, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useInterval } from '../../lib/hooks';
import { cn } from '../../lib/utils';
import MermaidDiagram from '../ui/MermaidDiagram';
import Modal from '../ui/Modal';

const OCRView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<OCRResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);
    
    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const res = await ocrApi.getById(id);
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error(error);
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }, [id, fetchData]);

    // Poll if status is PENDING
    const shouldPoll = data && data.status.overall === 'PENDING';
    useInterval(() => {
        fetchData();
    }, shouldPoll ? 3000 : null); // Poll every 3s

    if (!id) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-gray-500 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-gray-700">
                    <FileText className="w-10 h-10 text-blue-500/50" />
                </div>
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a Document</h2>
                <p className="text-gray-500 max-w-sm text-center">
                    Choose a file from the list to view OCR details and analysis.
                </p>
            </div>
        );
    }

    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Loading...</p>
        </div>
    );
    
    if (!data) return <div className="p-10 text-red-400">Not Found</div>;

    const StatusBadge = ({ status, label, icon: Icon }: { status: string, label: string, icon: any }) => (
        <div className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
            status === 'SUCCESS' ? "bg-green-500/5 border-green-500/20 text-green-400" :
            status === 'FAILED' ? "bg-red-500/5 border-red-500/20 text-red-400" :
            status === 'SKIPPED' ? "bg-gray-700/20 border-gray-700/30 text-gray-500" :
            "bg-blue-500/5 border-blue-500/20 text-blue-400"
        )}>
            <div className="mb-1">
                {status === 'PENDING' && <RefreshCw className="w-4 h-4 animate-spin" />}
                {status === 'SUCCESS' && <CheckCircle className="w-4 h-4" />}
                {status === 'FAILED' && <AlertTriangle className="w-4 h-4" />}
                {status === 'SKIPPED' && <div className="w-4 h-4 rounded-full border-2 border-current opacity-50" />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
            <span className="text-[10px] opacity-60">{Icon && <Icon className="w-3 h-3 inline mr-1" />}</span>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <FileText className="w-32 h-32" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                             <div className="flex items-center gap-2 text-xs font-mono text-blue-400/80 mb-2">
                                <span className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{data._id}</span>
                                <span className="text-gray-500">•</span>
                                <span>{new Date(data.createdAt).toLocaleString()}</span>
                             </div>
                             <h1 className="text-3xl font-bold text-white mb-2">{data.metadata?.title || data.originalName}</h1>
                             <p className="text-gray-400 text-sm mb-6 max-w-2xl leading-relaxed">{data.metadata?.description || "No description available."}</p>
                             
                             <div className="flex flex-wrap gap-3">
                                <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium flex items-center gap-2">
                                    <File className="w-3.5 h-3.5 text-blue-400" /> {data.mimetype}
                                </div>
                                <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium flex items-center gap-2">
                                    <HardDrive className="w-3.5 h-3.5 text-purple-400" /> {(data.size / 1024).toFixed(1)} KB
                                </div>
                                <div className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-orange-400" /> 
                                    {(() => {
                                        const d = data.timing?.duration;
                                        if (!d) return 'Processing...';
                                        if (d < 1000) return `${d}ms`;
                                        const s = d / 1000;
                                        if (s < 60) return `${s.toFixed(2)}s`;
                                        const m = Math.floor(s / 60);
                                        const rs = (s % 60).toFixed(0);
                                        return `${m}m ${rs}s`;
                                    })()}
                                </div>
                             </div>
                        </div>

                        <div className="flex gap-2">
                            <StatusBadge status={data.status.upload} label="Upload" icon={File} />
                            <StatusBadge status={data.status.visualProcessing} label="Visual" icon={Eye} />
                            <StatusBadge status={data.status.enrichment} label="Enrich" icon={Brain} />
                            <StatusBadge status={data.status.rag} label="RAG" icon={FileSearch} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Analysis & Mindmap */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Mindmap */}
                    {data.mindmap && (
                        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-400" />
                                    Knowledge Graph
                                </h2>
                                <button 
                                    onClick={() => setIsMermaidModalOpen(true)}
                                    className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                                    title="Maximize View"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="overflow-hidden">
                                <MermaidDiagram chart={data.mindmap} />
                            </div>
                        </div>
                    )}

                    {/* Summary Content */}
                    {data.summary && (
                        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-400" />
                                    Executive Summary
                                </h2>
                            </div>
                            <div className="p-6 prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{data.summary}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Entity Results (Preview) */}
                    {data.entityResult && Object.keys(data.entityResult).length > 0 && (
                        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                             <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <Database className="w-4 h-4 text-indigo-400" />
                                    Extracted Entities
                                </h2>
                            </div>
                            <div className="p-0">
                                <pre className="p-4 text-[10px] leading-relaxed text-indigo-300 font-mono overflow-auto max-h-[300px]">
                                    {JSON.stringify(data.entityResult, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Metadata & Details */}
                <div className="space-y-6">
                    {/* File Details */}
                    <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden p-4">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">File Information</h2>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center group">
                                <span className="text-gray-500">Original Name</span>
                                <span className="text-gray-300 font-mono text-[10px] truncate max-w-[150px]" title={data.originalName}>
                                    {data.originalName}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Storage Filename</span>
                                <span className="text-gray-300 font-mono text-[10px] truncate max-w-[150px]" title={data.filename}>
                                    {data.filename}
                                </span>
                            </div>
                            <div className="h-px bg-gray-700/50 my-1" />
                             <div className="flex justify-between items-center">
                                <span className="text-gray-500">File Type</span>
                                <span className="text-blue-300 font-medium">{data.mimetype}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">File Size</span>
                                <span className="text-purple-300 font-medium">{(data.size / 1024).toFixed(2)} KB</span>
                            </div>
                        </div>
                    </div>

                    {/* Thumbnail/Preview */}
                    {data.metadata?.thumbnail && (
                         <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden p-4">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thumbnail Analysis</h2>
                            <p className="text-sm text-gray-300 italic mb-4">"{data.metadata.thumbnail}"</p>
                        </div>
                    )}

                    {/* JSON Metadata */}
                    <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                        <div className="p-4 border-b border-gray-700/50">
                            <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-orange-400" />
                                Metadata Object
                            </h2>
                        </div>
                        <div className="p-0">
                            <pre className="p-4 text-[10px] leading-relaxed text-green-400 font-mono overflow-auto max-h-[400px]">
                                {JSON.stringify(data, (key, value) => {
                                    if (key === 'analysis' || key === 'mindmap') return '[Long String...]'
                                    return value;
                                }, 2)}
                            </pre>
                        </div>
                    </div>
                    
                    {/* Timing Breakdown (If available in future) */}
                    <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden p-4">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Process Timing</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Start Time</span>
                                <span className="text-gray-300 font-mono">{new Date(data.timing.startTime).toLocaleTimeString()}</span>
                            </div>
                            {data.timing.endTime && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">End Time</span>
                                    <span className="text-gray-300 font-mono">{new Date(data.timing.endTime).toLocaleTimeString()}</span>
                                </div>
                            )}
                            <div className="h-px bg-gray-700/50 my-2" />
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-blue-400">Total Duration</span>
                                <span className="text-blue-400 font-mono">
                                    {(() => {
                                        const d = data.timing?.duration || 0;
                                        if (d < 1000) return `${d}ms`;
                                        const s = d / 1000;
                                        if (s < 60) return `${s.toFixed(2)}s`;
                                        const m = Math.floor(s / 60);
                                        const rs = (s % 60).toFixed(0);
                                        return `${m}m ${rs}s`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Content (Full Width at Bottom) */}
            <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-400" />
                        Full Content Analysis
                    </h2>
                </div>
                <div className="p-8 prose prose-invert prose-lg max-w-none">
                    {data.analysis ? (
                            <ReactMarkdown>{data.analysis}</ReactMarkdown>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-50" />
                            <span className="text-sm">Analyzing content...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mermaid Modal */}
            <Modal
                isOpen={isMermaidModalOpen}
                onClose={() => setIsMermaidModalOpen(false)}
                title="Knowledge Graph (Expanded View)"
                maxWidth="max-w-[90vw]"
            >
                <div className="min-h-[60vh] flex items-center justify-center bg-gray-950/50 rounded-lg">
                    <MermaidDiagram chart={data.mindmap || ''} />
                </div>
            </Modal>
        </div>
    );
};

export default OCRView;
