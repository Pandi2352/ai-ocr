import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { summaryApi } from '../../api/summary.api';
import { Sparkles, Loader2, ArrowRight, Calendar, Clock, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../ui/ToastContext';
import Modal from '../ui/Modal';
import { cn } from '../../lib/utils';

const SummaryView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useToast();
    
    // Generation State
    const [selectedFile, setSelectedFile] = useState<OCRResult | null>(null);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    
    // History State
    const [history, setHistory] = useState<any[]>([]);
    
    // View Modal State
    const [viewModal, setViewModal] = useState<any | null>(null);

    // Fetch single file for generation & history
    useEffect(() => {
        if (id) {
            setLoading(true);
            Promise.all([
                ocrApi.getById(id),
                summaryApi.getHistory(id)
            ]).then(([resFile, resHistory]) => {
                if (resFile.success) setSelectedFile(resFile.data);
                if (resHistory.success) setHistory(resHistory.data);
            }).finally(() => setLoading(false));
        } else {
            setSelectedFile(null);
            setHistory([]);
        }
    }, [id]);

    const handleGenerate = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await summaryApi.generate(id, prompt);
            if (res.success) {
                showToast('Summary generated successfully', 'success');
                // Refresh history
                const historyRes = await summaryApi.getHistory(id);
                if (historyRes.success) setHistory(historyRes.data);

                // Let's reload current file data to show it if we are on the view
                const fileRes = await ocrApi.getById(id);
                if (fileRes.success) setSelectedFile(fileRes.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!id) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-gray-500 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-gray-700">
                    <Sparkles className="w-10 h-10 text-pink-500/50" />
                </div>
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a Document</h2>
                <p className="text-gray-500 max-w-sm text-center">
                    Choose a file from the right sidebar to start generating AI summaries.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* 1. Generator Section */}
            {selectedFile && (
                 <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Generate Summary</h1>
                            <p className="text-gray-400 text-sm">Create concise summaries for <span className="text-white font-medium">{selectedFile.originalName}</span></p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Custom Prompt <span className="text-gray-600">(Optional)</span>
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="E.g., Summarize the key points in 3 bullet points..."
                                className="w-full h-24 bg-gray-900 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3">
                             {selectedFile.summary && (
                                <button
                                    onClick={() => setViewModal(selectedFile)}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                                >
                                    View Existing Summary
                                </button>
                            )}
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all shadow-lg shadow-pink-500/20",
                                    loading 
                                        ? "bg-pink-600/50 cursor-wait" 
                                        : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 active:scale-95"
                                )}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {loading ? 'Generating...' : 'Generate Summary'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Summary History */}
            {history.length > 0 && (
                <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                     <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Summary History
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.map((item, idx) => (
                             <div 
                                key={item._id || idx}
                                onClick={() => setViewModal({ originalName: `${selectedFile?.originalName} (History)`, summary: item.summary })}
                                className="group bg-gray-900/40 border border-gray-800 hover:border-pink-500/30 p-4 rounded-xl cursor-pointer transition-all"
                            >
                                <div className="flex justify-between items-start mb-2">
                                     <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.createdAt).toLocaleString()}
                                    </span>
                                     <ArrowRight className="w-4 h-4 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-xs text-gray-500 mb-2 italic">
                                    {item.customPrompt ? `Prompt: "${item.customPrompt}"` : "Auto-generated"}
                                </div>
                                 <div className="text-sm text-gray-300 line-clamp-3 font-serif">
                                    {item.summary.replace(/[#*]/g, '').slice(0, 100)}...
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View Modal */}
            <Modal
                isOpen={!!viewModal}
                onClose={() => setViewModal(null)}
                title={viewModal?.originalName || 'Summary'}
            >
                <div className="space-y-4">
                    <div className="prose prose-invert prose-pink max-w-none">
                        <ReactMarkdown>{viewModal?.summary || ''}</ReactMarkdown>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SummaryView;
