import { memo } from 'react';
import {
  MessageSquare,
  Database,
  Search,
  Code,
  Shield,
  GitMerge,
  GitBranch,
  ToggleLeft,
  Ban,
  Check,
  AlertTriangle,
  UserCheck,
  FileText,
  BookOpen,
  User,
  Sparkles,
  Brain,
  Flag,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  Database,
  Search,
  Code,
  Shield,
  GitMerge,
  GitBranch,
  ToggleLeft,
  Ban,
  Check,
  AlertTriangle,
  UserCheck,
  FileText,
  BookOpen,
  User,
  Sparkles,
  Brain,
  Flag,
};

export interface ScratchBlockData {
  id: string;
  type: string;
  name: string;
  category: string;
  config: Record<string, unknown>;
  icon: string;
  color: string;
  description: string;
  parentId?: string;
  childId?: string;
  trueChildId?: string; // For condition blocks
  falseChildId?: string; // For condition blocks
  x: number;
  y: number;
}

interface ScratchBlockProps {
  block: ScratchBlockData;
  isSelected?: boolean;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent, blockId: string) => void;
  onClick?: (blockId: string) => void;
  isActivated?: boolean;
  allBlocks?: ScratchBlockData[]; // For calculating child heights
}

// Scratch-style notch dimensions
const NOTCH_WIDTH = 20;
const NOTCH_HEIGHT = 8;
const BLOCK_WIDTH = 200;
const BLOCK_HEIGHT = 60;
const C_BLOCK_BRANCH_HEIGHT = 80; // Height for each branch (true/false)

// Generate full block path based on type
const getBlockPath = (type: string, trueChildHeight: number = 0, falseChildHeight: number = 0): string => {
  const isCondition = type === 'condition' || type === 'llm';
  const isInput = type === 'input';
  const isOutput = type === 'output';

  // Calculate dynamic heights for C-blocks based on nested content
  const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueChildHeight + 20);
  const falseBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, falseChildHeight + 20);
  const dividerHeight = 4; // Height of the divider between TRUE and FALSE
  const height = isCondition ? (BLOCK_HEIGHT + trueBranchHeight + dividerHeight + falseBranchHeight + 20) : BLOCK_HEIGHT;

  const centerX = BLOCK_WIDTH / 2;
  const radius = 8;
  const indent = 40; // How far the C-shape indents

  let path = '';

  // Top left corner (with optional male notch for non-input blocks)
  if (isInput) {
    path += `M ${radius},0`;
  } else {
    // Start with male notch at top
    path += `M ${radius},0 L ${centerX - NOTCH_WIDTH / 2},0`;
    path += `L ${centerX - NOTCH_WIDTH / 2},-${NOTCH_HEIGHT}`;
    path += `L ${centerX + NOTCH_WIDTH / 2},-${NOTCH_HEIGHT}`;
    path += `L ${centerX + NOTCH_WIDTH / 2},0`;
  }

  // Top right corner
  path += `L ${BLOCK_WIDTH - radius},0`;
  path += `Q ${BLOCK_WIDTH},0 ${BLOCK_WIDTH},${radius}`;

  if (isCondition) {
    // C-shaped block for conditionals with proper spacing
    const topHeaderHeight = BLOCK_HEIGHT;
    const trueBranchStart = topHeaderHeight;
    const trueBranchEnd = trueBranchStart + trueBranchHeight;
    const falseBranchEnd = trueBranchEnd + falseBranchHeight;

    // Right edge down to start of TRUE branch
    path += `L ${BLOCK_WIDTH},${trueBranchStart}`;

    // Indent inward for TRUE branch (creating the C-shape opening)
    path += `L ${indent},${trueBranchStart}`;
    
    // Down the TRUE branch area
    path += `L ${indent},${trueBranchEnd}`;

    // Small divider between TRUE and FALSE branches
    path += `L ${BLOCK_WIDTH},${trueBranchEnd}`;
    path += `L ${BLOCK_WIDTH},${trueBranchEnd + 4}`;
    path += `L ${indent},${trueBranchEnd + 4}`;

    // Down the FALSE branch area
    path += `L ${indent},${falseBranchEnd}`;

    // Back out to right edge after FALSE branch
    path += `L ${BLOCK_WIDTH},${falseBranchEnd}`;
    path += `L ${BLOCK_WIDTH},${height - radius}`;
  } else {
    // Regular block - right edge
    path += `L ${BLOCK_WIDTH},${height - radius}`;
  }

  // Bottom right corner
  path += `Q ${BLOCK_WIDTH},${height} ${BLOCK_WIDTH - radius},${height}`;

  // Bottom edge with female notch (for non-output blocks)
  if (!isOutput) {
    path += `L ${centerX + NOTCH_WIDTH / 2},${height}`;
    path += `L ${centerX + NOTCH_WIDTH / 2},${height + NOTCH_HEIGHT}`;
    path += `L ${centerX - NOTCH_WIDTH / 2},${height + NOTCH_HEIGHT}`;
    path += `L ${centerX - NOTCH_WIDTH / 2},${height}`;
  }

  // Bottom left corner
  path += `L ${radius},${height}`;
  path += `Q 0,${height} 0,${height - radius}`;

  // Left edge
  path += `L 0,${radius}`;

  // Top left corner close
  path += `Q 0,0 ${radius},0`;
  path += `Z`;

  return path;
};

// Helper to calculate total height of a block and its descendants
const calculateBlockHeight = (blockId: string, blocks: ScratchBlockData[]): number => {
  const block = blocks.find(b => b.id === blockId);
  if (!block) return 0;

  const isCondition = block.type === 'condition' || block.type === 'llm';

  if (isCondition) {
    // Calculate heights of nested blocks
    const trueChild = block.trueChildId ? blocks.find(b => b.id === block.trueChildId) : null;
    const falseChild = block.falseChildId ? blocks.find(b => b.id === block.falseChildId) : null;

    const trueHeight = trueChild ? calculateBlockHeight(trueChild.id, blocks) : 0;
    const falseHeight = falseChild ? calculateBlockHeight(falseChild.id, blocks) : 0;

    const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueHeight + 20);
    const falseBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, falseHeight + 20);
    const dividerHeight = 4; // Height of the divider between TRUE and FALSE

    return BLOCK_HEIGHT + trueBranchHeight + dividerHeight + falseBranchHeight + 20;
  }

  return BLOCK_HEIGHT;
};

function ScratchBlock({
  block,
  isSelected = false,
  isDragging = false,
  onMouseDown,
  onClick,
  isActivated,
  allBlocks = [],
}: ScratchBlockProps) {
  const Icon = iconMap[block.icon] || MessageSquare;
  const isCondition = block.type === 'condition' || block.type === 'llm';
  const isInput = block.type === 'input';

  // Calculate child heights for C-blocks
  let trueChildHeight = 0;
  let falseChildHeight = 0;

  if (isCondition && allBlocks.length > 0) {
    if (block.trueChildId) {
      trueChildHeight = calculateBlockHeight(block.trueChildId, allBlocks);
    }
    if (block.falseChildId) {
      falseChildHeight = calculateBlockHeight(block.falseChildId, allBlocks);
    }
  }

  const trueBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, trueChildHeight + 20);
  const falseBranchHeight = Math.max(C_BLOCK_BRANCH_HEIGHT, falseChildHeight + 20);
  const dividerHeight = 4; // Height of the divider between TRUE and FALSE
  const blockHeight = isCondition
    ? (BLOCK_HEIGHT + trueBranchHeight + dividerHeight + falseBranchHeight + 20)
    : BLOCK_HEIGHT;

  return (
    <div
      className={cn(
        'absolute cursor-grab active:cursor-grabbing transition-shadow',
        isDragging && 'opacity-70 cursor-grabbing z-50',
        isSelected && 'z-40',
        !isDragging && !isSelected && 'z-10'
      )}
      style={{
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${BLOCK_WIDTH}px`,
        height: `${blockHeight + (isInput ? 0 : NOTCH_HEIGHT)}px`,
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => onMouseDown?.(e, block.id)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(block.id);
      }}
    >
      {/* SVG Block Shape */}
      <svg
        width={BLOCK_WIDTH}
        height={blockHeight + NOTCH_HEIGHT}
        viewBox={`0 -${NOTCH_HEIGHT} ${BLOCK_WIDTH} ${blockHeight + NOTCH_HEIGHT * 2}`}
        className="absolute top-0 left-0"
      >
        <defs>
          <filter id={`shadow-${block.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.4" />
          </filter>
          <linearGradient id={`gradient-${block.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={block.color} stopOpacity="1" />
            <stop offset="100%" stopColor={block.color} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Main block shape with notches */}
        <path
          d={getBlockPath(block.type, trueChildHeight, falseChildHeight)}
          fill={`url(#gradient-${block.id})`}
          filter={`url(#shadow-${block.id})`}
          stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.3)'}
          strokeWidth={isSelected ? 3 : 1}
        />

        {/* Inner highlight */}
        <rect
          x="4"
          y="4"
          width={BLOCK_WIDTH - 8}
          height="18"
          rx="6"
          ry="6"
          fill="rgba(255,255,255,0.2)"
        />
      </svg>

      {/* Block content */}
      <div
        className="relative flex items-center px-3 gap-2"
        style={{
          marginTop: block.type === 'input' ? '0' : `${NOTCH_HEIGHT}px`,
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate leading-tight">
            {block.name}
          </div>
          <div className="text-[10px] text-white/60 truncate leading-tight mt-0.5">
            {block.type}
          </div>
        </div>

        {/* Activation indicator */}
        {isActivated !== undefined && (
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              isActivated ? 'bg-green-400' : 'bg-gray-500'
            )}
          />
        )}
      </div>

      {/* Conditional branch labels for C-blocks */}
      {isCondition && (
        <>
          <div
            className="absolute text-[11px] text-white/90 font-bold"
            style={{ 
              top: `${BLOCK_HEIGHT + (isInput ? 0 : NOTCH_HEIGHT) + 15}px`,
              left: '50px'
            }}
          >
            TRUE
          </div>
          <div
            className="absolute text-[11px] text-white/90 font-bold"
            style={{ 
              top: `${BLOCK_HEIGHT + trueBranchHeight + (isInput ? 0 : NOTCH_HEIGHT) + 20}px`,
              left: '50px'
            }}
          >
            FALSE
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ScratchBlock);
