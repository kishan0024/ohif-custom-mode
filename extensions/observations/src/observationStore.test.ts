import { createObservationStore, MAX_OBSERVATION_LENGTH } from './observationStore';

const record = {
  id: '1',
  studyInstanceUID: 'study-a',
  text: 'Finding',
  recordedAt: '2026-01-01T12:00:00Z',
};

test('submits trimmed text with the study UID, then confirms and clears the draft', async () => {
  const create = jest.fn().mockResolvedValue(record);
  const store = createObservationStore({ isDemo: true, create });
  store.setDraft('study-a', ' Finding ');
  await store.submit('study-a');
  expect(create).toHaveBeenCalledWith({ studyInstanceUID: 'study-a', text: 'Finding' });
  expect(store.getSnapshot('study-a')).toMatchObject({
    draft: '',
    records: [record],
    confirmation: 'Observation recorded',
    submitting: false,
  });
});

test.each(['', '  \n ', 'x'.repeat(MAX_OBSERVATION_LENGTH + 1)])(
  'rejects invalid observation text',
  async draft => {
    const create = jest.fn();
    const store = createObservationStore({ isDemo: true, create });
    store.setDraft('study-a', draft);
    await store.submit('study-a');
    expect(create).not.toHaveBeenCalled();
    expect(store.getSnapshot('study-a').error).toBeTruthy();
  }
);

test('requires a study', async () => {
  const create = jest.fn();
  const store = createObservationStore({ isDemo: true, create });
  store.setDraft('', 'Finding');
  await store.submit('');
  expect(create).not.toHaveBeenCalled();
});

test('retains the draft on failure and supports a successful retry', async () => {
  const create = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(record);
  const store = createObservationStore({ isDemo: false, create });
  store.setDraft('study-a', 'Finding');
  await store.submit('study-a');
  expect(store.getSnapshot('study-a')).toMatchObject({
    draft: 'Finding',
    records: [],
    submitting: false,
    confirmation: null,
  });
  expect(store.getSnapshot('study-a').error).toContain('Try again');
  await store.submit('study-a');
  expect(store.getSnapshot('study-a').records).toEqual([record]);
});

test('prevents duplicate submissions and keeps late responses with the original study', async () => {
  let finish;
  const create = jest.fn(
    () =>
      new Promise<typeof record>(resolve => {
        finish = resolve;
      })
  );
  const store = createObservationStore({ isDemo: true, create });
  store.setDraft('study-a', 'Finding');
  const pending = store.submit('study-a');
  await store.submit('study-a');
  store.setDraft('study-b', 'Other study');
  expect(create).toHaveBeenCalledTimes(1);
  finish(record);
  await pending;
  expect(store.getSnapshot('study-a').records).toEqual([record]);
  expect(store.getSnapshot('study-b')).toMatchObject({
    draft: 'Other study',
    records: [],
    confirmation: null,
  });
});

test('reloads persisted records and keeps a concurrent submission', async () => {
  let finish;
  const list = jest.fn(() => new Promise<any>(resolve => { finish = resolve; }));
  const store = createObservationStore({ isDemo: false, list, create: jest.fn().mockResolvedValue(record) });
  const pending = store.load('study-a');
  store.setDraft('study-a', 'Finding');
  await store.submit('study-a');
  finish([{ ...record, id: 'older', recordedAt: '2025-01-01T00:00:00Z' }]);
  await pending;
  expect(store.getSnapshot('study-a').records.map(item => item.id)).toEqual(['1', 'older']);
  const fresh = createObservationStore({ isDemo: false, list: async () => [record], create: jest.fn() });
  await fresh.load('study-a');
  expect(fresh.getSnapshot('study-a').records).toEqual([record]);
});

test('history failures preserve text and can be retried', async () => {
  const list = jest.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([record]);
  const store = createObservationStore({ isDemo: false, list, create: jest.fn() });
  store.setDraft('study-a', 'Unsaved');
  await store.load('study-a');
  expect(store.getSnapshot('study-a')).toMatchObject({ draft: 'Unsaved', loadError: 'Offline' });
  await store.load('study-a');
  expect(store.getSnapshot('study-a')).toMatchObject({ records: [record], loadError: null });
});
