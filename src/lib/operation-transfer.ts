import type { CalculationMode } from '@/lib/settings-store';

export type TransferSection = {
  id: string;
  name: string;
  calculationMode: CalculationMode;
  materialIds: string[];
};

export type TransferEntry = {
  sectionId: string;
  quantity: string;
  selectedMaterialIds: string[];
};

export type TransferIssue =
  | { type: 'incompatible'; position: number; sourceName: string; targetName: string }
  | { type: 'missing-target'; position: number; sourceName: string }
  | { type: 'material'; position: number; targetName: string; fallback: boolean };

export type TransferResult = {
  entries: TransferEntry[];
  issues: TransferIssue[];
  unfilledTargetPositions: number[];
};

export function transferEntriesByPosition({
  sourceSectionIds,
  targetSectionIds,
  sectionsById,
  entries,
}: {
  sourceSectionIds: string[];
  targetSectionIds: string[];
  sectionsById: ReadonlyMap<string, TransferSection>;
  entries: TransferEntry[];
}): TransferResult {
  const entryBySectionId = new Map(entries.map((entry) => [entry.sectionId, entry]));
  const transferredEntries: TransferEntry[] = [];
  const issues: TransferIssue[] = [];
  const sharedPositions = Math.min(sourceSectionIds.length, targetSectionIds.length);

  for (let index = 0; index < sharedPositions; index += 1) {
    const sourceId = sourceSectionIds[index];
    const targetId = targetSectionIds[index];
    const sourceSection = sectionsById.get(sourceId);
    const targetSection = sectionsById.get(targetId);
    const sourceEntry = entryBySectionId.get(sourceId);
    if (!sourceSection || !targetSection || !sourceEntry) continue;

    if (sourceSection.calculationMode !== targetSection.calculationMode) {
      issues.push({
        type: 'incompatible',
        position: index + 1,
        sourceName: sourceSection.name,
        targetName: targetSection.name,
      });
      continue;
    }

    const targetMaterialIds = new Set(targetSection.materialIds);
    const selectedMaterialIds = sourceEntry.selectedMaterialIds.filter((id) => targetMaterialIds.has(id));
    let destinationMaterialIds = selectedMaterialIds;

    if (targetSection.calculationMode === 'SELECT_ONE_MULTIPLY') {
      if (sourceEntry.selectedMaterialIds.length > 0 && selectedMaterialIds.length === 0) {
        const fallbackMaterialId = targetSection.materialIds[0];
        destinationMaterialIds = fallbackMaterialId ? [fallbackMaterialId] : [];
        issues.push({
          type: 'material',
          position: index + 1,
          targetName: targetSection.name,
          fallback: Boolean(fallbackMaterialId),
        });
      } else if (selectedMaterialIds.length > 1) {
        destinationMaterialIds = selectedMaterialIds.slice(0, 1);
      }
    } else if (sourceEntry.selectedMaterialIds.length > 0 && selectedMaterialIds.length === 0) {
      issues.push({
        type: 'material',
        position: index + 1,
        targetName: targetSection.name,
        fallback: false,
      });
    }

    transferredEntries.push({
      sectionId: targetId,
      quantity: sourceEntry.quantity,
      selectedMaterialIds: destinationMaterialIds,
    });
  }

  for (let index = targetSectionIds.length; index < sourceSectionIds.length; index += 1) {
    const sourceSection = sectionsById.get(sourceSectionIds[index]);
    if (sourceSection) {
      issues.push({
        type: 'missing-target',
        position: index + 1,
        sourceName: sourceSection.name,
      });
    }
  }

  return {
    entries: transferredEntries,
    issues,
    unfilledTargetPositions: Array.from(
      { length: Math.max(0, targetSectionIds.length - sourceSectionIds.length) },
      (_, index) => sourceSectionIds.length + index + 1,
    ),
  };
}