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
                    setSvg('<div class="text-red-500 text-xs p-2">Failed to render diagram</div>');
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
