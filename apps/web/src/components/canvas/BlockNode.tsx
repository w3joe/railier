import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
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
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore } from "../../store";

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

interface BlockNodeData {
  id: string;
  type: string;
  name: string;
  category: string;
  config: Record<string, unknown>;
  icon: string;
  color: string;
  description: string;
}

function BlockNode({ data, selected }: NodeProps) {
  const blockData = data as unknown as BlockNodeData;
  const { selectNode, selectedNodeId, testResult, updateBlockConfig } =
    useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editConfig, setEditConfig] = useState(blockData.config);
  const Icon = iconMap[blockData.icon] || MessageSquare;

  // Check if this block was activated in the test result
  const executionResult = testResult?.executionTrace?.find(
    (trace) => trace.blockId === blockData.id
  );
  const isActivated = executionResult?.activated;

  const isSelected = selected || selectedNodeId === blockData.id;

  // Determine handle positions based on block type
  const hasInput = blockData.type !== "input";
  const hasOutput = blockData.type !== "output";

  // Multiple inputs for logic blocks
  const isLogicBlock = blockData.type === "logic";

  // Get tooltip text based on block type
  const getHandleTooltip = (handleId: string): string => {
    const tooltips: Record<string, Record<string, string>> = {
      input: {
        output: "Connect to next block to send message data",
      },
      condition: {
        input: "Input from previous block to evaluate",
        true: "Connect when condition is TRUE",
        false: "Connect when condition is FALSE",
      },
      logic: {
        input: "First input condition",
        "input-2": "Second input condition",
        output: "Combined result of logic operation",
      },
      action: {
        input: "Trigger this action",
        output: "Action completed, continue flow",
      },
      data: {
        input: "Request data",
        output: "Data retrieved, pass to next block",
      },
      llm: {
        input: "Content to evaluate with AI",
        true: "AI evaluation passed",
        false: "AI evaluation failed",
      },
      output: {
        input: "Final decision input",
      },
    };

    return tooltips[blockData.type]?.[handleId] || `${handleId} connector`;
  };

  const handleSave = () => {
    updateBlockConfig(blockData.id, editConfig);
    setIsEditing(false);
  };

  const renderConfigField = (key: string, value: unknown) => {
    if (Array.isArray(value)) {
      return (
        <input
          type="text"
          value={value.join(", ")}
          onChange={(e) =>
            setEditConfig({
              ...editConfig,
              [key]: e.target.value.split(",").map((s) => s.trim()),
            })
          }
          className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
          placeholder={key}
        />
      );
    }
    if (typeof value === "string" || typeof value === "number") {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) =>
            setEditConfig({ ...editConfig, [key]: e.target.value })
          }
          className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
          placeholder={key}
        />
      );
    }
    if (typeof value === "boolean") {
      return (
        <label className="flex items-center gap-1 text-xs text-white">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) =>
              setEditConfig({ ...editConfig, [key]: e.target.checked })
            }
            className="rounded"
          />
          {key}
        </label>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        isSelected && "scale-105",
        isActivated && "animate-pulse-glow"
      )}
      onClick={() => selectNode(blockData.id)}
    >
      {/* Rectangular block shape */}
      <svg
        width="200"
        height={isSelected && isEditing ? "200" : "80"}
        viewBox={`0 0 200 ${isSelected && isEditing ? "200" : "80"}`}
        className="absolute top-0 left-0"
      >
        <defs>
          <filter
            id={`shadow-${blockData.id}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.4" />
          </filter>
          <linearGradient
            id={`gradient-${blockData.id}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={blockData.color} stopOpacity="1" />
            <stop
              offset="100%"
              stopColor={blockData.color}
              stopOpacity="0.85"
            />
          </linearGradient>
        </defs>

        {/* Main rectangular block shape */}
        <rect
          x="0"
          y="0"
          width="200"
          height={isSelected && isEditing ? "200" : "80"}
          rx="8"
          ry="8"
          fill={`url(#gradient-${blockData.id})`}
          filter={`url(#shadow-${blockData.id})`}
          stroke={isSelected ? "#fff" : "rgba(255,255,255,0.3)"}
          strokeWidth={isSelected ? 3 : 1}
        />

        {/* Inner highlight */}
        <rect
          x="4"
          y="4"
          width="192"
          height="18"
          rx="6"
          ry="6"
          fill="rgba(255,255,255,0.2)"
        />
      </svg>

      {/* Block content */}
      <div
        className={cn(
          "relative z-10 w-[200px] flex flex-col",
          isSelected && isEditing ? "h-[200px]" : "h-[80px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center px-4 gap-3 h-[80px]">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {blockData.name}
            </div>
            <div className="text-xs text-white/70 truncate">
              {blockData.type}
            </div>
          </div>

          {/* Activation indicator */}
          {isActivated !== undefined && (
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                isActivated ? "bg-green-400" : "bg-gray-500"
              )}
            />
          )}
        </div>

        {/* Inline config editor */}
        {isSelected &&
          isEditing &&
          Object.keys(blockData.config).length > 0 && (
            <div className="px-3 pb-3 space-y-2 overflow-y-auto flex-1">
              {Object.entries(blockData.config).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] text-white/70 uppercase tracking-wide">
                    {key}
                  </label>
                  {renderConfigField(key, value)}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                    setEditConfig(blockData.config);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        {/* Edit button when selected but not editing */}
        {isSelected &&
          !isEditing &&
          Object.keys(blockData.config).length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="absolute top-2 right-2 px-2 py-1 text-[10px] bg-white/10 hover:bg-white/20 text-white rounded"
            >
              Edit
            </button>
          )}
      </div>

      {/* Handles - Clean, minimal with dynamic tooltips */}
      {hasInput && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="input"
            className="!bg-white !border-4 !w-5 !h-5 !rounded-full hover:!bg-opacity-80 transition-colors"
            style={{ borderColor: blockData.color }}
            title={getHandleTooltip("input")}
          />
          {isLogicBlock && (
            <Handle
              type="target"
              position={Position.Left}
              id="input-2"
              className="!bg-white !border-4 !w-5 !h-5 !rounded-full hover:!bg-opacity-80 transition-colors"
              style={{ borderColor: blockData.color, top: "50%" }}
              title={getHandleTooltip("input-2")}
            />
          )}
        </>
      )}

      {/* Conditional outputs for condition blocks (true/false only, no generic output) */}
      {blockData.type === "condition" && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!bg-green-400 !border-4 !border-green-600 !w-5 !h-5 !rounded-full hover:!bg-green-500 transition-colors"
            style={{ top: "35%" }}
            title={getHandleTooltip("true")}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="!bg-red-400 !border-4 !border-red-600 !w-5 !h-5 !rounded-full hover:!bg-red-500 transition-colors"
            style={{ top: "65%" }}
            title={getHandleTooltip("false")}
          />
        </>
      )}

      {/* LLM blocks also have true/false outputs */}
      {blockData.type === "llm" && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!bg-green-400 !border-4 !border-green-600 !w-5 !h-5 !rounded-full hover:!bg-green-500 transition-colors"
            style={{ top: "35%" }}
            title={getHandleTooltip("true")}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="!bg-red-400 !border-4 !border-red-600 !w-5 !h-5 !rounded-full hover:!bg-red-500 transition-colors"
            style={{ top: "65%" }}
            title={getHandleTooltip("false")}
          />
        </>
      )}

      {/* Standard output for non-condition blocks */}
      {hasOutput &&
        blockData.type !== "condition" &&
        blockData.type !== "llm" && (
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            className="!bg-white !border-4 !w-5 !h-5 !rounded-full hover:!bg-opacity-80 transition-colors"
            style={{ borderColor: blockData.color }}
            title={getHandleTooltip("output")}
          />
        )}
    </div>
  );
}

export default memo(BlockNode);
