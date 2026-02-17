import { useState, useEffect } from 'react';
import { FloorPlanCanvas } from './components/FloorPlanCanvas';
import type { FloorPlanElement, Tool } from './types/floorplan';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from './utils/constants';

const AUTOSAVE_KEY = 'floorplan_autosave';

export default function App() {
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [elements, setElements] = useState<FloorPlanElement[]>(() => {
    // Load from autosave on initial mount
    const autosaved = localStorage.getItem(AUTOSAVE_KEY);
    return autosaved ? JSON.parse(autosaved) : [];
  });
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(1);

  const selectedElement = selectedElementIds.length === 1
    ? elements.find((el) => el.id === selectedElementIds[0]) || null
    : null;

  // Auto-save to localStorage whenever elements change
  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(elements));
  }, [elements]);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all elements?')) {
      setElements([]);
      setSelectedElementIds([]);
    }
  };

  const handleRotateSelected = () => {
    if (selectedElementIds.length === 0) return;

    setElements((prev) =>
      prev.map((el) => {
        if (selectedElementIds.includes(el.id) && 'rotation' in el) {
          return {
            ...el,
            rotation: (el.rotation) % 360,
          };
        }
        return el;
      })
    );
  };

  const handleUpdateElement = (updatedElement: FloorPlanElement) => {
    setElements((prev) => prev.map((el) => (el.id === updatedElement.id ? updatedElement : el)));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  const handleZoomOut = () => setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  const handleZoomReset = () => setZoom(1);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          setSelectedTool('select');
          break;
        case 'l':
          setSelectedTool('wall');
          break;
        case 'p':
          setSelectedTool('pencil');
          break;
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            setSelectedTool('room');
          }
          break;
        case 'd':
          setSelectedTool('door');
          break;
        case 'w':
          setSelectedTool('window');
          break;
        case 'c':
          setSelectedTool('camera');
          break;
        case 'h':
          setSelectedTool('pan');
          break;
        case 't':
          setSelectedTool('text');
          break;
        case 'delete':
        case 'backspace':
          if (selectedElementIds.length > 0) {
            setElements((prev) => prev.filter((el) => !selectedElementIds.includes(el.id)));
            setSelectedElementIds([]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedElementIds]);

  // Track selected element changes from canvas
  useEffect(() => {
    const handleSelectionChange = () => {
      // This is handled through the elements array
    };
    return handleSelectionChange;
  }, [elements]);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-white">Floor Plan Designer</h1>
            <p className="text-sm text-slate-400 mt-1">Create professional architectural floor plans</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded border border-blue-600/30">
              {elements.length} element{elements.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        onClear={handleClear}
        onRotateSelected={handleRotateSelected}
        hasElements={elements.length > 0}
        elements={elements}
        onLoadElements={setElements}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas Area */}
        <div className={`absolute inset-0 ${selectedElement ? 'right-80' : 'right-0'} `}>
          <FloorPlanCanvas
            selectedTool={selectedTool}
            elements={elements}
            onElementsChange={setElements}
            selectedElementIds={selectedElementIds}
            onSelectedElementChange={setSelectedElementIds}
            zoom={zoom}
            onZoomChange={setZoom}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-4">
            <h4 className="text-white text-sm mb-3">Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-slate-500 rounded"></div>
                <span className="text-slate-300">Wall</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="24" height="12" className="flex-shrink-0">
                  <path d="M 2 6 Q 8 2, 12 6 T 22 6" stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                <span className="text-slate-300">Pencil</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 bg-blue-500/10 rounded"></div>
                <span className="text-slate-300">Room</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-purple-500 rounded"></div>
                <span className="text-slate-300">Door</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-cyan-500 rounded"></div>
                <span className="text-slate-300">Window</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">Camera</span>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElement && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-slate-950 border-l border-slate-700 p-4 overflow-y-auto animate-in slide-in-from-right duration-300">
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateElement={handleUpdateElement}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-900 border-t border-slate-700 px-6 py-2 text-xs text-slate-500 flex items-center justify-between">
        <div>Blueprint Mode • Grid: 20px • Zoom: {Math.round(zoom * 100)}%</div>
        <div className="flex items-center gap-4">
          <span>Click and drag to draw rooms</span>
          <span>•</span>
          <span>Click to place doors, windows, cameras</span>
        </div>
      </div>
    </div>
  );
}