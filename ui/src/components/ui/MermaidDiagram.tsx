import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
    chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState('');

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Outfit, sans-serif',
        });
    }, []);

    useEffect(() => {
        const renderChart = async () => {
            if (chart && ref.current) {
                try {
                    const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart);
                    setSvg(svg);
                } catch (error) {

                    console.error('Failed to render mermaid chart:', error);
                    console.debug('Problematic Chart Code:', chart);
                    setSvg(`
                        <div class="flex flex-col items-center justify-center p-6 text-center opacity-60">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-red-400 mb-2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                            <p class="text-red-300 text-xs font-medium">Visualization Construction Failed</p>
                            <p class="text-gray-500 text-[10px] mt-1">Syntax error in generated mindmap</p>
                        </div>
                    `);
                }
            }
        };

        renderChart();
    }, [chart]);

    return (
        <div 
            ref={ref}
            className="w-full overflow-x-auto p-4 bg-gray-950/50 rounded-xl border border-gray-800 flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default MermaidDiagram;
