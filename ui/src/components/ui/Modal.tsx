import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className={cn(
                    "bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
                    maxWidth
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-800">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
