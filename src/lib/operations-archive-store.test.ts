import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanupOperationsArchive,
  OPERATIONS_ARCHIVE_MAX_AGE_MS,
  OPERATIONS_ARCHIVE_SCHEMA_VERSION,
  OPERATIONS_ARCHIVE_STORAGE_KEY,
  updateOperationInArchive,
  saveOperationToArchive,
} from './operations-archive-store.ts';

function installMemoryStorage() {
  const data = new Map<string, string>();
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
      },
    },
  });
  return {
    data,
    restore() {
      if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow });
    },
  };
}

const operationDraft = {
  name: '  مطبخ منزل أحمد  ',
  workTypeName: 'مطابخ',
  workTypeId: 'kitchens',
  sections: [{
    id: 'section-1',
    name: 'الأبواب',
    quantity: 2,
    materials: [{ id: 'material-1', name: 'خشب', price: 125 }],
    result: 250,
    calculationMode: 'SELECT_ONE_MULTIPLY' as const,
    selectedMaterialIds: ['material-1'],
    availableMaterials: [{ id: 'material-1', name: 'خشب', price: 125 }, { id: 'material-2', name: 'ألمنيوم', price: 200 }],
    shippingReference: { referenceQuantity: 300, referenceCost: 1000 },
  }],
  sectionTotal: 250,
  shipping: {
    amount: 2000,
    automaticAmount: 1667,
    manualAmount: 2000,
    mode: 'manual' as const,
    included: true,
  },
  finalTotal: 2250,
};

test('named operations are saved with a real timestamp and complete independent details', () => {
  const storage = installMemoryStorage();
  try {
    const now = Date.UTC(2026, 8, 24, 12, 30);
    const saved = saveOperationToArchive(operationDraft, now);
    assert.ok(saved);
    assert.equal(saved.name, 'مطبخ منزل أحمد');
    assert.equal(saved.createdAt, now);
    assert.equal(saved.createdAtIso, new Date(now).toISOString());
    assert.equal(saved.sections[0]?.quantity, 2);
    assert.equal(saved.sections[0]?.result, 250);
    assert.equal(saved.sections[0]?.calculationMode, 'SELECT_ONE_MULTIPLY');
    assert.deepEqual(saved.sections[0]?.selectedMaterialIds, ['material-1']);
    assert.equal(saved.sections[0]?.availableMaterials?.length, 2);
    assert.deepEqual(saved.sections[0]?.shippingReference, { referenceQuantity: 300, referenceCost: 1000 });
    assert.equal(saved.workTypeId, 'kitchens');
    assert.equal(saved.shipping.mode, 'manual');
    assert.equal(saved.shipping.amount, 2000);
    assert.equal(saved.finalTotal, 2250);
    const stored = JSON.parse(storage.data.get(OPERATIONS_ARCHIVE_STORAGE_KEY) ?? '{}');
    assert.equal(stored.schemaVersion, OPERATIONS_ARCHIVE_SCHEMA_VERSION);
    assert.equal(stored.records[0].id, saved.id);
  } finally {
    storage.restore();
  }
});

test('operations without a name are not saved', () => {
  const storage = installMemoryStorage();
  try {
    assert.equal(saveOperationToArchive({ ...operationDraft, name: '   ' }, 1000), null);
    assert.equal(storage.data.has(OPERATIONS_ARCHIVE_STORAGE_KEY), false);
  } finally {
    storage.restore();
  }
});

test('editing an archived operation replaces the same record and refreshes its retention timestamp', () => {
  const storage = installMemoryStorage();
  try {
    const originalTime = Date.UTC(2026, 8, 24, 12);
    const saved = saveOperationToArchive(operationDraft, originalTime);
    assert.ok(saved);

    const editedTime = originalTime + 60_000;
    const updated = updateOperationInArchive(saved.id, {
      ...operationDraft,
      sections: [{ ...operationDraft.sections[0], quantity: 3, result: 375 }],
      sectionTotal: 375,
      shipping: { ...operationDraft.shipping, amount: 2100 },
      finalTotal: 2475,
    }, editedTime);

    assert.ok(updated);
    assert.equal(updated.id, saved.id);
    assert.equal(updated.createdAt, editedTime);
    assert.equal(updated.createdAtIso, new Date(editedTime).toISOString());
    assert.equal(updated.sections[0]?.quantity, 3);
    const stored = JSON.parse(storage.data.get(OPERATIONS_ARCHIVE_STORAGE_KEY) ?? '{}');
    assert.equal(stored.records.length, 1);
    assert.equal(stored.records[0].id, saved.id);
    assert.equal(stored.records[0].finalTotal, 2475);
    assert.deepEqual(
      cleanupOperationsArchive(editedTime + OPERATIONS_ARCHIVE_MAX_AGE_MS - 1).map((record) => record.id),
      [saved.id],
    );
    assert.deepEqual(cleanupOperationsArchive(editedTime + OPERATIONS_ARCHIVE_MAX_AGE_MS), []);
  } finally {
    storage.restore();
  }
});

test('archive cleanup removes records older than three days using timestamps and migrates an array', () => {
  const storage = installMemoryStorage();
  try {
    const now = Date.UTC(2026, 8, 24, 12);
    const current = { ...operationDraft, id: 'recent', createdAt: now - OPERATIONS_ARCHIVE_MAX_AGE_MS + 1, createdAtIso: 'not-used-for-expiry' };
    const expired = { ...operationDraft, id: 'expired', createdAt: now - OPERATIONS_ARCHIVE_MAX_AGE_MS, createdAtIso: new Date(now).toISOString() };
    storage.data.set(OPERATIONS_ARCHIVE_STORAGE_KEY, JSON.stringify([expired, current]));

    const records = cleanupOperationsArchive(now);
    assert.deepEqual(records.map((record) => record.id), ['recent']);
    const migrated = JSON.parse(storage.data.get(OPERATIONS_ARCHIVE_STORAGE_KEY) ?? '{}');
    assert.equal(migrated.schemaVersion, OPERATIONS_ARCHIVE_SCHEMA_VERSION);
    assert.deepEqual(migrated.records.map((record: { id: string }) => record.id), ['recent']);
  } finally {
    storage.restore();
  }
});