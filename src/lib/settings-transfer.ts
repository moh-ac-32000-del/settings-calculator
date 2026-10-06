import {
  CalculationMode,
  SETTINGS_SCHEMA_VERSION,
  Material,
  Section,
  SettingsState,
  ShippingExpenseSetting,
  WorkType,
  normalizeShippingExpenses,
} from './settings-store';

export type SettingsTransferFile = {
  schemaVersion: number;
  materials: Material[];
  sections: Section[];
  workTypes: WorkType[];
  shippingExpenses: ShippingExpenseSetting[];
};

const calculationModes: CalculationMode[] = ['SELECT_ONE_MULTIPLY', 'SUM_SELECTED_MULTIPLY'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function assertUniqueIds(items: Array<{ id: string }>, label: string) {
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`يوجد معرّف مكرر في ${label}.`);
  }
}

export function createSettingsTransferFile(state: SettingsState): SettingsTransferFile {
  return {
    schemaVersion: state.schemaVersion,
    materials: state.materials.map(({ id, name, price }) => ({ id, name, price })),
    sections: state.sections.map(({ id, name, calculationMode, materialIds }) => ({ id, name, calculationMode, materialIds: [...materialIds] })),
    workTypes: state.workTypes.map(({ id, name, sectionIds }) => ({ id, name, sectionIds: [...sectionIds] })),
    shippingExpenses: state.shippingExpenses.map(({ sectionId, referenceQuantity, referenceCost }) => ({ sectionId, referenceQuantity, referenceCost })),
  };
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function createSettingsCode(state: SettingsState) {
  const json = JSON.stringify(createSettingsTransferFile(state));
  return `SC1.${encodeBase64(new TextEncoder().encode(json))}`;
}

export function validateSettingsTransferFile(value: unknown): SettingsState {
  if (!isRecord(value) || !hasOnlyKeys(value, ['schemaVersion', 'materials', 'sections', 'workTypes', 'shippingExpenses'])) {
    throw new Error('صيغة ملف الإعدادات غير صحيحة.');
  }
  if (value.schemaVersion !== 2 && value.schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    throw new Error(`إصدار ملف الإعدادات غير مدعوم. الإصدار المطلوب هو ${SETTINGS_SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(value.materials) || !Array.isArray(value.sections) || !Array.isArray(value.workTypes)) {
    throw new Error('يجب أن يحتوي الملف على المواد والأقسام وأنواع الأعمال.');
  }

  const materials: Material[] = [];
  for (const item of value.materials) {
    if (!isRecord(item) || !hasOnlyKeys(item, ['id', 'name', 'price']) || !isNonEmptyString(item.id) || !isNonEmptyString(item.name) || typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) {
      throw new Error('توجد مادة غير صالحة في الملف.');
    }
    materials.push({ id: item.id, name: item.name, price: item.price });
  }
  assertUniqueIds(materials, 'المواد');
  const materialIds = new Set(materials.map((material) => material.id));

  const sections: Section[] = [];
  for (const item of value.sections) {
    if (!isRecord(item) || !hasOnlyKeys(item, ['id', 'name', 'calculationMode', 'materialIds']) || !isNonEmptyString(item.id) || !isNonEmptyString(item.name) || !calculationModes.includes(item.calculationMode as CalculationMode) || !isStringArray(item.materialIds) || new Set(item.materialIds).size !== item.materialIds.length || item.materialIds.some((id) => !materialIds.has(id))) {
      throw new Error('توجد علاقة مواد غير صالحة داخل الأقسام.');
    }
    sections.push({ id: item.id, name: item.name, calculationMode: item.calculationMode as CalculationMode, materialIds: [...item.materialIds] });
  }
  assertUniqueIds(sections, 'الأقسام');
  const sectionIds = new Set(sections.map((section) => section.id));

  const workTypes: WorkType[] = [];
  for (const item of value.workTypes) {
    if (!isRecord(item) || !hasOnlyKeys(item, ['id', 'name', 'sectionIds']) || !isNonEmptyString(item.id) || !isNonEmptyString(item.name) || !isStringArray(item.sectionIds) || new Set(item.sectionIds).size !== item.sectionIds.length || item.sectionIds.some((id) => !sectionIds.has(id))) {
      throw new Error('توجد علاقة أقسام غير صالحة داخل أنواع الأعمال.');
    }
    workTypes.push({ id: item.id, name: item.name, sectionIds: [...item.sectionIds] });
  }
  assertUniqueIds(workTypes, 'أنواع الأعمال');
  const shippingExpenses = value.schemaVersion === 2
    ? []
    : normalizeShippingExpenses(value.shippingExpenses, sections);
  if (value.schemaVersion === SETTINGS_SCHEMA_VERSION && !Array.isArray(value.shippingExpenses)) {
    throw new Error('إعدادات مصاريف الشحن غير صالحة.');
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    materials,
    sections,
    workTypes,
    shippingExpenses,
  };
}

export function parseSettingsTransferFile(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('تعذر قراءة الملف. تأكد من أنه ملف JSON صالح.');
  }
  return validateSettingsTransferFile(parsed);
}

export function parseSettingsCode(code: string) {
  const trimmed = code.trim();
  if (!trimmed.startsWith('SC1.') || trimmed.length <= 4) {
    throw new Error('كود الإعدادات غير صالح.');
  }
  let json: string;
  try {
    json = new TextDecoder().decode(decodeBase64(trimmed.slice(4)));
  } catch {
    throw new Error('كود الإعدادات غير صالح.');
  }
  return parseSettingsTransferFile(json);
}