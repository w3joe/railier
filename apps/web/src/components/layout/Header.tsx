import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Trash2,
  Undo2,
  Redo2,
  CheckCircle,
  Loader2,
  Save as SaveIcon,
  Rocket,
  Upload,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore } from "../../store";
import { guardrailStorage } from "../../lib/localStorage";

function Header() {
  const navigate = useNavigate();
  const {
    guardrailId,
    guardrailName,
    toggleTestRunner,
    isTestRunnerOpen,
    clearCanvas,
    nodes,
    edges,
    setGuardrail,
  } = useStore();

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);

  const saveGuardrail = async (): Promise<string | null> => {
    if (nodes.length === 0) return null;
    setIsSaving(true);
    try {
      const payload = {
        name: guardrailName || "Untitled Guardrail",
        description: "Created in Railier UI",
        graph: { nodes, edges },
      };

      let guardrail;
      if (guardrailId) {
        guardrail = guardrailStorage.update(guardrailId, payload);
      } else {
        guardrail = guardrailStorage.create(payload);
      }

      if (!guardrail) throw new Error("Failed to save");

      const id = guardrail.id;
      setGuardrail(id, guardrailName, "");

      // Show success tooltip
      setShowSaveTooltip(true);
      setTimeout(() => setShowSaveTooltip(false), 2000);

      return id;
    } catch (e) {
      setMessage("Failed to save");
      setTimeout(() => setMessage(null), 3000);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (nodes.length === 0) {
      alert("Cannot deploy an empty guardrail. Please add some blocks first.");
      return;
    }

    // Save the guardrail first
    await saveGuardrail();

    // Navigate to deploy page
    navigate('/deploy');
  };

  return (
    <header className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-3 sm:px-4 gap-2 sm:gap-4 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shadow-lg">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-white"
            fill="currentColor"
          >
            <rect x="3" y="6" width="8" height="12" rx="1" opacity="0.9" />
            <rect x="13" y="3" width="8" height="18" rx="1" opacity="0.9" />
            <rect x="11" y="10" width="2" height="4" opacity="0.7" />
          </svg>
        </div>
        <span className="text-base sm:text-lg font-bold text-[var(--accent-primary)] hidden sm:inline">
          Railier
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--border-color)] hidden md:block" />

      {/* Guardrail name */}
      <input
        type="text"
        value={guardrailName}
        onChange={(e) =>
          useStore.getState().setGuardrail(null, e.target.value, "")
        }
        className="text-sm font-medium bg-transparent border-none outline-none text-[var(--text-primary)] w-24 sm:w-32 md:w-48 flex-shrink-0"
        placeholder="Untitled Guardrail"
      />

      {/* Toolbar - Hidden on mobile */}
      <div className="hidden lg:flex items-center gap-1 ml-2">
        <button
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

        <button
          onClick={clearCanvas}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status message - Hidden on mobile */}
      {message && (
        <div className="hidden sm:block text-xs text-[var(--text-secondary)] animate-fade-in">
          {message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={toggleTestRunner}
          className={cn(
            "btn gap-1.5",
            isTestRunnerOpen ? "btn-primary" : "btn-secondary"
          )}
        >
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Test</span>
        </button>

        <div className="relative">
          <button
            onClick={saveGuardrail}
            disabled={isSaving || nodes.length === 0}
            className="btn btn-secondary gap-1.5"
            title="Save Guardrail"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Success Tooltip */}
          {showSaveTooltip && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap animate-fade-in flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved successfully
            </div>
          )}
        </div>

        <button
          onClick={handleDeploy}
          disabled={isSaving || nodes.length === 0}
          className="btn btn-primary gap-1.5"
          title="Deploy Guardrail"
        >
          <Rocket className="w-4 h-4" />
          <span className="hidden sm:inline">Deploy</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
