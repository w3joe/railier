import { useState } from "react";
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Link2Off,
  X,
  Shield,
  UserCheck,
} from "lucide-react";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";
import type { EvaluationResult, BlockType } from "@railier/shared";

interface TestRunnerProps {
  isOpen: boolean;
}

function TestRunner({ isOpen }: TestRunnerProps) {
  const {
    testInput,
    setTestInput,
    testResult,
    setTestResult,
    isEvaluating,
    setIsEvaluating,
    nodes,
    edges,
    toggleTestRunner,
  } = useStore();

  const [userRole, setUserRole] = useState("");
  const [expandedTrace, setExpandedTrace] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate that blocks are properly connected
  const validateConnections = (): { valid: boolean; error?: string } => {
    if (nodes.length === 0) {
      return {
        valid: false,
        error: "No blocks on canvas. Add blocks to create a guardrail.",
      };
    }

    if (edges.length === 0 && nodes.length > 1) {
      return {
        valid: false,
        error: "Blocks are not connected. Connect blocks to create a flow.",
      };
    }

    // Check if there's at least one input block
    const inputBlocks = nodes.filter(
      (n) => (n.data as Record<string, unknown>).type === "input"
    );
    if (inputBlocks.length === 0) {
      return {
        valid: false,
        error: 'No input block found. Add a "User Message" block to start.',
      };
    }

    // Check if there's at least one action block
    const actionBlocks = nodes.filter(
      (n) => (n.data as Record<string, unknown>).type === "action"
    );
    if (actionBlocks.length === 0) {
      return {
        valid: false,
        error: 'No action block found. Add a "Block" or "Allow" action.',
      };
    }

    // Check if all blocks (except input blocks) have at least one incoming edge
    const nodesWithIncoming = new Set(edges.map((e) => e.target));
    const disconnectedBlocks = nodes.filter((n) => {
      const data = n.data as Record<string, unknown>;
      return data.type !== "input" && !nodesWithIncoming.has(n.id);
    });

    if (disconnectedBlocks.length > 0) {
      const blockNames = disconnectedBlocks
        .map((b) => (b.data as Record<string, unknown>).name)
        .join(", ");
      return {
        valid: false,
        error: `Disconnected blocks: ${blockNames}. Connect all blocks to the flow.`,
      };
    }

    return { valid: true };
  };

  const runTest = async () => {
    if (!testInput.trim()) return;

    // Validate connections first
    const validation = validateConnections();
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid guardrail configuration");
      return;
    }

    setValidationError(null);
    setIsEvaluating(true);
    setTestResult(null);

    try {
      // Always use client-side evaluation for now
      // TODO: Call backend API when guardrail is deployed to server
      {
        // Mock evaluation - follows the actual graph connections
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Build execution trace following actual connections
        const executedBlocks = new Set<string>();
        const mockTrace: {
          blockId: string;
          blockType: BlockType;
          result: unknown;
          activated: boolean;
          duration: number;
        }[] = [];

        // Start from input blocks
        const inputBlockIds = nodes
          .filter((n) => (n.data as Record<string, unknown>).type === "input")
          .map((n) => n.id);

        // BFS through the graph following edges
        const queue = [...inputBlockIds];
        while (queue.length > 0) {
          const currentId = queue.shift()!;
          if (executedBlocks.has(currentId)) continue;
          executedBlocks.add(currentId);

          const node = nodes.find((n) => n.id === currentId);
          if (!node) continue;

          const nodeData = node.data as Record<string, unknown>;
          const blockType = nodeData.type as string;
          const config = nodeData.config as Record<string, unknown>;

          // Simulate block execution
          let activated = false;
          let result: unknown = null;

          if (blockType === "input") {
            activated = true;
            result = testInput;
          } else if (blockType === "condition") {
            if (nodeData.templateId === "condition-contains") {
              const keywords = (config?.keywords as string[]) || [];
              activated = keywords.some((k) =>
                testInput.toLowerCase().includes(k.toLowerCase())
              );
            } else if (nodeData.templateId === "condition-role") {
              const allowedRoles = (config?.allowedRoles as string[]) || [];
              activated = allowedRoles.some((r) =>
                userRole.toLowerCase().includes(r.toLowerCase())
              );
            } else {
              activated = true;
            }
            result = activated;
          } else if (blockType === "action") {
            activated = true;
            result = nodeData.templateId;
          } else {
            activated = true;
          }

          mockTrace.push({
            blockId: currentId,
            blockType: blockType as BlockType,
            result,
            activated,
            duration: Math.floor(Math.random() * 30) + 5,
          });

          // Add connected nodes to queue
          // For condition blocks, only follow the path if the condition was activated
          const outgoingEdges = edges.filter((e) => e.source === currentId);

          if (blockType === "condition") {
            // Only follow edges if condition was met
            if (activated) {
              outgoingEdges.forEach((e) => {
                if (!executedBlocks.has(e.target)) {
                  queue.push(e.target);
                }
              });
            }
          } else {
            // For non-condition blocks, follow all edges
            outgoingEdges.forEach((e) => {
              if (!executedBlocks.has(e.target)) {
                queue.push(e.target);
              }
            });
          }
        }

        // Determine final decision based on executed action blocks
        let finalDecision: "allow" | "block" | "warn" | "require_approval" | null = null;
        let finalReason = "";

        // Find the first activated action block to determine the decision
        for (const trace of mockTrace) {
          if (trace.blockType === "action" && trace.activated) {
            const actionNode = nodes.find((n) => n.id === trace.blockId);
            if (actionNode) {
              const templateId = (actionNode.data as Record<string, unknown>).templateId as string;
              const config = (actionNode.data as Record<string, unknown>).config as Record<string, unknown>;

              if (templateId?.includes("block")) {
                finalDecision = "block";
                finalReason = (config?.message as string) || "Request blocked by guardrail";
                break;
              } else if (templateId?.includes("warn")) {
                finalDecision = "warn";
                finalReason = (config?.warning as string) || "Warning issued by guardrail";
              } else if (templateId?.includes("approval")) {
                finalDecision = "require_approval";
                finalReason = "Request requires human approval";
              } else if (templateId?.includes("allow")) {
                finalDecision = "allow";
                finalReason = "Request allowed by guardrail";
              }
            }
          }
        }

        // If no action block was reached, default to block
        if (finalDecision === null) {
          finalDecision = "block";
          finalReason = "No action blocks reached - default block";
        }

        const mockResult: EvaluationResult = {
          guardrailId: "demo",
          decision: finalDecision,
          reason: finalReason,
          executionTrace: mockTrace,
          totalDuration: mockTrace.reduce((sum, t) => sum + t.duration, 0),
        };

        setTestResult(mockResult);
      }
    } catch (error) {
      console.error("Evaluation failed:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const decisionColors = {
    allow: "text-green-400 bg-green-400/10 border-green-400/30",
    block: "text-red-400 bg-red-400/10 border-red-400/30",
    warn: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    require_approval: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={toggleTestRunner}
      />

      {/* Slide-out Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--bg-secondary)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Test Playground
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Simulate guardrail execution
              </p>
            </div>
          </div>
          <button
            onClick={toggleTestRunner}
            className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Input section */}
          <div className="px-8 py-6 border-b border-[var(--border-color)] space-y-4">
            {/* Test Message Input */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                Test Message
              </label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="What is John's salary?"
                className="input min-h-[80px] resize-none"
              />
            </div>

            {/* User Role Input */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
                User Role{" "}
                <span className="text-[var(--text-muted)] font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="e.g., HR, Admin, User"
                className="input"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={runTest}
              disabled={isEvaluating || !testInput.trim()}
              className="btn btn-primary w-full"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Test
                </>
              )}
            </button>

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/30 text-red-400 flex items-start gap-2 animate-fade-in">
                <Link2Off className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Cannot run test</p>
                  <p className="text-xs opacity-80 mt-1">{validationError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Result section */}
          <div className="flex-1 px-8 py-6 overflow-y-auto bg-[var(--bg-primary)]">
            {validationError ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
                <AlertTriangle className="w-12 h-12 text-yellow-500 opacity-50" />
                <p className="text-sm text-center max-w-xs">
                  Fix connection issues to run tests
                </p>
              </div>
            ) : testResult ? (
              <div className="space-y-4 animate-fade-in">
                {/* Decision Card */}
                <div
                  className={cn(
                    "p-4 rounded-xl border-2 shadow-lg",
                    decisionColors[testResult.decision]
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {testResult.decision === "allow" ? (
                        <CheckCircle className="w-6 h-6 flex-shrink-0" />
                      ) : testResult.decision === "block" ? (
                        <XCircle className="w-6 h-6 flex-shrink-0" />
                      ) : testResult.decision === "warn" ? (
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                      ) : (
                        <UserCheck className="w-6 h-6 flex-shrink-0" />
                      )}
                      <span className="font-bold text-base uppercase tracking-wide">
                        {testResult.decision.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-xs opacity-70 bg-black/10 px-2 py-1 rounded-full">
                      {testResult.totalDuration}ms
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed opacity-90">
                    {testResult.reason}
                  </p>
                </div>

                {/* Execution Trace */}
                <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                  <button
                    onClick={() => setExpandedTrace(!expandedTrace)}
                    className="w-full flex items-center gap-2 p-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    {expandedTrace ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Execution Trace</span>
                    <span className="text-xs text-[var(--text-muted)] ml-auto">
                      {testResult.executionTrace.length} blocks
                    </span>
                  </button>

                  {expandedTrace && (
                    <div className="p-2 space-y-1 border-t border-[var(--border-color)]">
                      {testResult.executionTrace.map((trace, i) => {
                        const blockNode = nodes.find((n) => n.id === trace.blockId);
                        const blockName = blockNode ? (blockNode.data as Record<string, unknown>).name as string : trace.blockId;

                        return (
                          <div
                            key={trace.blockId}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg text-xs transition-all",
                              trace.activated
                                ? "bg-green-400/10 text-green-400 border border-green-400/20"
                                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-transparent"
                            )}
                          >
                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/10 text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="font-medium text-xs flex-1 truncate">
                              {blockName}
                            </span>
                            <span className="opacity-60 text-[10px] uppercase tracking-wider flex-shrink-0">
                              {trace.blockType}
                            </span>
                            <span className="text-xs opacity-70">
                              {trace.duration}ms
                            </span>
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                trace.activated
                                  ? "bg-green-400 shadow-lg shadow-green-400/50"
                                  : "bg-gray-500"
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
                <Play className="w-12 h-12 opacity-20" />
                <p className="text-sm">Run a test to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TestRunner;
