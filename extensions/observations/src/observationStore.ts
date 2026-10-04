import {
  observationRepository,
  type ObservationRecord,
  type ObservationRepository,
} from './observationRepository';

export const MAX_OBSERVATION_LENGTH = 10000;

type StudyState = {
  draft: string;
  records: ObservationRecord[];
  submitting: boolean;
  error: string | null;
  confirmation: string | null;
};

/** Session memory only. Refreshing the page discards drafts and demo records. */
export function createObservationStore(repository: ObservationRepository) {
  const studies = new Map<string, StudyState>();
  const listeners = new Set<() => void>();

  function getSnapshot(uid: string): StudyState {
    if (!studies.has(uid)) {
      studies.set(uid, {
        draft: '',
        records: [],
        submitting: false,
        error: null,
        confirmation: null,
      });
    }
    return studies.get(uid)!;
  }

  function update(uid: string, changes: Partial<StudyState>) {
    studies.set(uid, { ...getSnapshot(uid), ...changes });
    listeners.forEach(listener => listener());
  }

  return {
    isDemo: repository.isDemo,
    getSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setDraft(uid: string, draft: string) {
      if (getSnapshot(uid).submitting) return;
      update(uid, { draft, error: null, confirmation: null });
    },
    async submit(uid: string) {
      const state = getSnapshot(uid);
      if (state.submitting) return;
      const text = state.draft.trim();
      if (!uid || !text || text.length > MAX_OBSERVATION_LENGTH) {
        update(uid, {
          error: !uid
            ? 'Open a study before recording an observation.'
            : !text
              ? 'Write an observation before submitting.'
              : `Keep the observation within ${MAX_OBSERVATION_LENGTH.toLocaleString()} characters.`,
        });
        return;
      }

      update(uid, { submitting: true, error: null, confirmation: null });
      try {
        const record = await repository.create({ studyInstanceUID: uid, text });
        update(uid, {
          records: [record, ...getSnapshot(uid).records],
          draft: '',
          submitting: false,
          confirmation: 'Observation recorded',
        });
      } catch {
        update(uid, {
          submitting: false,
          error: 'The observation could not be recorded. Your text is still here. Try again.',
        });
      }
    },
  };
}

export const observationStore = createObservationStore(observationRepository);
