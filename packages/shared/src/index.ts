// Block Types
export type BlockType = 'input' | 'condition' | 'logic' | 'action' | 'data' | 'llm' | 'output';

export type BlockCategory = 'input' | 'logic' | 'conditions' | 'actions' | 'data' | 'ai';

export interface BlockConfig {
  [key: string]: unknown;
}

export interface Block {
  id: string;
  type: BlockType;
  name: string;
  category: BlockCategory;
  config: BlockConfig;
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  sourceBlockId: string;
  sourceHandle: string;
  targetBlockId: string;
  targetHandle: string;
  type: 'sequential' | 'conditional' | 'parallel';
}

// Guardrail Types
export interface Guardrail {
  id: string;
  name: string;
  description: string;
  blocks: Block[];
  connections: Connection[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// Evaluation Types
export interface EvaluationInput {
  message: string;
  context?: Record<string, unknown>;
  userRole?: string;
}

export interface BlockExecutionResult {
  blockId: string;
  blockType: BlockType;
  result: unknown;
  activated: boolean;
  duration: number;
}

export interface EvaluationResult {
  guardrailId: string;
  decision: 'allow' | 'block' | 'warn' | 'require_approval';
  reason: string;
  executionTrace: BlockExecutionResult[];
  totalDuration: number;
}

// Block Templates
export interface BlockTemplate {
  id: string;
  type: BlockType;
  name: string;
  category: BlockCategory;
  description: string;
  defaultConfig: BlockConfig;
  icon: string;
  color: string;
}

// AI Generation Types
export interface GenerateBlocksRequest {
  prompt: string;
  existingBlocks?: Block[];
}

export interface GenerateBlocksResponse {
  blocks: Block[];
  connections: Connection[];
  explanation: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
