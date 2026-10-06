export const SETTINGS_STORAGE_KEY = 'settings-calculator-state';
export const SETTINGS_SCHEMA_VERSION = 3;

export type Material = { id: string; name: string; price: number };
export type CalculationMode = 'SELECT_ONE_MULTIPLY' | 'SUM_SELECTED_MULTIPLY';
export type Section = { id: string; name: string; calculationMode: CalculationMode; materialIds: string[] };
export type WorkType = { id: string; name: string; sectionIds: string[] };
export type ShippingExpenseSetting = { sectionId: string; referenceQuantity: number; referenceCost: number };
export type SettingsState = {
  schemaVersion: number;
  materials: Material[];
  sections: Section[];
  workTypes: WorkType[];
  shippingExpenses: ShippingExpenseSetting[];
};

const starterState: SettingsState = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  materials: [],
  sections: [],
  workTypes: [],
  shippingExpenses: [],
};

export function getStarterState(): SettingsState {
  return JSON.parse(JSON.stringify(starterState)) as SettingsState;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeShippingExpenses(value: unknown, sections: Section[]): ShippingExpenseSetting[] {
  if (!Array.isArray(value)) return [];
  const sectionIds = new Set(sections.map((section) => section.id));
  const seen = new Set<string>();
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
    .filter((item) => {
      const sectionId = item.sectionId;
      const referenceQuantity = item.referenceQuantity;
      const referenceCost = item.referenceCost;
      if (
        typeof sectionId !== 'string'
        || !sectionIds.has(sectionId)
        || seen.has(sectionId)
        || typeof referenceQuantity !== 'number'
        || !Number.isFinite(referenceQuantity)
        || referenceQuantity <= 0
        || typeof referenceCost !== 'number'
        || !Number.isFinite(referenceCost)
        || referenceCost < 0
      ) return false;
      seen.add(sectionId);
      return true;
    })
    .map((item) => ({
      sectionId: item.sectionId as string,
      referenceQuantity: item.referenceQuantity as number,
      referenceCost: item.referenceCost as number,
    }));
}

export function loadSettings(): SettingsState {
  if (typeof window === 'undefined') return getStarterState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '');
    if (
      (parsed?.schemaVersion === 2 || parsed?.schemaVersion === SETTINGS_SCHEMA_VERSION)
      && Array.isArray(parsed.materials)
      && Array.isArray(parsed.sections)
      && Array.isArray(parsed.workTypes)
    ) {
      return {
        ...parsed,
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        shippingExpenses: normalizeShippingExpenses(parsed.shippingExpenses, parsed.sections),
      };
    }
  } catch {
    // A broken local value should not prevent the tool from opening.
  }
  return getStarterState();
}

export function saveSettings(state: SettingsState) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
}