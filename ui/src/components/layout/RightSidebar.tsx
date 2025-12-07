import React, { useState, useEffect, useCallback } from 'react';
import { Upload, File as FileIcon, Search, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ocrApi, OCRResult } from '../../api/ocr.api';
import { useLocation, useNavigate } from 'react-router-dom';

const RightSidebar: React.FC = () => {
    const [files, setFiles] = useState<OCRResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    
    // Auto-refresh trigger
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch Files
    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ocrApi.getList(1, 100, search, order); // Fetching 100 for now, customize pagination later if needed
            if (res.success) {
                setFiles(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setLoading(false);
        }
    }, [search, order]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Handle File Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        setUploading(true);
        
        try {
            const res = await ocrApi.upload(file);
            if (res.success) {
                // Determine redirect path based on current route
                const currentPath = location.pathname.split('/')[1] || 'ocr'; // default to ocr
                // After upload, usually we want to see the result details. 
                // But specifically for 'ocr' view. If on entities/summary, we might need to select it.
                // For now, let's refresh list and navigate to the item in OCR view as it's the entry point.
                
                await fetchFiles();
                
                // Optional: Navigate to the new item details
                if (currentPath === 'ocr') {
                     navigate(`/ocr/${res.data.id}`);
                }
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <aside className="w-80 flex-shrink-0 bg-gray-950 border-l border-gray-800 flex flex-col">
            {/* Upload Area */}
            <div className="p-4 border-b border-gray-800">
                <label 
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                        uploading 
                            ? "border-blue-500/50 bg-blue-500/5 animate-pulse cursor-wait"
                            : "border-gray-700 hover:border-blue-500 hover:bg-gray-900/50"
                    )}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-blue-500" />
                        )}
                        <p className="mb-2 text-sm text-gray-400">
                            {uploading ? "Processing..." : <span className="font-semibold">Click to upload</span>}
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
                    </div>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
            </div>

            {/* List Header & Filters */}
            <div className="p-4 border-b border-gray-800 space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Files</h3>
                
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full bg-gray-900 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-9 p-2"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                        className="p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-lg"
                        title="Toggle Sort Order"
                    >
                        {order === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button 
                        onClick={fetchFiles}
                        className="p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-lg"
                        title="Refresh List"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
                {files.map((file) => (
                    <div 
                        key={file._id}
                        onClick={() => {
                            // Determine navigation based on current active route
                            const currentModule = location.pathname.split('/')[1] || 'ocr'; // ocr, entities, summary
                            navigate(`/${currentModule}/${file._id}`);
                        }}
                        className={cn(
                            "flex items-start gap-3 p-3 mb-2 rounded-lg cursor-pointer transition-all border border-transparent",
                            location.pathname.includes(file._id) 
                                ? "bg-blue-600/10 border-blue-600/30 ring-1 ring-blue-500/20"
                                : "hover:bg-gray-900 border-gray-800/50"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg font-bold",
                             file.mimetype.includes('image') ? "bg-purple-500/10 text-purple-400" : "bg-orange-500/10 text-orange-400"
                        )}>
                            {file.mimetype.includes('image') ? 'IMG' : <FileIcon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-200 truncate" title={file.originalName}>
                                {file.originalName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                                    file.status.overall === 'SUCCESS' ? "bg-green-500/10 text-green-400" :
                                    file.status.overall === 'FAILED' ? "bg-red-500/10 text-red-400" :
                                    "bg-yellow-500/10 text-yellow-400"
                                )}>
                                    {file.status.overall}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    {new Date(file.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {files.length === 0 && !loading && (
                    <div className="text-center py-10 text-gray-500 text-sm">
                        No files found. Upload one to get started!
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RightSidebar;
