import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from './store';
import type { BlockTemplate } from '@railier/shared';
import BlockNode from './components/canvas/BlockNode';
import BlockPalette from './components/palette/BlockPalette';
import ConfigPanel from './components/config/ConfigPanel';
import TestRunner from './components/testing/TestRunner';
import AIAssistant from './components/ai/AIAssistant';
import Header from './components/layout/Header';

// Custom node types
const nodeTypes: NodeTypes = {
  blockNode: BlockNode,
};

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addBlock,
    selectNode,
    isPaletteOpen,
    isConfigPanelOpen,
    isTestRunnerOpen,
  } = useStore();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const templateData = event.dataTransfer.getData('application/reactflow');
      if (!templateData) return;

      const template: BlockTemplate = JSON.parse(templateData);

      // Calculate position relative to the canvas (ReactFlow handles viewport internally)
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      addBlock(template, position);
    },
    [addBlock]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header />

      <div className="flex-1 flex relative overflow-hidden">
        {/* Block Palette */}
        <BlockPalette isOpen={isPaletteOpen} />

        {/* Canvas */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 relative"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: 'var(--accent-primary)', strokeWidth: 2 },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--border-color)"
            />
            <Controls
              showZoom
              showFitView
              showInteractive={false}
              position="bottom-right"
            />
            <MiniMap
              nodeColor={(node) => {
                return (node.data?.color as string) || '#6366f1';
              }}
              position="top-right"
              style={{
                backgroundColor: 'var(--bg-secondary)',
              }}
            />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
              <div className="text-center space-y-3 sm:space-y-4 animate-fade-in max-w-md">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                    Start Building Your Guardrail
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xs mx-auto mt-1 leading-relaxed">
                    Drag blocks from the palette or use AI to generate a guardrail from natural language
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Config Panel */}
        <ConfigPanel isOpen={isConfigPanelOpen} />

        {/* Test Runner */}
        <TestRunner isOpen={isTestRunnerOpen} />

        {/* AI Assistant - Always visible at bottom */}
        <AIAssistant isOpen={true} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
