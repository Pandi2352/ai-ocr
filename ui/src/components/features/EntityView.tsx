import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { entityApi } from '../../api/entity.api';
import { FileText, Database, Loader2, Search, ArrowRight, Calendar, Plus, X, Clock } from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import Modal from '../ui/Modal';
import { cn } from '../../lib/utils';

const EntityView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { showToast } = useToast();

    // Extraction State
    const [selectedFile, setSelectedFile] = useState<OCRResult | null>(null);
    const [customField, setCustomField] = useState('');
    const [fields, setFields] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    
    // History State
    const [history, setHistory] = useState<any[]>([]);

    // List State
    // List State
    const [viewModal, setViewModal] = useState<any | null>(null); // Use any to support both OCRResult and EntityResult

    // New Mode State
    const [mode, setMode] = useState<'simple' | 'json'>('simple');
    const [jsonSchema, setJsonSchema] = useState('');

    // Fetch single file & history
    useEffect(() => {
        if (id) {
            setLoading(true);
            Promise.all([
                ocrApi.getById(id),
                entityApi.getHistory(id)
            ]).then(([resFile, resHistory]) => {
                if (resFile.success) setSelectedFile(resFile.data);
                if (resHistory.success) setHistory(resHistory.data);
            }).finally(() => setLoading(false));
        } else {
            setSelectedFile(null);
            setHistory([]);
        }
    }, [id]);

    const handleAddField = () => {
        if (customField.trim()) {
            setFields([...fields, customField.trim()]);
            setCustomField('');
        }
    };

    const handleRemoveField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleExtract = async () => {
        if (!id) return;
        setLoading(true);
        
        let payload: any = undefined;

        if (mode === 'simple') {
            payload = fields.length > 0 ? fields : undefined;
        } else {
            if (!jsonSchema.trim()) {
                 showToast('Please enter a valid JSON schema', 'error');
                 setLoading(false);
                 return;
            }
            try {
                payload = JSON.parse(jsonSchema);
            } catch (e) {
                showToast('Invalid JSON format', 'error');
                setLoading(false);
                return;
            }
        }

        try {
            const res = await entityApi.extract(id, payload);
            if (res.success) {
                showToast('Entities extracted successfully', 'success');
                // Refresh history
                const historyRes = await entityApi.getHistory(id);
                if (historyRes.success) setHistory(historyRes.data);
                
                // Update current view
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
                    <Database className="w-10 h-10 text-indigo-500/50" />
                </div>
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a Document</h2>
                <p className="text-gray-500 max-w-sm text-center">
                    Choose a file from the right sidebar to start extracting entities.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* 1. Extraction Section */}
            {id && selectedFile && (
                <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Entity Extraction</h1>
                            <p className="text-gray-400 text-sm">Extract structured data from <span className="text-white font-medium">{selectedFile.originalName}</span></p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-400">
                                    Fields to Extract <span className="text-gray-600">(Optional)</span>
                                </label>
                                <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-800">
                                    <button 
                                        onClick={() => setMode('simple')}
                                        className={cn("px-3 py-1 text-xs rounded-md transition-all", mode === 'simple' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200")}
                                    >
                                        Simple
                                    </button>
                                    <button 
                                        onClick={() => setMode('json')}
                                        className={cn("px-3 py-1 text-xs rounded-md transition-all", mode === 'json' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200")}
                                    >
                                        Advanced JSON
                                    </button>
                                </div>
                             </div>

                            {mode === 'simple' ? (
                                <>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={customField}
                                            onChange={(e) => setCustomField(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                                            placeholder="Add a field (e.g., Invoice Number)"
                                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-600"
                                        />
                                        <button
                                            onClick={handleAddField}
                                            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                                        {fields.length === 0 && <span className="text-xs text-dash text-gray-600 italic py-1">Auto-detect mode enabled</span>}
                                        {fields.map((field, idx) => (
                                            <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded border border-indigo-500/20">
                                                {field}
                                                <button onClick={() => handleRemoveField(idx)} className="hover:text-white"><X className="w-3 h-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <textarea
                                        value={jsonSchema}
                                        onChange={(e) => setJsonSchema(e.target.value)}
                                        placeholder={`{\n  "name": "",\n  "address": {\n    "street": "",\n    "city": ""\n  }\n}`}
                                        className="w-full h-40 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-300 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-gray-700"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <span>Define your desired output structure as a JSON object.</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4">
                             {selectedFile && selectedFile.entityResult && Object.keys(selectedFile.entityResult).length > 0 && (
                                <button
                                    onClick={() => setViewModal(selectedFile)}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                                >
                                    View Extracted Data
                                </button>
                            )}
                            <button
                                onClick={handleExtract}
                                disabled={loading}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all shadow-lg shadow-indigo-500/20",
                                    loading 
                                        ? "bg-indigo-600/50 cursor-wait" 
                                        : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95"
                                )}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                {loading ? 'Extracting...' : 'Extract Entities'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Extraction History (Visible if ID is present) */}
            {id && history.length > 0 && (
                <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                     <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Extraction History
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.map((item, idx) => (
                             <div 
                                key={item._id || idx}
                                onClick={() => setViewModal({ originalName: `${selectedFile?.originalName} (History)`, entityResult: item.entities })}
                                className="group bg-gray-900/40 border border-gray-800 hover:border-indigo-500/30 p-4 rounded-xl cursor-pointer transition-all"
                            >
                                <div className="flex justify-between items-start mb-2">
                                     <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.createdAt).toLocaleString()}
                                    </span>
                                     <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {(item.fields && item.fields.length > 0) ? (
                                        item.fields.slice(0, 3).map((f: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">{f}</span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded">Auto Extraction</span>
                                    )}
                                    {item.fields && item.fields.length > 3 && <span className="text-[10px] text-gray-500">+{item.fields.length - 3}</span>}
                                </div>
                                 <div className="text-xs text-gray-500">
                                    {Object.keys(item.entities || {}).length} entities found
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
                title={viewModal?.originalName || 'Extracted Entities'}
            >
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 overflow-auto max-h-[60vh]">
                    <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(viewModal?.entityResult || {}, null, 2)}
                    </pre>
                </div>
            </Modal>
        </div>
    );
};

export default EntityView;
