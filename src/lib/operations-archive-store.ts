export const OPERATIONS_ARCHIVE_STORAGE_KEY = 'settings-calculator-archive';
export const OPERATIONS_ARCHIVE_SCHEMA_VERSION = 2;
export type ArchiveRetention = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '30' | 'permanent';
export const ARCHIVE_RETENTION_STORAGE_KEY = 'settings-calculator-archive-retention';
export const DEFAULT_ARCHIVE_RETENTION: ArchiveRetention = '3';
const DAY_MS = 24 * 60 * 60 * 1000;

export function loadArchiveRetention(): ArchiveRetention {
  if (typeof window === 'undefined') return DEFAULT_ARCHIVE_RETENTION;
  const value = window.localStorage.getItem(ARCHIVE_RETENTION_STORAGE_KEY);
  return value === '1' || value === '2' || value === '3' || value === '4' || value === '5'
    || value === '6' || value === '7' || value === '30' || value === 'permanent'
    ? value : DEFAULT_ARCHIVE_RETENTION;
}

export function saveArchiveRetention(value: ArchiveRetention) {
  if (typeof window !== 'undefined') window.localStorage.setItem(ARCHIVE_RETENTION_STORAGE_KEY, value);
}

export function getArchiveRetentionDurationMs(value = loadArchiveRetention()): number | null {
  return value === 'permanent' ? null : Number(value) * DAY_MS;
}

export function getArchiveRetentionLabelKey(value = loadArchiveRetention()) {
  return value === 'permanent' ? 'archiveRetentionPermanent'
    : value === '30' ? 'archiveRetentionMonth'
      : 'archiveRetentionDays';
}

export type ArchivedMaterial = {
  id: string;
  name: string;
  price: number;
};

export type ArchivedSection = {
  id: string;
  name: string;
  quantity: number;
  materials: ArchivedMaterial[];
  result: number;
  calculationMode?: 'SELECT_ONE_MULTIPLY' | 'SUM_SELECTED_MULTIPLY';
  selectedMaterialIds?: string[];
  availableMaterials?: ArchivedMaterial[];
  shippingReference?: { referenceQuantity: number; referenceCost: number } | null;
};

export type ArchivedOperationDraft = {
  name: string;
  workTypeName: string | null;
  workTypeId?: string | null;
  sections: ArchivedSection[];
  sectionTotal: number;
  shipping: {
    amount: number;
    automaticAmount: number;
    manualAmount: number;
    mode: 'automatic' | 'manual';
    included: boolean;
  };
  additionalExpenses?: number;
  finalTotal: number;
};

export type ArchivedOperation = ArchivedOperationDraft & {
  id: string;
  createdAt: number;
  createdAtIso: string;
};

type ArchiveEnvelope = {
  schemaVersion: number;
  records: ArchivedOperation[];
};

function isArchivedOperation(value: unknown): value is ArchivedOperation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<ArchivedOperation>;
  const shipping = record.shipping;
  return typeof record.id === 'string'
    && typeof record.name === 'string'
    && typeof record.createdAt === 'number'
    && Number.isFinite(record.createdAt)
    && Number.isFinite(new Date(record.createdAt).getTime())
    && Array.isArray(record.sections)
    && record.sections.every((section) => (
      Boolean(section)
      && typeof section.id === 'string'
      && typeof section.name === 'string'
      && typeof section.quantity === 'number'
      && typeof section.result === 'number'
      && Array.isArray(section.materials)
      && section.materials.every((material) => (
        Boolean(material)
        && typeof material.id === 'string'
        && typeof material.name === 'string'
        && typeof material.price === 'number'
        && Number.isFinite(material.price)
      ))
      && (section.calculationMode === undefined
        || section.calculationMode === 'SELECT_ONE_MULTIPLY'
        || section.calculationMode === 'SUM_SELECTED_MULTIPLY')
      && (section.selectedMaterialIds === undefined
        || (Array.isArray(section.selectedMaterialIds) && section.selectedMaterialIds.every((id) => typeof id === 'string')))
      && (section.availableMaterials === undefined
        || (Array.isArray(section.availableMaterials) && section.availableMaterials.every((material) => (
          Boolean(material)
          && typeof material.id === 'string'
          && typeof material.name === 'string'
          && typeof material.price === 'number'
          && Number.isFinite(material.price)
        ))))
      && (section.shippingReference === undefined
        || section.shippingReference === null
        || (
          typeof section.shippingReference.referenceQuantity === 'number'
          && Number.isFinite(section.shippingReference.referenceQuantity)
          && typeof section.shippingReference.referenceCost === 'number'
          && Number.isFinite(section.shippingReference.referenceCost)
        ))
    ))
    && (record.workTypeId === undefined || record.workTypeId === null || typeof record.workTypeId === 'string')
    && (record.additionalExpenses === undefined || (typeof record.additionalExpenses === 'number' && Number.isFinite(record.additionalExpenses) && record.additionalExpenses >= 0))
    && shipping !== undefined
    && typeof shipping.amount === 'number'
    && typeof shipping.automaticAmount === 'number'
    && typeof shipping.manualAmount === 'number'
    && (shipping.mode === 'automatic' || shipping.mode === 'manual')
    && typeof shipping.included === 'boolean'
    && typeof record.finalTotal === 'number'
    && Number.isFinite(record.finalTotal);
}

function getArchiveState(): { records: ArchivedOperation[]; canWrite: boolean } {
  if (typeof window === 'undefined') return { records: [], canWrite: false };
  try {
    const raw = window.localStorage.getItem(OPERATIONS_ARCHIVE_STORAGE_KEY);
    if (!raw) return { records: [], canWrite: true };
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { records: parsed.filter(isArchivedOperation), canWrite: true };
    }
    if (!parsed || typeof parsed !== 'object') return { records: [], canWrite: true };
    const envelope = parsed as Partial<ArchiveEnvelope>;
    if (typeof envelope.schemaVersion === 'number' && envelope.schemaVersion > OPERATIONS_ARCHIVE_SCHEMA_VERSION) {
      return { records: [], canWrite: false };
    }
    if (!Array.isArray(envelope.records)) return { records: [], canWrite: true };
    return { records: envelope.records.filter(isArchivedOperation), canWrite: true };
  } catch {
    return { records: [], canWrite: true };
  }
}

function persistArchive(records: ArchivedOperation[]) {
  if (typeof window === 'undefined') return;
  const envelope: ArchiveEnvelope = {
    schemaVersion: OPERATIONS_ARCHIVE_SCHEMA_VERSION,
    records,
  };
  window.localStorage.setItem(OPERATIONS_ARCHIVE_STORAGE_KEY, JSON.stringify(envelope));
}

export function cleanupOperationsArchive(now = Date.now()) {
  const state = getArchiveState();
  const duration = getArchiveRetentionDurationMs();
  const records = state.records
    .filter((record) => duration === null || now - record.createdAt < duration)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (state.canWrite) persistArchive(records);
  return records;
}

export function saveOperationToArchive(draft: ArchivedOperationDraft, now = Date.now()) {
  const name = draft.name.trim();
  if (!name) return null;
  const record: ArchivedOperation = {
    ...draft,
    name,
    id: `${now}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: now,
    createdAtIso: new Date(now).toISOString(),
  };
  const records = cleanupOperationsArchive(now);
  persistArchive([record, ...records]);
  return record;
}

export function deleteOperationFromArchive(id: string) {
  const state = getArchiveState();
  if (!state.canWrite) return false;
  const records = state.records.filter((record) => record.id !== id);
  if (records.length === state.records.length) return false;
  persistArchive(records);
  return true;
}

export function deleteAllOperationsFromArchive() {
  const state = getArchiveState();
  if (!state.canWrite) return false;
  persistArchive([]);
  return true;
}

export function getOperationFromArchive(id: string) {
  return cleanupOperationsArchive().find((record) => record.id === id) ?? null;
}

export function updateOperationInArchive(id: string, draft: ArchivedOperationDraft, now = Date.now()) {
  const name = draft.name.trim();
  if (!name) return null;
  const records = cleanupOperationsArchive(now);
  const current = records.find((record) => record.id === id);
  if (!current) return null;
  const updated: ArchivedOperation = {
    ...current,
    ...draft,
    name,
    id: current.id,
    createdAt: now,
    createdAtIso: new Date(now).toISOString(),
  };
  persistArchive(records
    .map((record) => record.id === id ? updated : record)
    .sort((a, b) => b.createdAt - a.createdAt));
  return updated;
}