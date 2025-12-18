import { useState, useRef, useEffect } from "react";
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
  Send,
  User,
  Shield,
} from "lucide-react";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";
import type { EvaluationResult, BlockType } from "@railier/shared";

interface TestRunnerProps {
  isOpen: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  status?: "allowed" | "blocked" | "flagged";
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
    guardrailId,
    toggleTestRunner,
  } = useStore();

  const [userRole, setUserRole] = useState("");
  const [expandedTrace, setExpandedTrace] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "system">("user");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      // If we have a guardrail ID, call the API
      if (guardrailId) {
        const response = await fetch(
          `/api/guardrails/${guardrailId}/evaluate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: testInput,
              userRole: userRole || undefined,
            }),
          }
        );
        const data = await response.json();
        setTestResult(data.result);
      } else {
        // Mock evaluation for demo purposes - now follows the actual connections
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
          const outgoingEdges = edges.filter((e) => e.source === currentId);
          outgoingEdges.forEach((e) => {
            if (!executedBlocks.has(e.target)) {
              queue.push(e.target);
            }
          });
        }

        // Determine final decision based on action blocks
        const hasSalaryKeyword = /salary|compensation|pay|wage/i.test(
          testInput
        );
        const isHR = userRole.toLowerCase().includes("hr");

        const mockResult: EvaluationResult = {
          guardrailId: "demo",
          decision: hasSalaryKeyword && !isHR ? "block" : "allow",
          reason:
            hasSalaryKeyword && !isHR
              ? "Request contains salary-related keywords and user is not in HR"
              : "Request passed all guardrail checks",
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: selectedRole,
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate processing
    setTimeout(() => {
      setIsLoading(false);
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a simulated response from the guardrail system.",
        timestamp: Date.now(),
        status: "allowed",
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--bg-secondary)]">
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

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[var(--border-color)] flex items-center gap-2 sm:gap-3 bg-[var(--bg-primary)]">
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            Test Runner
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            {nodes.length} blocks • {edges.length} connections
          </span>
          <button
            onClick={toggleTestRunner}
            className="ml-auto p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all hover:shadow-sm"
            title="Close Test Runner"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

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
                      ) : (
                        <XCircle className="w-6 h-6 flex-shrink-0" />
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
                      {testResult.executionTrace.map((trace, i) => (
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
                          <span className="font-mono text-xs flex-shrink-0">
                            {trace.blockId}
                          </span>
                          <span className="opacity-70 text-xs flex-1 truncate">
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
                      ))}
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

      {/* Input Area - Matching AIAssistant Design */}
      <div
        className="fixed z-50 transition-all duration-300"
        style={{
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "800px",
          padding: "0 16px",
        }}
      >
        <div className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <div className="relative flex items-center gap-3 px-4 py-3 bg-[var(--bg-secondary)]/90 border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl">
            {/* Role Selector (Left Icons) */}
            <div className="relative group/role">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-transparent hover:border-[var(--border-color)]"
                title="Select Role"
              >
                {selectedRole === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span className="text-xs font-medium capitalize">
                  {selectedRole}
                </span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute bottom-full left-0 mb-2 w-32 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover/role:opacity-100 group-hover/role:visible transition-all transform origin-bottom-left">
                <button
                  onClick={() => setSelectedRole("user")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-tertiary)] transition-colors",
                    selectedRole === "user" &&
                      "text-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                  )}
                >
                  <User className="w-3 h-3" /> User
                </button>
                <button
                  onClick={() => setSelectedRole("system")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-tertiary)] transition-colors",
                    selectedRole === "system" &&
                      "text-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                  )}
                >
                  <Shield className="w-3 h-3" /> System
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

            {/* Text input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Type a message as ${selectedRole}...`}
              className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              autoFocus
            />

            {/* Submit button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0",
                input.trim() && !isLoading
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-[var(--accent-primary)]/40 hover:scale-105"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestRunner;
