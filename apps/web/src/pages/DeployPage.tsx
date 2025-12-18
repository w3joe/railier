import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, ArrowLeft, ChevronDown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import type { EvaluationResult, BlockType } from '@railier/shared';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  result?: EvaluationResult;
}

const USER_ROLES = ['User', 'Admin', 'HR', 'Manager', 'Guest'];

function DeployPage() {
  const navigate = useNavigate();
  const { nodes, edges, guardrailName } = useStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome to ${guardrailName || 'your guardrail'}. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedRole, setSelectedRole] = useState('User');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runEvaluation = async (testInput: string, userRole: string): Promise<EvaluationResult | null> => {
    // Mock evaluation - same logic as TestRunner
    await new Promise((resolve) => setTimeout(resolve, 500));

    const executedBlocks = new Set<string>();
    const mockTrace: { blockId: string; blockType: BlockType; result: unknown; activated: boolean; duration: number }[] = [];

    const inputBlockIds = nodes
      .filter(n => (n.data as Record<string, unknown>).type === 'input')
      .map(n => n.id);

    const queue = [...inputBlockIds];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (executedBlocks.has(currentId)) continue;
      executedBlocks.add(currentId);

      const node = nodes.find(n => n.id === currentId);
      if (!node) continue;

      const nodeData = node.data as Record<string, unknown>;
      const blockType = nodeData.type as string;
      const config = nodeData.config as Record<string, unknown>;

      let activated = false;
      let result: unknown = null;

      if (blockType === 'input') {
        activated = true;
        result = testInput;
      } else if (blockType === 'condition') {
        if (nodeData.templateId === 'condition-contains') {
          const keywords = (config?.keywords as string[]) || [];
          activated = keywords.some(k => testInput.toLowerCase().includes(k.toLowerCase()));
        } else if (nodeData.templateId === 'condition-role') {
          const allowedRoles = (config?.allowedRoles as string[]) || [];
          activated = allowedRoles.some(r => userRole.toLowerCase().includes(r.toLowerCase()));
        } else {
          activated = true;
        }
        result = activated;
      } else if (blockType === 'action') {
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

      const outgoingEdges = edges.filter(e => e.source === currentId);
      outgoingEdges.forEach(e => {
        if (!executedBlocks.has(e.target)) {
          queue.push(e.target);
        }
      });
    }

    const hasSalaryKeyword = /salary|compensation|pay|wage/i.test(testInput);
    const isHR = userRole.toLowerCase().includes('hr');

    // Determine decision based on mock logic (replace with actual graph traversal result if available)
    // For demo purposes, we stick to the salary/HR logic if present in graph
    let decision: 'allow' | 'block' | 'warn' | 'require_approval' = 'allow';
    let reason = 'Request passed all guardrail checks';

    // Simple heuristic to match the demo guardrail logic
    if (nodes.some(n => (n.data as any).templateId === 'condition-contains') && 
        nodes.some(n => (n.data as any).templateId === 'condition-role')) {
        if (hasSalaryKeyword && !isHR) {
            decision = 'block';
            reason = 'Request contains salary-related keywords and user is not in HR';
        }
    }

    const mockResult: EvaluationResult = {
      guardrailId: 'deployed',
      decision,
      reason,
      executionTrace: mockTrace,
      totalDuration: mockTrace.reduce((sum, t) => sum + t.duration, 0),
    };

    return mockResult;
  };

  const callAgent = async (message: string, userRole: string) => {
    try {
      const response = await fetch('/api/agent/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userRole }),
      });
      
      if (!response.ok) {
        throw new Error('Agent unavailable');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Agent call failed:', error);
      // Fallback mock response if backend is not running
      return {
        response: "I am the Finance Agent (Offline Mode). I can't reach the server right now.",
        latency_ms: 10
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isEvaluating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsEvaluating(true);

    try {
      // 1. Run Guardrail Evaluation
      const result = await runEvaluation(input, selectedRole);

      if (result) {
        let responseContent = '';
        
        if (result.decision === 'allow') {
          // 2. If allowed, call the actual LLM Agent
          const agentResponse = await callAgent(input, selectedRole);
          responseContent = agentResponse.response;
        } else if (result.decision === 'block') {
          responseContent = `❌ **Blocked by Guardrail**\n\n${result.reason}`;
        } else {
          responseContent = `⚠️ **${result.decision.toUpperCase()}**\n\n${result.reason}`;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          result,
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Failed to evaluate the message. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-4 gap-3 z-50">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          title="Back to Builder"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            {guardrailName || 'Deployed Guardrail'}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            {nodes.length} blocks • {edges.length} connections
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-12 pb-48">
          <div className="space-y-12">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex gap-5 animate-fade-in justify-center"
              >
                <div className="flex gap-5 max-w-4xl w-full">
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pt-1">
                    <div
                      className={cn(
                        'rounded-2xl',
                        message.role === 'user'
                          ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm px-6 py-4'
                          : 'bg-transparent text-[var(--text-primary)] px-1 py-0'
                      )}
                    >
                      <p className="text-base leading-[1.7] whitespace-pre-wrap">{message.content}</p>

                      {message.result && (
                        <div className="mt-5 pt-4 border-t border-[var(--border-color)]/40 opacity-50">
                          <p className="text-xs text-[var(--text-muted)]">Evaluated in {message.result.totalDuration}ms</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 border border-[var(--border-color)]">
                      <User className="w-5 h-5 text-[var(--text-secondary)]" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isEvaluating && (
              <div className="flex gap-5 animate-fade-in justify-center">
                <div className="flex gap-5 max-w-4xl w-full">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="rounded-2xl px-1 py-0">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - Floating Centered Design */}
      <div
        className="fixed z-50 transition-all duration-300"
        style={{
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "768px",
          padding: "0 20px",
        }}
      >
        <div className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
          <div className="relative flex items-center gap-3 px-5 py-3.5 bg-[var(--bg-secondary)]/95 border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl">
            
            {/* Role Selector (Left) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-transparent hover:border-[var(--border-color)]"
                title="Select Role"
              >
                {selectedRole === 'Admin' || selectedRole === 'Manager' ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{selectedRole}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              </button>

              {showRoleDropdown && (
                <div className="absolute bottom-full left-0 mb-3 w-40 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
                  {USER_ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRoleDropdown(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-[var(--bg-tertiary)] transition-colors",
                        selectedRole === role && "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-medium"
                      )}
                    >
                      {role === 'Admin' || role === 'Manager' ? (
                        <Shield className="w-3.5 h-3.5" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-[var(--border-color)]/60" />

            {/* Text input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message as ${selectedRole}...`}
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-1"
              disabled={isEvaluating}
              autoFocus
            />

            {/* Submit button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isEvaluating}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all shrink-0",
                input.trim() && !isEvaluating
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30 hover:shadow-[var(--accent-primary)]/50 hover:scale-105 hover:brightness-110"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
              )}
            >
              {isEvaluating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeployPage;
