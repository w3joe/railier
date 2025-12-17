interface Guardrail {
  id: string;
  name: string;
  description: string;
  graph: {
    nodes: unknown[];
    edges: unknown[];
  };
  status: "draft" | "active";
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "railier_guardrails";

export const guardrailStorage = {
  // Get all guardrails
  getAll(): Guardrail[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Get guardrail by ID
  getById(id: string): Guardrail | null {
    const guardrails = this.getAll();
    return guardrails.find((g) => g.id === id) || null;
  },

  // Create new guardrail
  create(
    data: Omit<Guardrail, "id" | "createdAt" | "updatedAt" | "status">
  ): Guardrail {
    const guardrails = this.getAll();
    const newGuardrail: Guardrail = {
      ...data,
      id: `gr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    guardrails.push(newGuardrail);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guardrails));
    return newGuardrail;
  },

  // Update guardrail
  update(
    id: string,
    data: Partial<Omit<Guardrail, "id" | "createdAt">>
  ): Guardrail | null {
    const guardrails = this.getAll();
    const index = guardrails.findIndex((g) => g.id === id);
    if (index === -1) return null;

    guardrails[index] = {
      ...guardrails[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guardrails));
    return guardrails[index];
  },

  // Delete guardrail
  delete(id: string): boolean {
    const guardrails = this.getAll();
    const filtered = guardrails.filter((g) => g.id !== id);
    if (filtered.length === guardrails.length) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },
};
