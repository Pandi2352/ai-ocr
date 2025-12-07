import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Cpu, FileJson, LayoutDashboard, GitCompare, LayoutTemplate } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
    { name: 'OCR & Analysis', path: '/ocr', icon: FileText },
    { name: 'Entity Extraction', path: '/entities', icon: Cpu },
    { name: 'Summarization', path: '/summary', icon: FileJson },
    { name: 'Comparison', path: '/compare', icon: GitCompare },
    { name: 'Smart Forms', path: '/forms', icon: LayoutTemplate },
];

const Sidebar: React.FC = () => {
    return (
        <aside className="w-20 md:w-64 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
            <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-800">
                <LayoutDashboard className="w-8 h-8 text-blue-500" />
                <span className="hidden md:block ml-3 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    AI OCR Kit
                </span>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                    : "text-gray-400 hover:bg-gray-900 hover:text-gray-100"
                            )
                        }
                    >
                        <item.icon className="w-6 h-6 flex-shrink-0" />
                        <span className="hidden md:block ml-3 font-medium">{item.name}</span>
                        
                        {/* Active Indicator */}
                         <div className={cn(
                            "absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full transition-all duration-300 opacity-0",
                            // This would need state or isActive check to show, simplified for now relying on NavLink class
                        )} />
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="hidden md:inline">System Online</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
