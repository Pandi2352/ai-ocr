import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';

const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                     <Outlet />
                </div>
            </main>

            {/* Right Sidebar */}
            <RightSidebar />
        </div>
    );
};

export default MainLayout;
