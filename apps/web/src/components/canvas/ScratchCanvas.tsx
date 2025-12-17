import { useRef, useState, useCallback, useEffect } from 'react';
import ScratchBlock, { ScratchBlockData } from './ScratchBlock';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';

const SNAP_DISTANCE = 30; // Distance threshold for snapping
const BLOCK_HEIGHT = 60;
const NOTCH_HEIGHT = 8;
const C_BLOCK_BRANCH_HEIGHT = 80;

// Helper to calculate total height of a block including nested blocks
const calculateBlockHeight = (block: ScratchBlockData, allBlocks: ScratchBlockData[]): number => {
  const isCondition = block.type === 'condition' || block.type === 'llm';

  if (isCondition) {
    const trueChild = block.trueChildId ? allBlocks.find(b => b.id === block.trueChildId) : null;
    const falseChild = block.falseChildId ? allBlocks.find(b => b.id === block.falseChildId) : null;

    const trueHeight = trueChild ? calculateBlockHeight(trueChild, allBlocks) : 0;
    const falseHeight = falseChild ? calculateBlockHeight(falseChild, allBlocks) : 0;

    const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueHeight + 20);
    const falseBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, falseHeight + 20);
    const dividerHeight = 4; // Height of the divider between TRUE and FALSE

    return BLOCK_HEIGHT + trueBranchHeight + dividerHeight + falseBranchHeight + 20;
  }

  return BLOCK_HEIGHT;
};

interface DragState {
  blockId: string;
  offsetX: number;
  offsetY: number;
  originalX: number;
  originalY: number;
}

export default function ScratchCanvas() {
  const { scratchBlocks, updateBlockPosition, connectBlocks, selectedNodeId, selectNode, testResult } =
    useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [snapTarget, setSnapTarget] = useState<{
    targetId: string;
    position: 'bottom' | 'true' | 'false';
  } | null>(null);

  // Handle mouse down on block - start dragging
  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, blockId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const block = scratchBlocks.find((b) => b.id === blockId);
      if (!block) return;

      // Disconnect from parent when starting drag
      if (block.parentId) {
        connectBlocks(blockId, null);
      }

      setDragState({
        blockId,
        offsetX: e.clientX - block.x,
        offsetY: e.clientY - block.y,
        originalX: block.x,
        originalY: block.y,
      });

      selectNode(blockId);
    },
    [scratchBlocks, connectBlocks, selectNode]
  );

  // Find potential snap targets while dragging
  const findSnapTarget = useCallback(
    (draggedBlock: ScratchBlockData, x: number, y: number) => {
      for (const targetBlock of scratchBlocks) {
        if (targetBlock.id === draggedBlock.id) continue;
        if (targetBlock.childId === draggedBlock.id) continue; // Already connected

        const targetHeight = calculateBlockHeight(targetBlock, scratchBlocks);

        // Check bottom snap (for normal blocks)
        if (targetBlock.type !== 'output') {
          const bottomSnapY = targetBlock.y + targetHeight;
          const bottomSnapX = targetBlock.x;

          const distanceBottom = Math.sqrt(
            Math.pow(x - bottomSnapX, 2) + Math.pow(y - bottomSnapY, 2)
          );

          if (distanceBottom < SNAP_DISTANCE) {
            return { targetId: targetBlock.id, position: 'bottom' as const };
          }
        }

        // Check conditional branch snaps (for condition/llm blocks)
        if (targetBlock.type === 'condition' || targetBlock.type === 'llm') {
          // Calculate branch heights
          const trueChild = targetBlock.trueChildId ? scratchBlocks.find(b => b.id === targetBlock.trueChildId) : null;
          const falseChild = targetBlock.falseChildId ? scratchBlocks.find(b => b.id === targetBlock.falseChildId) : null;

          const trueHeight = trueChild ? calculateBlockHeight(trueChild, scratchBlocks) : 0;
          const falseHeight = falseChild ? calculateBlockHeight(falseChild, scratchBlocks) : 0;

          const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueHeight + 20);

          // True branch (inside C-shape, top section)
          const trueBranchX = targetBlock.x + 40;
          const trueBranchY = targetBlock.y + BLOCK_HEIGHT + 10;

          const distanceTrue = Math.sqrt(
            Math.pow(x - trueBranchX, 2) + Math.pow(y - trueBranchY, 2)
          );

          if (distanceTrue < SNAP_DISTANCE) {
            return { targetId: targetBlock.id, position: 'true' as const };
          }

          // False branch (inside C-shape, bottom section - after TRUE branch)
          const falseBranchX = targetBlock.x + 40;
          const falseBranchY = targetBlock.y + BLOCK_HEIGHT + trueBranchHeight + 14; // +4 for divider

          const distanceFalse = Math.sqrt(
            Math.pow(x - falseBranchX, 2) + Math.pow(y - falseBranchY, 2)
          );

          if (distanceFalse < SNAP_DISTANCE) {
            return { targetId: targetBlock.id, position: 'false' as const };
          }
        }
      }

      return null;
    },
    [scratchBlocks]
  );

  // Handle mouse move - dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const newX = e.clientX - dragState.offsetX;
      const newY = e.clientY - dragState.offsetY;

      // Check for snap targets first
      const block = scratchBlocks.find((b) => b.id === dragState.blockId);
      if (block) {
        const target = findSnapTarget(block, newX, newY);
        setSnapTarget(target);

        // If snapping, position block at snap location
        if (target) {
          const targetBlock = scratchBlocks.find((b) => b.id === target.targetId);
          if (targetBlock) {
            let snapX = targetBlock.x;
            let snapY = targetBlock.y;

            if (target.position === 'bottom') {
              const targetHeight = calculateBlockHeight(targetBlock, scratchBlocks);
              snapY = targetBlock.y + targetHeight;
              updateBlockPosition(dragState.blockId, snapX, snapY);
              return;
            } else if (target.position === 'true' || target.position === 'false') {
              // Calculate branch heights for C-blocks
              const trueChild = targetBlock.trueChildId ? scratchBlocks.find(b => b.id === targetBlock.trueChildId) : null;
              const trueHeight = trueChild ? calculateBlockHeight(trueChild, scratchBlocks) : 0;
              const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueHeight + 20);

              snapX = targetBlock.x + 40;
              snapY = target.position === 'true'
                ? targetBlock.y + BLOCK_HEIGHT + 10
                : targetBlock.y + BLOCK_HEIGHT + trueBranchHeight + 14; // +4 for divider

              updateBlockPosition(dragState.blockId, snapX, snapY);
              return;
            }
          }
        }
      }

      // Normal dragging without snap
      updateBlockPosition(dragState.blockId, newX, newY);
    };

    const handleMouseUp = () => {
      if (!dragState) return;

      // Perform snap if target found
      if (snapTarget) {
        const block = scratchBlocks.find((b) => b.id === dragState.blockId);
        const targetBlock = scratchBlocks.find((b) => b.id === snapTarget.targetId);

        if (block && targetBlock) {
          connectBlocks(dragState.blockId, snapTarget.targetId, snapTarget.position);
        }
      }

      setDragState(null);
      setSnapTarget(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, snapTarget, scratchBlocks, updateBlockPosition, connectBlocks, findSnapTarget]);

  // Handle block click
  const handleBlockClick = useCallback(
    (blockId: string) => {
      selectNode(blockId);
    },
    [selectNode]
  );

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative w-full h-full bg-[var(--bg-primary)]',
        'overflow-hidden'
      )}
      style={{
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
    >
      {/* SVG layer for connection lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        {scratchBlocks.map((block) => {
          const lines: JSX.Element[] = [];

          // Draw line to child (bottom connection)
          if (block.childId) {
            const child = scratchBlocks.find((b) => b.id === block.childId);
            if (child) {
              const blockHeight = calculateBlockHeight(block, scratchBlocks);
              const startX = block.x + 100;
              const startY = block.y + blockHeight;
              const endX = child.x + 100;
              const endY = child.y;

              lines.push(
                <line
                  key={`${block.id}-child`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={block.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              );
            }
          }

          // Draw line to true branch
          if (block.trueChildId) {
            const child = scratchBlocks.find((b) => b.id === block.trueChildId);
            if (child) {
              const startX = block.x + 40;
              const startY = block.y + BLOCK_HEIGHT + 10;
              const endX = child.x + 100;
              const endY = child.y + 30;

              lines.push(
                <line
                  key={`${block.id}-true`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 2"
                  opacity="0.5"
                />
              );
            }
          }

          // Draw line to false branch
          if (block.falseChildId) {
            const child = scratchBlocks.find((b) => b.id === block.falseChildId);
            if (child) {
              // Calculate true branch height to position false branch correctly
              const trueChild = block.trueChildId ? scratchBlocks.find(b => b.id === block.trueChildId) : null;
              const trueHeight = trueChild ? calculateBlockHeight(trueChild, scratchBlocks) : 0;
              const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueHeight + 20);

              const startX = block.x + 40;
              const startY = block.y + BLOCK_HEIGHT + trueBranchHeight + 14; // +4 for divider
              const endX = child.x + 100;
              const endY = child.y + 30;

              lines.push(
                <line
                  key={`${block.id}-false`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 2"
                  opacity="0.5"
                />
              );
            }
          }

          return lines;
        })}
      </svg>

      {/* Render all blocks */}
      {scratchBlocks.map((block) => {
        const isActivated = testResult?.executionTrace?.find(
          (trace) => trace.blockId === block.id
        )?.activated;

        return (
          <ScratchBlock
            key={block.id}
            block={block}
            isSelected={selectedNodeId === block.id}
            isDragging={dragState?.blockId === block.id}
            onMouseDown={handleBlockMouseDown}
            onClick={handleBlockClick}
            isActivated={isActivated}
            allBlocks={scratchBlocks}
          />
        );
      })}

      {/* Snap target indicator */}
      {snapTarget && (() => {
        const targetBlock = scratchBlocks.find((b) => b.id === snapTarget.targetId);
        if (!targetBlock) return null;

        const targetHeight = calculateBlockHeight(targetBlock, scratchBlocks);

        let indicatorStyle: React.CSSProperties = {
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 100,
        };

        if (snapTarget.position === 'bottom') {
          indicatorStyle = {
            ...indicatorStyle,
            left: `${targetBlock.x}px`,
            top: `${targetBlock.y + targetHeight}px`,
            width: '200px',
            height: '6px',
            backgroundColor: 'rgba(96, 165, 250, 0.9)',
            boxShadow: '0 0 12px rgba(96, 165, 250, 0.6)',
            borderRadius: '3px',
          };
        } else if (snapTarget.position === 'true' || snapTarget.position === 'false') {
          const trueChild = targetBlock.trueChildId ? scratchBlocks.find(b => b.id === targetBlock.trueChildId) : null;
          const trueHeight = trueChild ? calculateBlockHeight(trueChild, scratchBlocks) : 0;
          const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueHeight + 20);

          const yPos = snapTarget.position === 'true'
            ? targetBlock.y + BLOCK_HEIGHT + 10
            : targetBlock.y + BLOCK_HEIGHT + trueBranchHeight + 14; // +4 for divider

          indicatorStyle = {
            ...indicatorStyle,
            left: `${targetBlock.x + 40}px`,
            top: `${yPos}px`,
            width: '160px',
            height: '4px',
            backgroundColor: snapTarget.position === 'true'
              ? 'rgba(34, 197, 94, 0.9)'
              : 'rgba(239, 68, 68, 0.9)',
            boxShadow: snapTarget.position === 'true'
              ? '0 0 12px rgba(34, 197, 94, 0.6)'
              : '0 0 12px rgba(239, 68, 68, 0.6)',
            borderRadius: '2px',
          };
        }

        return <div style={indicatorStyle} />;
      })()}

      {/* Empty state */}
      {scratchBlocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-[var(--text-secondary)]">
            <p className="text-lg mb-2">Drop blocks here to build your guardrail</p>
            <p className="text-sm">Drag from the palette or use AI to generate</p>
          </div>
        </div>
      )}
    </div>
  );
}
