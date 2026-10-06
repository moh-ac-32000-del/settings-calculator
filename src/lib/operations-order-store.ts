import type { SettingsState } from '@/lib/settings-store';

export const OPERATIONS_ORDER_STORAGE_KEY = 'settings-calculator-operations-order';
export type OperationsOrder = {
  workOrder: string[];
  sectionOrder: string[];
  workSectionOrders: Record<string, string[]>;
};

function normalizeIds(current: string[] | undefined, availableIds: string[]) {
  const available = new Set(availableIds);
  const kept = (Array.isArray(current) ? current : []).filter((id, index, list) => available.has(id) && list.indexOf(id) === index);
  const keptSet = new Set(kept);
  return [...kept, ...availableIds.filter((id) => !keptSet.has(id))];
}

export function normalizeOperationsOrder(order: Partial<OperationsOrder> | null | undefined, settings: SettingsState): OperationsOrder {
  const workOrder = normalizeIds(order?.workOrder, settings.workTypes.map((work) => work.id));
  const sectionOrder = normalizeIds(order?.sectionOrder, settings.sections.map((section) => section.id));
  const rawWorkSectionOrders = order?.workSectionOrders && typeof order.workSectionOrders === 'object'
    ? order.workSectionOrders
    : {};
  const workSectionOrders = Object.fromEntries(
    settings.workTypes
      .filter((work) => Array.isArray(rawWorkSectionOrders[work.id]))
      .map((work) => [work.id, normalizeIds(rawWorkSectionOrders[work.id], work.sectionIds)]),
  );

  return { workOrder, sectionOrder, workSectionOrders };
}

export function getDefaultOperationsOrder(settings: SettingsState): OperationsOrder {
  return normalizeOperationsOrder(undefined, settings);
}

export function loadOperationsOrder(settings: SettingsState): OperationsOrder {
  if (typeof window === 'undefined') return getDefaultOperationsOrder(settings);
  try {
    const parsed = JSON.parse(window.localStorage.getItem(OPERATIONS_ORDER_STORAGE_KEY) ?? '');
    return normalizeOperationsOrder(parsed, settings);
  } catch {
    return getDefaultOperationsOrder(settings);
  }
}

export function saveOperationsOrder(order: OperationsOrder) {
  window.localStorage.setItem(OPERATIONS_ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function getSectionOrderForWork(order: OperationsOrder, workId: string, sectionIds: string[]) {
  const fallbackOrder = order.sectionOrder.filter((id) => sectionIds.includes(id));
  return normalizeIds(order.workSectionOrders[workId] ?? fallbackOrder, sectionIds);
}

export function reconcileOperationsOrderAfterSettingsChange(previousSettings: SettingsState, nextSettings: SettingsState) {
  const current = loadOperationsOrder(nextSettings);
  const previousWorks = new Map(previousSettings.workTypes.map((work) => [work.id, work]));
  const workSectionOrders = { ...current.workSectionOrders };

  for (const work of nextSettings.workTypes) {
    const previousWork = previousWorks.get(work.id);
    if (!previousWork) continue;

    const addedSectionIds = work.sectionIds.filter((id) => !previousWork.sectionIds.includes(id));
    if (addedSectionIds.length === 0) continue;

    const existingOrder = workSectionOrders[work.id]
      ?? current.sectionOrder.filter((id) => previousWork.sectionIds.includes(id));
    workSectionOrders[work.id] = normalizeIds(
      [...existingOrder.filter((id) => !addedSectionIds.includes(id)), ...addedSectionIds],
      work.sectionIds,
    );
  }

  const nextOrder = normalizeOperationsOrder({ ...current, workSectionOrders }, nextSettings);
  saveOperationsOrder(nextOrder);
  return nextOrder;
}