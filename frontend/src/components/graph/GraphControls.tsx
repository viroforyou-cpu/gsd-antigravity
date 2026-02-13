/**
 * GraphControls - Controls for knowledge graph visualization
 * Provides zoom, fit, and layout controls
 */
import { useState } from 'react';

interface GraphControlsProps {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFitAll?: () => void;
    onFitWidth?: () => void;
}

export function GraphControls({
    onZoomIn,
    onZoomOut,
    onFitAll,
    onFitWidth,
}: GraphControlsProps) {
    const [layout, setLayout] = useState<'down' | 'right'>('down');

    const handleLayoutChange = (newLayout: 'down' | 'right') => {
        setLayout(newLayout);
        // Layout change would be handled by parent component
    };

    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
            {/* Zoom Controls */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
                <button
                    onClick={onZoomIn}
                    className="p-2 hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                    title="Zoom In"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
                <button
                    onClick={onZoomOut}
                    className="p-2 hover:bg-gray-50 rounded-b-lg transition-colors"
                    title="Zoom Out"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
            </div>

            {/* Fit Controls */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
                <button
                    onClick={onFitAll}
                    className="p-2 hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                    title="Fit All"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
                <button
                    onClick={onFitWidth}
                    className="p-2 hover:bg-gray-50 rounded-b-lg transition-colors"
                    title="Fit Width"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
                    </svg>
                </button>
            </div>

            {/* Layout Controls */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-2 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Layout</span>
                </div>
                <div className="flex">
                    <button
                        onClick={() => handleLayoutChange('down')}
                        className={`flex-1 p-2 transition-colors ${layout === 'down' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50 text-gray-600'}`}
                        title="Vertical Layout"
                    >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleLayoutChange('right')}
                        className={`flex-1 p-2 transition-colors ${layout === 'right' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50 text-gray-600'}`}
                        title="Horizontal Layout"
                    >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GraphControls;
