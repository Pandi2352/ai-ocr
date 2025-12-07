import React, { useState, useEffect } from 'react';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { formApi, FormResultModel } from '../../api/form.api';
import { FileText, Wand2, ArrowRight, Loader2, Save, PenSquare, LayoutTemplate, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/ToastContext';
import ReactMarkdown from 'react-markdown';

const FormView: React.FC = () => {
    const [files, setFiles] = useState<OCRResult[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [jsonSchema, setJsonSchema] = useState<string>('{\n  "first_name": "String",\n  "last_name": "String",\n  "date_of_birth": "DD-MM-YYYY",\n  "passport_number": "String"\n}');
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<FormResultModel | null>(null);
    const [editedFormData, setEditedFormData] = useState<Record<string, any>>({});
    const { showToast } = useToast();

    // Load available files
    useEffect(() => {
        const loadFiles = async () => {
             const res = await ocrApi.getList(1, 100);
             if (res.success) {
                 setFiles(res.data.data.filter((f: OCRResult) => f.status.overall === 'SUCCESS'));
             }
        };
        loadFiles();
    }, []);

    const handleFillForm = async () => {
        if (!selectedId) {
            showToast('Please select a source document', 'error');
            return;
        }

        let parsedSchema;
        try {
            parsedSchema = JSON.parse(jsonSchema);
        } catch (e) {
            showToast('Invalid JSON Schema', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await formApi.fill(selectedId, parsedSchema, 'auto-fill');
            if (res.success) {
                setResult(res.data);
                setEditedFormData(res.data.formData);
                showToast('Form auto-filled successfully', 'success');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to fill form', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (key: string, value: any) => {
        setEditedFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleArrayFieldChange = (parentKey: string, index: number, fieldKey: string, value: any) => {
        setEditedFormData(prev => {
            const newArray = [...(prev[parentKey] as any[])];
            newArray[index] = {
                ...newArray[index],
                [fieldKey]: value
            };
            return {
                ...prev,
                [parentKey]: newArray
            };
        });
    };

    const getSelectedFile = () => files.find(f => f._id === selectedId);

    return (
        <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col md:flex-row gap-6 pb-4 animate-in fade-in duration-500">
            {/* Left Panel: Configuration */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 h-full overflow-y-auto pr-2">
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                            <LayoutTemplate className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Smart Form Fill</h1>
                            <p className="text-gray-400 text-xs">Transform doc to form</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* File Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Source Document</label>
                            <div className="relative group">
                                <select 
                                    value={selectedId}
                                    onChange={(e) => setSelectedId(e.target.value)}
                                    className="w-full appearance-none bg-gray-900 border border-gray-700/50 rounded-xl pl-4 pr-10 py-3 text-sm text-gray-200 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all cursor-pointer hover:border-gray-600"
                                >
                                    <option value="" className="text-gray-500">Select Document...</option>
                                    {files.map(f => (
                                        <option key={f._id} value={f._id}>{f.originalName}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                                    <ArrowRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Schema Editor */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                                Target Form Schema (JSON)
                                <span className="text-[10px] text-purple-400/80 cursor-pointer hover:underline" onClick={() => setJsonSchema('{\n  "full_name": "String",\n  "invoice_no": "String",\n  "total_amount": "Number",\n  "items": [\n    { "desc": "String", "qty": "Number" }\n  ]\n}')}>Load Example</span>
                            </label>
                            <textarea
                                value={jsonSchema}
                                onChange={(e) => setJsonSchema(e.target.value)}
                                className="w-full h-64 bg-gray-950 font-mono text-xs text-green-400 p-4 rounded-xl border border-gray-800 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none leading-relaxed"
                                spellCheck={false}
                            />
                        </div>

                        <button
                            onClick={handleFillForm}
                            disabled={loading || !selectedId}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-lg",
                                loading || !selectedId
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20"
                            )}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            {loading ? 'AI is Working...' : 'Auto-Fill Form'}
                        </button>
                    </div>
                </div>

                {/* Source Preview (Mini) */}
                {getSelectedFile()?.analysis && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4 overflow-hidden flex-1 min-h-[200px]">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Source Content Preview
                        </h3>
                        <div className="prose prose-invert prose-xs max-w-none opacity-60">
                            <ReactMarkdown className="line-clamp-[10]">{getSelectedFile()?.analysis || ''}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: The Form */}
            <div className="w-full md:w-2/3 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
                
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl flex justify-between items-center z-10">
                   <div>
                       <h2 className="text-lg font-bold text-white flex items-center gap-2">
                           <PenSquare className="w-5 h-5 text-indigo-400" />
                           Generated Form
                       </h2>
                       <p className="text-xs text-gray-500">Verify and edit the AI-extracted values below</p>
                   </div>
                   {result && (
                       <button className="px-4 py-2 bg-green-600/10 text-green-400 border border-green-600/20 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-600/20 transition-colors">
                           <Save className="w-4 h-4" /> Save Data
                       </button>
                   )}
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-950/50 relative">
                    {!result ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                            <div className="w-24 h-24 bg-gray-900 rounded-2xl border-2 border-dashed border-gray-800 flex items-center justify-center">
                                <LayoutTemplate className="w-10 h-10" />
                            </div>
                            <p>Configure settings on the left to generate the form.</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {result.meta.missingFields.length > 0 && (
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3 mb-6">
                                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-orange-400">Missing Information</h4>
                                        <p className="text-xs text-orange-300/80 mt-1">
                                            The AI could not confidently find values for: <span className="font-mono text-white">{result.meta.missingFields.join(', ')}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(editedFormData).map(([key, value]) => {
                                    const isLongText = typeof value === 'string' && value.length > 50;
                                    const isArray = Array.isArray(value);
                                    
                                    if (isArray) {
                                        return (
                                            <div key={key} className="col-span-2 space-y-4 p-5 bg-gray-900/80 rounded-xl border border-gray-800/80">
                                                 <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                                                     <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                                         <LayoutTemplate className="w-4 h-4" />
                                                         {key.replace(/_/g, ' ')} ({value.length} items)
                                                     </label>
                                                 </div>
                                                 
                                                 <div className="grid grid-cols-1 gap-4">
                                                     {value.map((item: any, idx: number) => (
                                                         <div key={idx} className="bg-gray-950 p-4 rounded-lg border border-gray-800 relative group">
                                                             <div className="absolute top-2 right-2 text-[10px] text-gray-600 font-mono">#{idx + 1}</div>
                                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                 {Object.entries(item).map(([subKey, subValue]) => (
                                                                     <div key={`${key}-${idx}-${subKey}`} className="space-y-1">
                                                                         <label className="text-[10px] text-gray-500 uppercase font-semibold">{subKey.replace(/_/g, ' ')}</label>
                                                                         <input
                                                                             type="text"
                                                                             value={subValue as string}
                                                                             onChange={(e) => handleArrayFieldChange(key, idx, subKey, e.target.value)}
                                                                             className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                                                         />
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         </div>
                                                     ))}
                                                 </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div key={key} className={cn("space-y-2", isLongText ? "col-span-2" : "col-span-1")}>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                {key.replace(/_/g, ' ')}
                                                {result.meta.missingFields.includes(key) && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                            </label>
                                            {isLongText ? (
                                                <textarea
                                                    value={value}
                                                    onChange={(e) => handleFieldChange(key, e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-y min-h-[100px]"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => handleFieldChange(key, e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FormView;
