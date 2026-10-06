import test from 'node:test';
import assert from 'node:assert/strict';
import { transferEntriesByPosition, type TransferSection } from './operation-transfer.ts';
import { getSectionOrderForWork } from './operations-order-store.ts';

const section = (
  id: string,
  name: string,
  calculationMode: TransferSection['calculationMode'] = 'SELECT_ONE_MULTIPLY',
  materialIds: string[] = ['material'],
): TransferSection => ({ id, name, calculationMode, materialIds });

test('transfers data by saved position and leaves extra destination sections empty', () => {
  const sections = new Map([
    ['source-c', section('source-c', 'C')],
    ['source-a', section('source-a', 'A')],
    ['source-b', section('source-b', 'B')],
    ['target-x', section('target-x', 'X')],
    ['target-y', section('target-y', 'Y')],
    ['target-z', section('target-z', 'Z')],
    ['target-w', section('target-w', 'W')],
  ]);
  const savedSourceOrder = getSectionOrderForWork({
    workOrder: ['source-work', 'target-work'],
    sectionOrder: ['source-a', 'source-b', 'source-c', 'target-x', 'target-y', 'target-z', 'target-w'],
    workSectionOrders: { 'source-work': ['source-c', 'source-a', 'source-b'] },
  }, 'source-work', ['source-a', 'source-b', 'source-c']);
  const result = transferEntriesByPosition({
    sourceSectionIds: savedSourceOrder,
    targetSectionIds: ['target-x', 'target-y', 'target-z', 'target-w'],
    sectionsById: sections,
    entries: [
      { sectionId: 'source-a', quantity: '2', selectedMaterialIds: ['material'] },
      { sectionId: 'source-b', quantity: '3', selectedMaterialIds: ['material'] },
      { sectionId: 'source-c', quantity: '1', selectedMaterialIds: ['material'] },
    ],
  });

  assert.deepEqual(result.entries.map(({ sectionId, quantity }) => [sectionId, quantity]), [
    ['target-x', '1'],
    ['target-y', '2'],
    ['target-z', '3'],
  ]);
  assert.deepEqual(result.unfilledTargetPositions, [4]);
  assert.deepEqual(result.issues, []);
});

test('does not move entries between calculation modes, while continuing other positions', () => {
  const sections = new Map([
    ['source-one', section('source-one', 'Source one', 'SUM_SELECTED_MULTIPLY')],
    ['source-two', section('source-two', 'Source two')],
    ['target-one', section('target-one', 'Target one')],
    ['target-two', section('target-two', 'Target two')],
  ]);
  const result = transferEntriesByPosition({
    sourceSectionIds: ['source-one', 'source-two'],
    targetSectionIds: ['target-one', 'target-two'],
    sectionsById: sections,
    entries: [
      { sectionId: 'source-one', quantity: '5', selectedMaterialIds: ['material'] },
      { sectionId: 'source-two', quantity: '7', selectedMaterialIds: ['material'] },
    ],
  });

  assert.deepEqual(result.entries, [
    { sectionId: 'target-two', quantity: '7', selectedMaterialIds: ['material'] },
  ]);
  assert.deepEqual(result.issues, [{
    type: 'incompatible',
    position: 1,
    sourceName: 'Source one',
    targetName: 'Target one',
  }]);
});

test('reports source sections without a target position without merging their data', () => {
  const sections = new Map([
    ['source-one', section('source-one', 'One')],
    ['source-two', section('source-two', 'Two')],
    ['source-three', section('source-three', 'Three')],
    ['target-one', section('target-one', 'Target')],
  ]);
  const result = transferEntriesByPosition({
    sourceSectionIds: ['source-one', 'source-two', 'source-three'],
    targetSectionIds: ['target-one'],
    sectionsById: sections,
    entries: [
      { sectionId: 'source-one', quantity: '1', selectedMaterialIds: ['material'] },
      { sectionId: 'source-two', quantity: '2', selectedMaterialIds: ['material'] },
      { sectionId: 'source-three', quantity: '3', selectedMaterialIds: ['material'] },
    ],
  });

  assert.deepEqual(result.entries.map((entry) => entry.sectionId), ['target-one']);
  assert.deepEqual(result.issues, [
    { type: 'missing-target', position: 2, sourceName: 'Two' },
    { type: 'missing-target', position: 3, sourceName: 'Three' },
  ]);
});

test('uses the destination default material when the selected id does not exist there', () => {
  const sections = new Map([
    ['source', section('source', 'Source', 'SELECT_ONE_MULTIPLY', ['source-material'])],
    ['target', section('target', 'Target', 'SELECT_ONE_MULTIPLY', ['target-default'])],
  ]);
  const result = transferEntriesByPosition({
    sourceSectionIds: ['source'],
    targetSectionIds: ['target'],
    sectionsById: sections,
    entries: [{ sectionId: 'source', quantity: '4', selectedMaterialIds: ['source-material'] }],
  });

  assert.deepEqual(result.entries[0]?.selectedMaterialIds, ['target-default']);
  assert.deepEqual(result.issues, [{
    type: 'material',
    position: 1,
    targetName: 'Target',
    fallback: true,
  }]);
});