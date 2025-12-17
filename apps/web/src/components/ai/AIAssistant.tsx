import { useState } from "react";
import { Sparkles, Loader2, Plus, Blocks } from "lucide-react";
import { cn } from "../../lib/utils";
import { useStore, blockTemplates } from "../../store";

interface AIAssistantProps {
  isOpen: boolean;
}

function AIAssistant({}: AIAssistantProps) {
  const {
    aiPrompt,
    setAIPrompt,
    isGenerating,
    setIsGenerating,
    addBlockWithId,
    addConnection,
    nodes,
    togglePalette,
  } = useStore();

  const [generatedExplanation, setGeneratedExplanation] = useState<
    string | null
  >(null);

  const generateBlocks = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedExplanation(null);

    try {
      // Try to call the API
      const response = await fetch(`/api/ai/generate-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          existingBlocks: nodes.map((n) => n.data),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add the generated blocks to the canvas and track their IDs
        const blockIdMap: Record<string, string> = {};
        data.blocks.forEach(
          (
            block: { templateId: string; config: Record<string, unknown> },
            index: number
          ) => {
            const template = blockTemplates.find(
              (t) => t.id === block.templateId
            );
            if (template) {
              const newBlockId = addBlockWithId(
                template,
                {
                  x: 300 + (index % 3) * 250,
                  y: 100 + Math.floor(index / 3) * 120,
                },
                block.config
              );
              // Map the API's block ID (block-1, block-2, etc.) to the actual generated ID
              blockIdMap[`block-${index + 1}`] = newBlockId;
            }
          }
        );

        // Small delay to ensure blocks are rendered before creating connections
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create connections between blocks
        if (data.connections && Array.isArray(data.connections)) {
          let successfulConnections = 0;
          let failedConnections = 0;

          data.connections.forEach(
            (conn: {
              sourceBlockId: string;
              targetBlockId: string;
              sourceHandle?: string;
              targetHandle?: string;
            }) => {
              const sourceId = blockIdMap[conn.sourceBlockId];
              const targetId = blockIdMap[conn.targetBlockId];
              if (sourceId && targetId) {
                addConnection(
                  sourceId,
                  targetId,
                  conn.sourceHandle || "output",
                  conn.targetHandle || "input"
                );
                successfulConnections++;
              } else {
                console.warn(
                  `Failed to create connection: ${conn.sourceBlockId} -> ${conn.targetBlockId}`,
                  {
                    sourceId,
                    targetId,
                    blockIdMap,
                  }
                );
                failedConnections++;
              }
            }
          );

          console.log(
            `Created ${successfulConnections} connections, ${failedConnections} failed`
          );
        }

        setGeneratedExplanation(data.explanation);
      } else {
        // Fallback to demo mode
        await generateDemoBlocks();
      }
    } catch {
      // API not available, use demo mode
      await generateDemoBlocks();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDemoBlocks = async () => {
    const { addBlockWithId, addConnection } = useStore.getState();

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Parse the prompt for common patterns
    const prompt = aiPrompt.toLowerCase();

    // Check for salary-related guardrail
    if (
      prompt.includes("salary") ||
      prompt.includes("compensation") ||
      prompt.includes("pay")
    ) {
      // Create blocks and get their IDs
      const inputId = addBlockWithId(
        blockTemplates.find((t) => t.id === "input-message")!,
        { x: 450, y: 50 }
      );

      await new Promise((r) => setTimeout(r, 150));
      const containsId = addBlockWithId(
        blockTemplates.find((t) => t.id === "condition-contains")!,
        { x: 450, y: 180 },
        {
          keywords: ["salary", "compensation", "pay", "wage"],
          matchMode: "any",
        }
      );

      await new Promise((r) => setTimeout(r, 150));
      const blockActionId = addBlockWithId(
        blockTemplates.find((t) => t.id === "action-block")!,
        { x: 350, y: 340 },
        {
          message:
            "This salary information is confidential. Please contact HR directly.",
        }
      );

      await new Promise((r) => setTimeout(r, 150));
      const allowId = addBlockWithId(
        blockTemplates.find((t) => t.id === "action-allow")!,
        { x: 550, y: 340 }
      );

      // Create connections (simplified without role check)
      await new Promise((r) => setTimeout(r, 100));
      addConnection(inputId, containsId, "output", "input");
      addConnection(containsId, blockActionId, "true", "input");
      addConnection(containsId, allowId, "false", "input");

      setGeneratedExplanation(
        "Generated a salary information protection guardrail:\n\n" +
          "✓ **User Message** → **Contains Keywords** (salary, compensation, pay, wage)\n" +
          "✓ **Contains Keywords** (true) → **Block Message**\n" +
          "✓ **Contains Keywords** (false) → **Allow Message**\n\n" +
          "Blocks are connected and ready to test!"
      );
    } else if (
      prompt.includes("pii") ||
      prompt.includes("personal") ||
      prompt.includes("privacy")
    ) {
      const inputId = addBlockWithId(
        blockTemplates.find((t) => t.id === "input-message")!,
        { x: 450, y: 50 }
      );

      await new Promise((r) => setTimeout(r, 150));
      const classifyId = addBlockWithId(
        blockTemplates.find((t) => t.id === "llm-classify")!,
        { x: 450, y: 180 },
        { categories: ["email", "phone", "ssn", "address"], threshold: 0.8 }
      );

      await new Promise((r) => setTimeout(r, 150));
      const blockActionId = addBlockWithId(
        blockTemplates.find((t) => t.id === "action-block")!,
        { x: 300, y: 340 },
        {
          message:
            "This request contains personal information that cannot be shared.",
        }
      );

      await new Promise((r) => setTimeout(r, 150));
      const warnId = addBlockWithId(
        blockTemplates.find((t) => t.id === "action-warn")!,
        { x: 600, y: 340 },
        { warning: "Be careful with personal information." }
      );

      // Create connections
      await new Promise((r) => setTimeout(r, 100));
      addConnection(inputId, classifyId, "output", "input");
      addConnection(classifyId, blockActionId, "true", "input");
      addConnection(classifyId, warnId, "false", "input");

      setGeneratedExplanation(
        "Generated a PII protection guardrail with connections:\n\n" +
          "✓ **User Message** → **AI Classification** (detects PII)\n" +
          "✓ **AI Classification** → **Block Message** (blocks sensitive PII)\n" +
          "✓ **AI Classification** → **Add Warning** (warns about potential PII)\n\n" +
          "Blocks are connected and ready to test!"
      );
    } else {
      // Generic guardrail
      const inputId = addBlockWithId(
        blockTemplates.find((t) => t.id === "input-message")!,
        { x: 450, y: 50 }
      );

      await new Promise((r) => setTimeout(r, 150));
      const evalId = addBlockWithId(
        blockTemplates.find((t) => t.id === "llm-evaluate")!,
        { x: 450, y: 180 },
        {
          prompt: `Evaluate if this request is appropriate: ${aiPrompt}`,
          temperature: 0.3,
        }
      );

      await new Promise((r) => setTimeout(r, 150));
      const allowId = addBlockWithId(
        blockTemplates.find((t) => t.id === "action-allow")!,
        { x: 300, y: 340 }
      );

      await new Promise((r) => setTimeout(r, 150));
      const blockActionId = addBlockWithId(
        blockTemplates.find((t) => t.id === "action-block")!,
        { x: 600, y: 340 },
        { message: "This request has been blocked by the guardrail." }
      );

      // Create connections
      await new Promise((r) => setTimeout(r, 100));
      addConnection(inputId, evalId, "output", "input");
      addConnection(evalId, allowId, "true", "input");
      addConnection(evalId, blockActionId, "false", "input");

      setGeneratedExplanation(
        "Generated a basic AI evaluation guardrail with connections:\n\n" +
          "✓ **User Message** → **AI Evaluation**\n" +
          "✓ **AI Evaluation** → **Allow Message**\n" +
          "✓ **AI Evaluation** → **Block Message**\n\n" +
          "Blocks are connected and ready to test!"
      );
    }
  };

  const examplePrompts = [
    "Block salary questions",
    "Detect and redact PII in responses",
    "Require approval for financial advice",
    "Block harmful or toxic content",
  ];

  return (
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
      <div className="flex flex-col gap-3">
        {/* Generated explanation - show above input when present */}
        {generatedExplanation && (
          <div className="w-full p-4 rounded-2xl bg-[var(--bg-tertiary)]/90 border border-[var(--border-color)] shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
              {generatedExplanation}
            </p>
          </div>
        )}

        {/* Example prompts - Aligned Left */}
        <div className="flex items-center gap-2 flex-wrap justify-start px-1">
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setAIPrompt(prompt)}
              className="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)]/80 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-color)] transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Main input container - Centered ChatGPT style */}
        <div className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <div className="relative flex items-center gap-3 px-4 py-3 bg-[var(--bg-secondary)]/90 border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl">
            {/* Block palette toggle button on the left */}
            <button
              onClick={togglePalette}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shrink-0"
              title="Toggle Block Palette"
            >
              <Blocks className="w-5 h-5" />
            </button>

            {/* Import button */}
            <label className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shrink-0">
              <Plus className="w-5 h-5" />
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.docx"
                onChange={(e) => {
                  // Handle file import
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log("Importing:", file.name);
                  }
                }}
              />
            </label>

            {/* Divider */}
            <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

            {/* Text input */}
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (aiPrompt.trim() && !isGenerating) {
                    generateBlocks();
                  }
                }
              }}
              placeholder="Describe your guardrail logic..."
              className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />

            {/* Submit button on the right */}
            <button
              onClick={generateBlocks}
              disabled={isGenerating || !aiPrompt.trim()}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0",
                aiPrompt.trim() && !isGenerating
                  ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-[var(--accent-primary)]/40 hover:scale-105"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
