import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Block,
  Connection,
  BlockTemplate,
  EvaluationResult,
  BlockType,
  BlockCategory,
} from "@railier/shared";
import {
  Node,
  Edge,
  Connection as FlowConnection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "@xyflow/react";

// Block templates for the palette
export const blockTemplates: BlockTemplate[] = [
  // Input blocks
  {
    id: "input-message",
    type: "input",
    name: "User Message",
    category: "input",
    description: "The incoming user message to evaluate",
    defaultConfig: {},
    icon: "MessageSquare",
    color: "#3b82f6",
  },
  {
    id: "input-context",
    type: "input",
    name: "Context Data",
    category: "input",
    description: "Additional context like user info, session data",
    defaultConfig: { contextKey: "" },
    icon: "Database",
    color: "#3b82f6",
  },
  // Condition blocks
  {
    id: "condition-contains",
    type: "condition",
    name: "Contains Keywords",
    category: "conditions",
    description: "Check if message contains specific keywords",
    defaultConfig: { keywords: [], matchMode: "any" },
    icon: "Search",
    color: "#f59e0b",
  },
  {
    id: "condition-regex",
    type: "condition",
    name: "Regex Match",
    category: "conditions",
    description: "Check if message matches a regex pattern",
    defaultConfig: { pattern: "" },
    icon: "Code",
    color: "#f59e0b",
  },
  {
    id: "condition-role",
    type: "condition",
    name: "Check User Role",
    category: "conditions",
    description: "Verify user has specific role or permission",
    defaultConfig: { allowedRoles: [] },
    icon: "Shield",
    color: "#f59e0b",
  },
  // Logic blocks
  {
    id: "logic-and",
    type: "logic",
    name: "AND Gate",
    category: "logic",
    description: "All inputs must be true",
    defaultConfig: {},
    icon: "GitMerge",
    color: "#8b5cf6",
  },
  {
    id: "logic-or",
    type: "logic",
    name: "OR Gate",
    category: "logic",
    description: "At least one input must be true",
    defaultConfig: {},
    icon: "GitBranch",
    color: "#8b5cf6",
  },
  {
    id: "logic-not",
    type: "logic",
    name: "NOT Gate",
    category: "logic",
    description: "Invert the input value",
    defaultConfig: {},
    icon: "ToggleLeft",
    color: "#8b5cf6",
  },
  // Action blocks
  {
    id: "action-block",
    type: "action",
    name: "Block Message",
    category: "actions",
    description: "Block the request and return an explanation",
    defaultConfig: { message: "This request has been blocked." },
    icon: "Ban",
    color: "#ef4444",
  },
  {
    id: "action-allow",
    type: "action",
    name: "Allow Message",
    category: "actions",
    description: "Allow the request to proceed",
    defaultConfig: {},
    icon: "Check",
    color: "#22c55e",
  },
  {
    id: "action-warn",
    type: "action",
    name: "Add Warning",
    category: "actions",
    description: "Add a warning to the response",
    defaultConfig: { warning: "" },
    icon: "AlertTriangle",
    color: "#f59e0b",
  },
  {
    id: "action-approval",
    type: "action",
    name: "Require Approval",
    category: "actions",
    description: "Route to human review queue",
    defaultConfig: { approvers: [] },
    icon: "UserCheck",
    color: "#06b6d4",
  },
  {
    id: "action-log",
    type: "action",
    name: "Log Event",
    category: "actions",
    description: "Log the event for auditing",
    defaultConfig: { logLevel: "info", includeMessage: true },
    icon: "FileText",
    color: "#64748b",
  },
  // Data blocks
  {
    id: "data-policy",
    type: "data",
    name: "Policy Lookup",
    category: "data",
    description: "Reference company policy document",
    defaultConfig: { policyId: "" },
    icon: "BookOpen",
    color: "#22c55e",
  },
  {
    id: "data-user",
    type: "data",
    name: "User Context",
    category: "data",
    description: "Access user metadata and permissions",
    defaultConfig: { fields: [] },
    icon: "User",
    color: "#22c55e",
  },
  // LLM blocks
  {
    id: "llm-evaluate",
    type: "llm",
    name: "AI Evaluation",
    category: "ai",
    description: "Use LLM to evaluate content",
    defaultConfig: {
      prompt: "Evaluate if the following content violates any policies:",
      temperature: 0.3,
    },
    icon: "Sparkles",
    color: "#ec4899",
  },
  {
    id: "llm-classify",
    type: "llm",
    name: "AI Classification",
    category: "ai",
    description: "Classify content into categories",
    defaultConfig: {
      categories: [],
      threshold: 0.8,
    },
    icon: "Brain",
    color: "#ec4899",
  },
  // Output blocks
  {
    id: "output-decision",
    type: "output",
    name: "Final Decision",
    category: "actions",
    description: "The final output of the guardrail",
    defaultConfig: {},
    icon: "Flag",
    color: "#14b8a6",
  },
];

// Convert Block to React Flow Node
export const blockToNode = (block: Block): Node => ({
  id: block.id,
  type: "blockNode",
  position: block.position,
  data: {
    ...block,
  },
});

// Convert Connection to React Flow Edge
export const connectionToEdge = (connection: Connection): Edge => ({
  id: connection.id,
  source: connection.sourceBlockId,
  sourceHandle: connection.sourceHandle,
  target: connection.targetBlockId,
  targetHandle: connection.targetHandle,
  type: "smoothstep",
  animated: true,
});

interface GuardrailState {
  // Current guardrail
  guardrailId: string | null;
  guardrailName: string;
  guardrailDescription: string;

  // React Flow state
  nodes: Node[];
  edges: Edge[];

  // UI state
  selectedNodeId: string | null;
  isPaletteOpen: boolean;
  isConfigPanelOpen: boolean;
  isTestRunnerOpen: boolean;
  isAIAssistantOpen: boolean;

  // Test state
  testInput: string;
  testResult: EvaluationResult | null;
  isEvaluating: boolean;

  // AI state
  aiPrompt: string;
  isGenerating: boolean;

  // Actions
  setGuardrail: (id: string | null, name: string, description: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: FlowConnection) => void;
  addBlock: (
    template: BlockTemplate,
    position: { x: number; y: number }
  ) => void;
  addBlockWithId: (
    template: BlockTemplate,
    position: { x: number; y: number },
    config?: Record<string, unknown>
  ) => string;
  addConnection: (
    sourceId: string,
    targetId: string,
    sourceHandle?: string,
    targetHandle?: string
  ) => void;
  updateBlockConfig: (nodeId: string, config: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  togglePalette: () => void;
  toggleConfigPanel: () => void;
  toggleTestRunner: () => void;
  toggleAIAssistant: () => void;
  setTestInput: (input: string) => void;
  setTestResult: (result: EvaluationResult | null) => void;
  setIsEvaluating: (isEvaluating: boolean) => void;
  setAIPrompt: (prompt: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  clearCanvas: () => void;
}

let nodeIdCounter = 0;
const generateNodeId = () => `block-${++nodeIdCounter}`;

export const useStore = create<GuardrailState>()(
  devtools(
    (set, get) => ({
      // Initial state
      guardrailId: null,
      guardrailName: "Untitled Guardrail",
      guardrailDescription: "",
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isPaletteOpen: true,
      isConfigPanelOpen: false,
      isTestRunnerOpen: false,
      isAIAssistantOpen: false,
      testInput: "",
      testResult: null,
      isEvaluating: false,
      aiPrompt: "",
      isGenerating: false,

      // Actions
      setGuardrail: (id, name, description) =>
        set({
          guardrailId: id,
          guardrailName: name,
          guardrailDescription: description,
        }),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection) => {
        const newEdge = {
          ...connection,
          id: `edge-${Date.now()}`,
          type: "smoothstep",
          animated: true,
        };
        set({
          edges: addEdge(newEdge, get().edges),
        });
      },

      addBlock: (template, position) => {
        const id = generateNodeId();
        const newNode: Node = {
          id,
          type: "blockNode",
          position,
          data: {
            id,
            type: template.type as BlockType,
            name: template.name,
            category: template.category as BlockCategory,
            config: { ...template.defaultConfig },
            templateId: template.id,
            icon: template.icon,
            color: template.color,
            description: template.description,
          },
        };
        set({ nodes: [...get().nodes, newNode] });
      },

      addBlockWithId: (template, position, config) => {
        const id = generateNodeId();
        const newNode: Node = {
          id,
          type: "blockNode",
          position,
          data: {
            id,
            type: template.type as BlockType,
            name: template.name,
            category: template.category as BlockCategory,
            config: { ...template.defaultConfig, ...(config || {}) },
            templateId: template.id,
            icon: template.icon,
            color: template.color,
            description: template.description,
          },
        };
        set({ nodes: [...get().nodes, newNode] });
        return id;
      },

      addConnection: (
        sourceId,
        targetId,
        sourceHandle = "output",
        targetHandle = "input"
      ) => {
        const newEdge = {
          id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: sourceId,
          target: targetId,
          sourceHandle,
          targetHandle,
          type: "smoothstep",
          animated: true,
        };
        set({
          edges: [...get().edges, newEdge],
        });
      },

      updateBlockConfig: (nodeId, config) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...(node.data as Record<string, unknown>),
                    config: {
                      ...((node.data as Record<string, unknown>)
                        .config as Record<string, unknown>),
                      ...config,
                    },
                  },
                }
              : node
          ),
        });
      },

      deleteNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((node) => node.id !== nodeId),
          edges: get().edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeId:
            get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        });
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId, isConfigPanelOpen: nodeId !== null });
      },

      togglePalette: () => set({ isPaletteOpen: !get().isPaletteOpen }),
      toggleConfigPanel: () =>
        set({ isConfigPanelOpen: !get().isConfigPanelOpen }),
      toggleTestRunner: () =>
        set({ isTestRunnerOpen: !get().isTestRunnerOpen }),
      toggleAIAssistant: () =>
        set({ isAIAssistantOpen: !get().isAIAssistantOpen }),

      setTestInput: (input) => set({ testInput: input }),
      setTestResult: (result) => set({ testResult: result }),
      setIsEvaluating: (isEvaluating) => set({ isEvaluating }),

      setAIPrompt: (prompt) => set({ aiPrompt: prompt }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),

      clearCanvas: () => set({ nodes: [], edges: [], selectedNodeId: null }),
    }),
    { name: "railier-store" }
  )
);
