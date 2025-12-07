import React, { useEffect, useState } from 'react';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { compareApi, ComparisonResult } from '../../api/compare.api';
import Modal from '../ui/Modal';
import { GitCompare, FileText, ArrowRight, Loader2, CheckCircle, Clock, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/ToastContext';

const CompareView: React.FC = () => {
    const [files, setFiles] = useState<OCRResult[]>([]);
    const [history, setHistory] = useState<ComparisonResult[]>([]);
    
    // Selection State
    const [sourceId, setSourceId] = useState<string>('');
    const [targetId, setTargetId] = useState<string>('');
    
    // Process State
    const [loading, setLoading] = useState(false);
    const [currentResult, setCurrentResult] = useState<ComparisonResult | null>(null);
    const { showToast } = useToast();
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [filesRes, historyRes] = await Promise.all([
                    ocrApi.getList(1, 100), // Get enough files
                    compareApi.getHistory()
                ]);

                if (filesRes.success) {
                    // Only successfully processed files can be compared
                    const eligibleFiles = filesRes.data.data.filter((f: OCRResult) => f.status.overall === 'SUCCESS');
                    setFiles(eligibleFiles);
                }
                
                if (historyRes.success) {
                    setHistory(historyRes.data);
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
                showToast('Failed to load data', 'error');
            }
        };
        loadData();
    }, []);

    const handleCompare = async () => {
        if (!sourceId || !targetId) {
            showToast('Please select two documents to compare', 'error');
            return;
        }
        if (sourceId === targetId) {
            showToast('Please select different documents', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await compareApi.compare(sourceId, targetId);
            if (res.success) {
                setCurrentResult(res.data);
                showToast('Comparison completed successfully', 'success');
                setIsDetailModalOpen(true); // Auto-open modal on success
                // Refresh history
                const histRes = await compareApi.getHistory();
                if (histRes.success) setHistory(histRes.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Comparison failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadFromHistory = (item: ComparisonResult) => {
        setCurrentResult(item);
        setSourceId((item.sourceOcrId as any)._id || item.sourceOcrId);
        setTargetId((item.targetOcrId as any)._id || item.targetOcrId);
        setIsDetailModalOpen(true); // Open modal when viewing history
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header / Selection Area */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <GitCompare className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Compare Documents</h1>
                        <p className="text-gray-400 text-sm">Analyze differences between two document versions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                    {/* Source */}
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Source Document (Original)</label>
                        <div className="relative group">
                            <select 
                                value={sourceId}
                                onChange={(e) => setSourceId(e.target.value)}
                                className="w-full appearance-none bg-gray-900 border border-gray-700/50 rounded-xl pl-4 pr-10 py-3 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all cursor-pointer hover:border-gray-600"
                            >
                                <option value="" className="text-gray-500">Select Base File...</option>
                                {files.map(f => (
                                    <option key={f._id} value={f._id}>{f.originalName}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500 group-hover:text-indigo-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Icon */}
                    <div className="md:col-span-1 flex justify-center pb-3">
                        <div className="p-2 bg-gray-800/50 rounded-full border border-gray-700/50">
                            <ArrowRight className="w-5 h-5 text-indigo-500 hidden md:block" />
                        </div>
                    </div>

                    {/* Target */}
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Document (New)</label>
                        <div className="relative group">
                            <select 
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                className="w-full appearance-none bg-gray-900 border border-gray-700/50 rounded-xl pl-4 pr-10 py-3 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all cursor-pointer hover:border-gray-600"
                            >
                                <option value="" className="text-gray-500">Select Comparison File...</option>
                                {files.map(f => (
                                    <option key={f._id} value={f._id}>{f.originalName}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500 group-hover:text-indigo-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleCompare}
                        disabled={loading || !sourceId || !targetId}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
                            loading || !sourceId || !targetId
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        )}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                        {loading ? 'Analyzing Differences...' : 'Run Comparison'}
                    </button>
                </div>
            </div>

            {/* Results Area */}
            {currentResult && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                            <span className="text-xs text-gray-500 uppercase font-bold">Similarity Score</span>
                            <div className="mt-1 text-2xl font-bold text-white flex items-baseline gap-1">
                                {currentResult.comparisonResult.summary.similarity_score}%
                            </div>
                        </div>
                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                            <span className="text-xs text-gray-500 uppercase font-bold">Total Changes</span>
                            <div className="mt-1 text-2xl font-bold text-blue-400">
                                {currentResult.comparisonResult.summary.total_changes}
                            </div>
                        </div>
                         <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                            <span className="text-xs text-gray-500 uppercase font-bold">Additions</span>
                            <div className="mt-1 text-2xl font-bold text-green-400">
                                +{currentResult.comparisonResult.summary.added}
                            </div>
                        </div>
                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                            <span className="text-xs text-gray-500 uppercase font-bold">Deletions</span>
                            <div className="mt-1 text-2xl font-bold text-red-400">
                                -{currentResult.comparisonResult.summary.removed}
                            </div>
                        </div>
                    </div>

                    {/* View Details Action */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsDetailModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white transition-all shadow-lg"
                        >
                            <Eye className="w-4 h-4 text-blue-400" />
                            View Detailed Difference Report
                        </button>
                    </div>

                    {/* Detailed Table Modal */}
                    <Modal
                        isOpen={isDetailModalOpen}
                        onClose={() => setIsDetailModalOpen(false)}
                        title="Detailed Diff Report"
                        maxWidth="max-w-6xl"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-medium sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 bg-gray-900">Type</th>
                                        <th className="px-6 py-3 bg-gray-900">Category</th>
                                        <th className="px-6 py-3 w-[25%] bg-gray-900">Old Text (Source)</th>
                                        <th className="px-6 py-3 w-[25%] bg-gray-900">New Text (Target)</th>
                                        <th className="px-6 py-3 bg-gray-900">Severity</th>
                                        <th className="px-6 py-3 bg-gray-900 max-w-xs">Analysis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {currentResult.comparisonResult.changes.map((change, idx) => (
                                        <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 align-top">
                                                <span className={cn("px-2 py-1 rounded-md text-[10px] uppercase font-bold border block w-fit",
                                                    change.change_type === 'text_added' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                                    change.change_type === 'text_removed' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                    "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                                )}>
                                                    {change.change_type.replace('text_', '')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300 font-medium align-top">
                                                {change.category.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4 text-red-300/80 font-mono text-xs bg-red-950/10 align-top whitespace-pre-wrap">
                                                {change.old_text || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-green-300/80 font-mono text-xs bg-green-950/10 align-top whitespace-pre-wrap">
                                                {change.new_text || '-'}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                 <span className={cn("px-2 py-1 rounded-full text-[10px] uppercase font-bold",
                                                    change.severity === 'critical' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" :
                                                    change.severity === 'high' ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" :
                                                    change.severity === 'medium' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20" :
                                                    "bg-gray-700 text-gray-400"
                                                )}>
                                                    {change.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 italic align-top text-xs">
                                                "{change.semantic_change}"
                                            </td>
                                        </tr>
                                    ))}
                                    {currentResult.comparisonResult.changes.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                                                <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                                                <p>No differences found between these documents.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Modal>
                </div>
            )}
            
            {/* History Section */}
            {history.length > 0 && (
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden mt-10">
                    <div className="p-4 border-b border-gray-700/50">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                             <Clock className="w-4 h-4 text-gray-400" />
                             Comparison History
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-700/50">
                        {history.map((item) => (
                             <div 
                                key={item._id} 
                                onClick={() => loadFromHistory(item)}
                                className="p-4 hover:bg-gray-700/20 cursor-pointer transition-colors flex items-center justify-between group"
                             >
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{(item.sourceOcrId as any).originalName || 'Unknown'}</span>
                                        <ArrowRight className="w-3 h-3 text-gray-600" />
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">{(item.targetOcrId as any).originalName || 'Unknown'}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-red-400">-{item.comparisonResult.summary.removed}</span>
                                        <span className="text-green-400">+{item.comparisonResult.summary.added}</span>
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                                            {item.comparisonResult.summary.similarity_score}% Match
                                        </span>
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompareView;
