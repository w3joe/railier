import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, ArrowLeft, ChevronDown } from 'lucide-react';
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
    await new Promise((resolve) => setTimeout(resolve, 1000));

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

    const mockResult: EvaluationResult = {
      guardrailId: 'deployed',
      decision: hasSalaryKeyword && !isHR ? 'block' : 'allow',
      reason: hasSalaryKeyword && !isHR
        ? 'Request contains salary-related keywords and user is not in HR'
        : 'Request passed all guardrail checks',
      executionTrace: mockTrace,
      totalDuration: mockTrace.reduce((sum, t) => sum + t.duration, 0),
    };

    return mockResult;
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
      const result = await runEvaluation(input, selectedRole);

      if (result) {
        let responseContent = '';
        if (result.decision === 'allow') {
          responseContent = `✅ **Allowed**\n\n${result.reason}`;
        } else if (result.decision === 'block') {
          responseContent = `❌ **Blocked**\n\n${result.reason}`;
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
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className="flex gap-4 animate-fade-in justify-center"
            >
              <div className="flex gap-4 max-w-3xl w-full">
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'rounded-2xl px-5 py-3.5',
                      message.role === 'user'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]'
                        : 'bg-transparent text-[var(--text-primary)]'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {message.result && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-color)] opacity-60">
                        <p className="text-xs">Evaluated in {message.result.totalDuration}ms</p>
                      </div>
                    )}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[var(--text-secondary)]" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isEvaluating && (
            <div className="flex gap-4 animate-fade-in justify-center">
              <div className="flex gap-4 max-w-3xl w-full">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="rounded-2xl px-5 py-3.5">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="max-w-3xl w-full">
              <div className="flex items-end gap-3 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--border-hover)] transition-all shadow-lg">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none max-h-32"
                  rows={1}
                  disabled={isEvaluating}
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isEvaluating}
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-full transition-all shrink-0 shadow-md',
                    input.trim() && !isEvaluating
                      ? 'bg-[var(--accent-primary)] hover:opacity-90 hover:shadow-lg'
                      : 'bg-[var(--bg-elevated)] opacity-50 cursor-not-allowed'
                  )}
                >
                  {isEvaluating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Send className={cn('w-5 h-5', input.trim() ? 'text-white' : 'text-[var(--text-muted)]')} />
                  )}
                </button>
              </div>

              {/* Role Selector */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Role:</span>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-sm text-[var(--text-primary)]"
                  >
                    {selectedRole}
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>

                  {showRoleDropdown && (
                    <div className="absolute bottom-full mb-2 left-0 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
                      {USER_ROLES.map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            setSelectedRole(role);
                            setShowRoleDropdown(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors',
                            selectedRole === role
                              ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                              : 'text-[var(--text-primary)]'
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeployPage;
