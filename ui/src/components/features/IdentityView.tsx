import React, { useState, useEffect } from 'react';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { identityApi, IdentityResult } from '../../api/identity.api';
import { ShieldCheck, Fingerprint, ScanFace, FileCheck, Loader2, History, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/ToastContext';
import Modal from '../ui/Modal';

const IdentityView: React.FC = () => {
    const [files, setFiles] = useState<OCRResult[]>([]);
    const [history, setHistory] = useState<IdentityResult[]>([]);
    const [docA, setDocA] = useState<string>('');
    const [docB, setDocB] = useState<string>('');
    
    const [loading, setLoading] = useState(false);
    const [currentResult, setCurrentResult] = useState<IdentityResult | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [filesRes, historyRes] = await Promise.all([
                    ocrApi.getList(1, 100),
                    identityApi.getHistory()
                ]);
                
                if (filesRes.success) {
                    setFiles(filesRes.data.data.filter((f: OCRResult) => f.status.overall === 'SUCCESS'));
                }
                if (historyRes.success) {
                    setHistory(historyRes.data);
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadData();
    }, []);

    const handleVerify = async () => {
        if (!docA || !docB) {
            showToast('Select two documents to verify', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await identityApi.verify(docA, docB);
            if (res.success) {
                setCurrentResult(res.data);
                showToast('Verification Complete', 'success');
                // Refresh history
                const h = await identityApi.getHistory();
                if (h.success) setHistory(h.data);
            }
        } catch (error) {
            showToast('Verification Failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
            REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
            MANUAL_REVIEW: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            FAILED: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }; // Fallback to gray if status not found
        const safeStatus = (status || 'FAILED') as keyof typeof styles;
        const colorClass = styles[safeStatus] || styles.FAILED;

        return (
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 uppercase tracking-wide", colorClass)}>
                {status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                {status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                {status === 'MANUAL_REVIEW' && <AlertTriangle className="w-3 h-3" />}
                {status?.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                                <Fingerprint className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Identity Verification</h1>
                                <p className="text-gray-400 mt-1">AI-powered Fraud Detection & KYC Analysis</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all text-sm font-medium border border-gray-700"
                        >
                            <History className="w-4 h-4" /> History
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-end">
                         {/* Doc A */}
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider ml-1">Identity Document (ID/Passport)</label>
                            <div className="relative group">
                                <select 
                                    value={docA}
                                    onChange={(e) => setDocA(e.target.value)}
                                    className="w-full appearance-none bg-gray-950 border border-gray-800 rounded-2xl pl-5 pr-10 py-4 text-sm text-gray-200 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/30 outline-none transition-all cursor-pointer hover:border-gray-700 font-medium"
                                >
                                    <option value="" className="text-gray-500">Select Identity Proof...</option>
                                    {files.map(f => (
                                        <option key={f._id} value={f._id}>{f.originalName}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-600">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                         {/* Swap / Arrow */}
                        <div className="md:col-span-1 flex justify-center pb-4">
                            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                                <ScanFace className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                         {/* Doc B */}
                        <div className="md:col-span-3 space-y-3">
                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider ml-1">Supporting Document (Selfie/Utility)</label>
                            <div className="relative group">
                                <select 
                                    value={docB}
                                    onChange={(e) => setDocB(e.target.value)}
                                    className="w-full appearance-none bg-gray-950 border border-gray-800 rounded-2xl pl-5 pr-10 py-4 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 outline-none transition-all cursor-pointer hover:border-gray-700 font-medium"
                                >
                                    <option value="" className="text-gray-500">Select Supporting Doc...</option>
                                    {files.map(f => (
                                        <option key={f._id} value={f._id}>{f.originalName}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-600">
                                    <FileCheck className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleVerify}
                            disabled={loading || !docA || !docB}
                            className={cn(
                                "relative overflow-hidden group px-10 py-4 rounded-2xl font-bold tracking-wide transition-all shadow-xl",
                                loading || !docA || !docB
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/25 scale-100 hover:scale-[1.02]"
                            )}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {loading ? 'Running Fraud Checks...' : 'Verify Identity'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Area */}
            {currentResult && (
                <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-6">
                    {/* Top Row: Overall Verdict & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Overall Score/Status Card */}
                        <div className="md:col-span-1 bg-gray-900 border border-gray-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-lg">
                            <div className={cn("absolute inset-0 opacity-10 blur-3xl",
                                currentResult.overallStatus === 'APPROVED' ? "bg-green-500" :
                                currentResult.overallStatus === 'REJECTED' ? "bg-red-500" : "bg-orange-500"
                            )} />
                            <div className="relative z-10">
                                <div className={cn("w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ring-4 ring-opacity-20",
                                    currentResult.overallStatus === 'APPROVED' ? "bg-green-500/20 text-green-400 ring-green-500" :
                                    currentResult.overallStatus === 'REJECTED' ? "bg-red-500/20 text-red-400 ring-red-500" : "bg-orange-500/20 text-orange-400 ring-orange-500"
                                )}>
                                    {currentResult.overallStatus === 'APPROVED' ? <CheckCircle className="w-10 h-10" /> : 
                                     currentResult.overallStatus === 'REJECTED' ? <XCircle className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">{currentResult.overallStatus.replace(/_/g, ' ')}</h2>
                                <div className="flex gap-2 justify-center">
                                    <span className={cn("px-3 py-1 rounded-lg text-xs font-bold border", 
                                        currentResult.fraudRisk === 'LOW' ? "bg-green-900/30 text-green-400 border-green-800" : 
                                        currentResult.fraudRisk === 'HIGH' ? "bg-red-900/30 text-red-400 border-red-800" : "bg-orange-900/30 text-orange-400 border-orange-800"
                                    )}>
                                        RISK: {currentResult.fraudRisk}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">
                                        Match: {currentResult.verificationResult['1_document_summary']?.overall_match_score ?? 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Executive Summary */}
                        <div className="md:col-span-2 bg-gray-900/50 border border-gray-800 rounded-3xl p-6 relative">
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> AI Analysis Summary
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                {currentResult.verificationResult['8_human_summary']?.summary || "No summary generated."}
                            </p>
                             <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                                <span className="text-xs text-gray-500 font-bold uppercase">Reasoning:</span>
                                <span className="text-xs text-gray-300 italic">{currentResult.verificationResult['8_human_summary']?.reasoning}</span>
                            </div>
                        </div>
                    </div>

                    {/* Field Comparison Table */}
                    {currentResult.verificationResult['2_field_comparison'] && (
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-lg">
                            <div className="p-5 border-b border-gray-800 bg-gray-800/20">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <FileCheck className="w-5 h-5 text-indigo-400" /> Field-Level Matching
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-950/50 text-xs text-gray-500 uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Field</th>
                                            <th className="px-6 py-4">Document A Value</th>
                                            <th className="px-6 py-4">Document B Value</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800 text-gray-300">
                                        {Object.entries(currentResult.verificationResult['2_field_comparison']).map(([field, data]: [string, any]) => (
                                            <tr key={field} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-400 capitalize">{field.replace(/_/g, ' ')}</td>
                                                <td className="px-6 py-4 font-mono text-xs">{data.value_docA || <span className="text-gray-600">-</span>}</td>
                                                <td className="px-6 py-4 font-mono text-xs">{data.value_docB || <span className="text-gray-600">-</span>}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase border",
                                                        data.status === 'exact_match' || data.status === 'match' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                        data.status === 'mismatch' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                        "bg-gray-700/30 text-gray-400 border-gray-600/30"
                                                    )}>
                                                        {data.status?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Bottom Grid: Face, Fraud, Format */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Face Verification */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center justify-between">
                                Face Verification
                                <ScanFace className="w-5 h-5 text-cyan-400" />
                            </h3>
                            {(() => {
                                const face = currentResult.verificationResult['4_face_verification'];
                                return face ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-500 text-xs">Status</span>
                                            <span className={cn("text-sm font-bold capitalize", face.status === 'matched' ? "text-green-400" : "text-red-400")}>{face.status}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-500 text-xs">Confidence</span>
                                            <span className="text-sm font-mono text-white">{face.confidence_score}%</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-500 text-xs">Age Check</span>
                                            <span className="text-sm text-gray-300 capitalize">{face.age_consistency_check?.replace(/_/g, ' ')}</span>
                                        </div>
                                    </div>
                                ) : <p className="text-gray-500 text-xs">No face data analyzed.</p>;
                            })()}
                        </div>

                        {/* Fraud Signals */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center justify-between">
                                Fraud Signals
                                <ShieldCheck className="w-5 h-5 text-orange-400" />
                            </h3>
                            {(() => {
                                const signals = currentResult.verificationResult['6_fraud_detection']?.fraud_signals || [];
                                return signals.length > 0 && signals[0].type !== 'none' ? (
                                    <div className="space-y-2">
                                        {signals.map((sig: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-red-900/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                                                <div>
                                                    <div className="text-xs font-bold text-red-400 capitalize">{sig.type.replace(/_/g, ' ')}</div>
                                                    <div className="text-[10px] text-red-300/70">Severity: {sig.severity}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-32 opacity-50">
                                        <ShieldCheck className="w-10 h-10 text-green-500/50 mb-2" />
                                        <p className="text-green-500/50 text-xs font-medium">No Fraud Signals Detected</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Cross Consistency */}
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                             <h3 className="text-sm font-bold text-gray-200 uppercase mb-4 flex items-center justify-between">
                                Consistency
                                <History className="w-5 h-5 text-purple-400" />
                            </h3>
                             {(() => {
                                 const consistency = currentResult.verificationResult['7_cross_consistency'] || {};
                                 return (
                                     <div className="space-y-3">
                                         {Object.entries(consistency).map(([k, v]: [string, any]) => (
                                             <div key={k} className="flex justify-between items-center text-xs">
                                                 <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                                 <div className="flex items-center gap-1.5">
                                                     <div className={cn("w-1.5 h-1.5 rounded-full", v === 'consistent' ? "bg-green-500" : "bg-red-500")} />
                                                     <span className={cn("font-medium", v === 'consistent' ? "text-gray-300" : "text-gray-100")}>{v}</span>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 )
                             })()}
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Verification History">
                <div className="space-y-2">
                    {history.map(item => (
                        <div 
                            key={item._id} 
                            onClick={() => { setCurrentResult(item); setIsHistoryOpen(false); window.scrollTo({top:0, behavior:'smooth'}); }}
                            className="p-4 bg-gray-900/50 hover:bg-gray-800 rounded-xl cursor-pointer border border-gray-800 transition-colors flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                <StatusBadge status={item.overallStatus} />
                                <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="text-xs font-bold text-gray-400">{item.fraudRisk} RISK</div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-gray-500 py-8">No history available</p>}
                </div>
            </Modal>
        </div>
    );
};

export default IdentityView;
