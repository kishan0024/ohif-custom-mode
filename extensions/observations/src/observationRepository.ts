import { request, resolveContext } from '../../reporting/src/backendReports';

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
  list?(uid: string): Promise<ObservationRecord[]>;
}

/** Authenticated backend persistence; errors never fall back to demo success. */
function contextFor(uid: string) {
  const context = resolveContext(uid);
  return {
    study_instance_uid: uid,
    ...(context.studyId ? { study_id: context.studyId } : {}),
    ...(context.reportId ? { report_id: context.reportId } : {}),
  };
}

function recordFrom(data: any, uid: string): ObservationRecord {
  const context = resolveContext(uid);
  if (!data?.id || typeof data.text !== 'string' || data.study_instance_uid !== uid ||
      (context.reportId && data.report_id !== context.reportId) ||
      (context.studyId && data.study_id !== context.studyId) ||
      typeof data.created_at !== 'string' || Number.isNaN(Date.parse(data.created_at))) {
    throw new Error('The server returned an invalid observation.');
  }
  return { id: data.id, text: data.text, studyInstanceUID: uid, recordedAt: data.created_at };
}

export const observationRepository: ObservationRepository = {
  isDemo: false,
  async create(input) {
    const data = await request('/reports/observations/', 'POST', {
      ...contextFor(input.studyInstanceUID), text: input.text,
    });
    return recordFrom(data, input.studyInstanceUID);
  },
  async list(uid) {
    const params = new URLSearchParams({ ...contextFor(uid), page_size: '100' });
    const records: ObservationRecord[] = [];
    let page = 1;
    do {
      params.set('page', String(page));
      const data = await request(`/reports/observations/?${params}`);
      if (!Array.isArray(data.observations)) throw new Error('The server returned an invalid observation list.');
      records.push(...data.observations.map(record => recordFrom(record, uid)));
      if (data.next_page == null) break;
      if (data.next_page !== page + 1) throw new Error('The server returned invalid observation pagination.');
      page = data.next_page;
    } while (true);
    return [...new Map(records.map(record => [record.id, record])).values()];
  },
};
