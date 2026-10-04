export type ObservationInput = {
  studyInstanceUID: string;
  text: string;
};

export type ObservationRecord = ObservationInput & {
  id: string;
  recordedAt: string;
};

export interface ObservationRepository {
  readonly isDemo: boolean;
  create(input: ObservationInput): Promise<ObservationRecord>;
}

/**
 * Integration boundary: replace this adapter once the database API is supplied.
 * A real create() must reject non-success HTTP responses and return the server's
 * ID and timestamp. Do not fall back to demo success when an API request fails.
 * There is deliberately no localStorage, IndexedDB, or browser persistence.
 */
export const observationRepository: ObservationRepository = {
  isDemo: true,
  async create(input) {
    await new Promise(resolve => setTimeout(resolve, 350));
    return {
      ...input,
      id: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
    };
  },
};
