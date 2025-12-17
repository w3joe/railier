import { X, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore, blockTemplates } from '../../store';

interface ConfigPanelProps {
  isOpen: boolean;
}

function ConfigPanel({ isOpen }: ConfigPanelProps) {
  const { nodes, selectedNodeId, updateBlockConfig, deleteNode, selectNode } = useStore();
  
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeData = selectedNode?.data as Record<string, unknown> | undefined;
  const config = nodeData?.config as Record<string, unknown> | undefined;
  
  // Find the template for this block
  const template = blockTemplates.find((t) => t.id === nodeData?.templateId);
  
  const handleConfigChange = (key: string, value: unknown) => {
    if (selectedNodeId) {
      updateBlockConfig(selectedNodeId, { [key]: value });
    }
  };
  
  const handleReset = () => {
    if (selectedNodeId && template) {
      updateBlockConfig(selectedNodeId, template.defaultConfig);
    }
  };
  
  const handleDelete = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };
  
  const handleClose = () => {
    selectNode(null);
  };

  if (!selectedNode || !nodeData) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-72 sm:w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] z-50 transition-transform duration-300 flex flex-col shadow-2xl',
        isOpen && selectedNode ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-[var(--border-color)] flex items-center gap-3 bg-[var(--bg-primary)]">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
          style={{ backgroundColor: `${nodeData.color}20` }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: nodeData.color as string }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
            {nodeData.name as string}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">{nodeData.type as string} block</p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all hover:shadow-sm"
        >
          <X className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Config options */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Description */}
        <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-soft">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {nodeData.description as string}
          </p>
        </div>

        {/* Dynamic config fields based on block type */}
        {nodeData.type === 'condition' && nodeData.templateId === 'condition-contains' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Keywords
              </span>
              <textarea
                value={((config?.keywords as string[]) || []).join(', ')}
                onChange={(e) =>
                  handleConfigChange(
                    'keywords',
                    e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                  )
                }
                placeholder="salary, compensation, pay"
                className="input min-h-[80px] resize-y"
              />
              <span className="text-xs text-[var(--text-muted)] mt-1 block">
                Comma-separated list of keywords to match
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Match Mode
              </span>
              <select
                value={(config?.matchMode as string) || 'any'}
                onChange={(e) => handleConfigChange('matchMode', e.target.value)}
                className="input"
              >
                <option value="any">Match ANY keyword</option>
                <option value="all">Match ALL keywords</option>
              </select>
            </label>
          </div>
        )}

        {nodeData.type === 'condition' && nodeData.templateId === 'condition-role' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Allowed Roles
              </span>
              <textarea
                value={((config?.allowedRoles as string[]) || []).join(', ')}
                onChange={(e) =>
                  handleConfigChange(
                    'allowedRoles',
                    e.target.value.split(',').map((r) => r.trim()).filter(Boolean)
                  )
                }
                placeholder="HR, Manager, Admin"
                className="input min-h-[80px] resize-y"
              />
              <span className="text-xs text-[var(--text-muted)] mt-1 block">
                Users with these roles will pass the check
              </span>
            </label>
          </div>
        )}

        {nodeData.type === 'condition' && nodeData.templateId === 'condition-regex' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Regex Pattern
              </span>
              <input
                type="text"
                value={(config?.pattern as string) || ''}
                onChange={(e) => handleConfigChange('pattern', e.target.value)}
                placeholder="\\b(salary|compensation)\\b"
                className="input font-mono text-sm"
              />
              <span className="text-xs text-[var(--text-muted)] mt-1 block">
                Regular expression pattern to match
              </span>
            </label>
          </div>
        )}

        {nodeData.type === 'action' && nodeData.templateId === 'action-block' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Block Message
              </span>
              <textarea
                value={(config?.message as string) || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                placeholder="This request has been blocked."
                className="input min-h-[100px] resize-y"
              />
              <span className="text-xs text-[var(--text-muted)] mt-1 block">
                Message shown when request is blocked
              </span>
            </label>
          </div>
        )}

        {nodeData.type === 'action' && nodeData.templateId === 'action-warn' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Warning Text
              </span>
              <textarea
                value={(config?.warning as string) || ''}
                onChange={(e) => handleConfigChange('warning', e.target.value)}
                placeholder="Please be aware that..."
                className="input min-h-[100px] resize-y"
              />
            </label>
          </div>
        )}

        {nodeData.type === 'llm' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Evaluation Prompt
              </span>
              <textarea
                value={(config?.prompt as string) || ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                placeholder="Evaluate if the following content..."
                className="input min-h-[120px] resize-y"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Temperature
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={(config?.temperature as number) || 0.3}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-[var(--text-muted)]">
                {(config?.temperature as number) || 0.3}
              </span>
            </label>
          </div>
        )}

        {nodeData.type === 'data' && nodeData.templateId === 'data-policy' && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-primary)] mb-1 block">
                Policy ID
              </span>
              <input
                type="text"
                value={(config?.policyId as string) || ''}
                onChange={(e) => handleConfigChange('policyId', e.target.value)}
                placeholder="salary-policy-001"
                className="input"
              />
            </label>
          </div>
        )}

        {/* Generic config for blocks without specific UI */}
        {!['condition', 'action', 'llm', 'data'].includes(nodeData.type as string) && config && Object.keys(config).length > 0 && (
          <div className="space-y-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">Configuration</span>
            <pre className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)] overflow-x-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 sm:p-4 border-t border-[var(--border-color)] flex gap-2 bg-[var(--bg-primary)]">
        <button onClick={handleReset} className="btn btn-secondary flex-1 shadow-sm hover:shadow-md">
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button onClick={handleDelete} className="btn btn-danger flex-1 shadow-sm hover:shadow-md">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
}

export default ConfigPanel;
