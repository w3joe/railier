import { useState, DragEvent } from 'react';
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
  ChevronDown,
  ChevronRight,
  GripVertical,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { blockTemplates, type BlockTemplate, useStore } from '../../store';

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

// Category config
const categories = [
  { id: 'input', name: 'Input', icon: MessageSquare, color: '#3b82f6' },
  { id: 'conditions', name: 'Conditions', icon: Search, color: '#f59e0b' },
  { id: 'logic', name: 'Logic', icon: GitMerge, color: '#8b5cf6' },
  { id: 'actions', name: 'Actions', icon: Ban, color: '#ef4444' },
  { id: 'data', name: 'Data', icon: Database, color: '#22c55e' },
  { id: 'ai', name: 'AI', icon: Sparkles, color: '#ec4899' },
];

interface BlockPaletteProps {
  isOpen: boolean;
}

function BlockPalette({ isOpen }: BlockPaletteProps) {
  const { addBlock } = useStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const onDragStart = (event: DragEvent, template: BlockTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onBlockClick = (template: BlockTemplate) => {
    // Add block at a default position in the center-left of the canvas
    addBlock(template, { x: 400, y: 200 });
  };

  const filteredTemplates = searchQuery
    ? blockTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blockTemplates;

  const getTemplatesByCategory = (categoryId: string) =>
    filteredTemplates.filter((t) => t.category === categoryId);

  return (
    <div
      className={cn(
        'fixed left-0 bottom-0 w-64 sm:w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] z-40 flex flex-col shadow-2xl',
        isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      )}
      style={{
        top: '56px',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        opacity: isOpen ? 1 : 0,
        transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out'
      }}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-[var(--border-color)]">
        <h2 className="text-base sm:text-lg font-semibold gradient-text mb-2 sm:mb-3">Block Palette</h2>
        <input
          type="text"
          placeholder="Search blocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {categories.map((category) => {
          const templates = getTemplatesByCategory(category.id);
          if (templates.length === 0 && searchQuery) return null;

          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="mb-2">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                )}
                <CategoryIcon className="w-4 h-4" style={{ color: category.color }} />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {category.name}
                </span>
                <span className="ml-auto text-xs text-[var(--text-muted)]">
                  {templates.length}
                </span>
              </button>

              {/* Block templates */}
              {isExpanded && (
                <div className="mt-1 space-y-1 pl-4">
                  {templates.map((template) => {
                    const Icon = iconMap[template.icon] || MessageSquare;
                    return (
                      <div
                        key={template.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, template)}
                        onClick={() => onBlockClick(template)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)] transition-all group border border-transparent hover:border-[var(--border-color)]"
                      >
                        <GripVertical className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${template.color}20` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: template.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {template.name}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] truncate">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="p-3 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <p className="text-xs text-[var(--text-muted)] text-center">
          <span className="hidden sm:inline">Click or drag blocks onto the canvas</span>
          <span className="sm:hidden">Tap to add blocks</span>
        </p>
      </div>
    </div>
  );
}

export default BlockPalette;
