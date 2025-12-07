import React, { useState, useEffect } from 'react';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { imageApi } from '../../api/image.api';
import { Image as ImageIcon, Wand2, RefreshCw, Download, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/ToastContext';

const ImageView: React.FC = () => {
    const [files, setFiles] = useState<OCRResult[]>([]);
    const [selectedFile, setSelectedFile] = useState<OCRResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const loadFiles = async () => {
            const res = await ocrApi.getList(1, 100);
            if (res.success) {
                setFiles(res.data.data.filter((f: OCRResult) => f.status.overall === 'SUCCESS'));
            }
        };
        loadFiles();
    }, []);

    const handleGenerate = async () => {
        if (!selectedFile) return;
        setLoading(true);
        try {
            const res = await imageApi.generate(selectedFile._id);
            if (res.success) {
                setGeneratedImage(res.data.imageUrl); // Ensure this is a full URL or relative path handled by proxy
                setGeneratedPrompt(res.data.prompt);
                showToast('Image Generated Successfully', 'success');
            }
        } catch (error) {
            showToast('Generation Failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Wand2 className="w-8 h-8 text-pink-500" /> 
                        Visual Reconstruction
                    </h1>
                    <p className="text-gray-400 text-sm max-w-2xl">
                        Turn raw OCR data and structural analysis back into a pristine, high-resolution document image using Generative AI.
                    </p>
                </div>
                
                <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                    <select 
                        value={selectedFile?._id || ''}
                        onChange={(e) => {
                            const f = files.find(x => x._id === e.target.value);
                            setSelectedFile(f || null);
                            setGeneratedImage(null);
                        }}
                        className="bg-transparent text-sm text-gray-300 py-2 pl-3 pr-8 outline-none cursor-pointer font-medium"
                    >
                        <option value="">Select Document Source...</option>
                        {files.map(f => (
                            <option key={f._id} value={f._id}>{f.originalName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            {selectedFile ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                    {/* Source Preview */}
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex justify-between">
                            Source Input (Text Data)
                            <span className="text-gray-600">ID: {selectedFile._id.slice(-6)}</span>
                        </h3>
                        <div className="flex-1 bg-gray-950 rounded-2xl p-6 overflow-y-auto border border-gray-800/50">
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                                {selectedFile.analysis ? selectedFile.analysis.substring(0, 2000) + '...' : 'No analysis text available.'}
                            </pre>
                        </div>
                    </div>

                    {/* Result Preview */}
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col relative overflow-hidden">
                        <h3 className="text-xs font-bold text-pink-500 uppercase mb-4 flex justify-between items-center">
                            AI Generated Reconstruction
                            {generatedImage && (
                                <button className="text-[10px] bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-white transition-colors flex items-center gap-1">
                                    <Download className="w-3 h-3" /> Save PNG
                                </button>
                            )}
                        </h3>

                        <div className="flex-1 flex items-center justify-center relative">
                            {loading ? (
                                <div className="text-center space-y-4">
                                    <div className="relative w-20 h-20 mx-auto">
                                        <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-gray-400 text-sm font-medium animate-pulse">Designing document layout...</p>
                                </div>
                            ) : generatedImage ? (
                                <img 
                                    src={generatedImage} 
                                    alt="Generated" 
                                    className="max-h-full max-w-full rounded-lg shadow-2xl border border-gray-700 object-contain hover:scale-[1.02] transition-transform duration-500"
                                />
                            ) : (
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700 border-dashed">
                                        <ImageIcon className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <button 
                                        onClick={handleGenerate}
                                        className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-pink-900/20 transition-all active:scale-95"
                                    >
                                        Generate Image
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Prompt Peek */}
                        {generatedPrompt && (
                             <div className="mt-4 pt-4 border-t border-gray-800">
                                 <p className="text-[10px] text-gray-600 line-clamp-2 hover:line-clamp-none cursor-help transition-all">
                                     <span className="font-bold text-gray-500">PROMPT USED:</span> {generatedPrompt}
                                 </p>
                             </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl">
                    <Wand2 className="w-16 h-16 text-gray-700 mb-4" />
                    <p className="text-gray-500 font-medium">Select a document above to begin visualization</p>
                </div>
            )}
        </div>
    );
};

export default ImageView;
