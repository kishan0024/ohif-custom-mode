/** MediScribe API boundary. Tokens are supplied by the host, never by URL. */
import { getLaunchAccessToken } from './launchAuth';
export type BackendReport = {
  id: string;
  study_id: string | null;
  report: string;
  status: string;
  updated_at: string;
};
type Context = { studyId?: string; reportId?: string };
type ReportingConfig = {
  apiBaseUrl?: string;
  getAccessToken?: () => string | Promise<string>;
  resolveStudy?: (uid: string) => Context | undefined;
};
const config = (): ReportingConfig => (window as any).config?.reporting || {};
export const backendEnabled = () => Boolean(config().apiBaseUrl);

export function resolveContext(uid: string): Context {
  const configured = config().resolveStudy?.(uid);
  const params = new URLSearchParams(window.location.search);
  // A URL context applies only to its single, exact DICOM study.
  const uids = params.getAll('StudyInstanceUIDs').flatMap(value => value.split(','));
  if (!configured && (uids.length !== 1 || uids[0] !== uid)) {
    throw new Error('The selected DICOM study does not match this report launch. Reopen the correct study from the main app report.');
  }
  const context = configured || {
    studyId: params.get('studyId') || undefined, reportId: params.get('reportId') || undefined,
  };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!context.studyId && !context.reportId) {
    throw new Error('The viewer launch is missing studyId or reportId. Opening from the OHIF study list supplies only the DICOM UID; use the main app report’s OHIF button.');
  }
  if (context.studyId && !uuid.test(context.studyId)) {
    throw new Error('The viewer launch has an invalid studyId. Supply the backend Study UUID, not the DICOM UID, accession number, or display study ID.');
  }
  if (context.reportId && !uuid.test(context.reportId)) {
    throw new Error('The viewer launch has an invalid reportId. Supply the backend Report UUID.');
  }
  return context;
}
export async function request(path: string, method = 'GET', body?: unknown) {
  const token = await (getLaunchAccessToken() ?? config().getAccessToken?.());
  if (!token) throw new Error('Sign in to MediScribe before loading or saving reports.');
  const base = config().apiBaseUrl;
  if (!base || !base.startsWith('/') || base.startsWith('//')) {
    throw new Error('Reporting requires a same-origin API proxy.');
  }
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      credentials: 'omit',
      redirect: 'error',
    });
  } catch {
    throw new Error('Cannot reach the reporting server. Your unsaved work is still open.');
  }
  if (response.status === 401) throw new Error('Your session expired. Sign in to MediScribe again.');
  if (response.status === 403) throw new Error('Your account or selected clinic cannot access this report.');
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status === false || !payload?.data) {
    throw new Error(`Reporting request failed (${response.status}). Your unsaved work is still open.`);
  }
  return payload.data;
}
function validateReport(report: BackendReport, context: Context) {
  if (context.reportId && report.id !== context.reportId) throw new Error('The server returned a different report than the requested reportId.');
  if (context.studyId && report.study_id !== context.studyId) throw new Error('The report belongs to a different backend study.');
  if (typeof report.report !== 'string' || !report.id ||
      Number.isNaN(Date.parse(report.updated_at))) throw new Error('The server returned an invalid report.');
  return report;
}
export async function loadBackendReport(uid: string): Promise<BackendReport | null> {
  const context = resolveContext(uid);
  if (context.reportId) return validateReport(await request(`/reports/${context.reportId}/`), context);
  const data = await request(`/reports/?study_id=${context.studyId}`);
  if (!Array.isArray(data.reports)) throw new Error('The server returned an invalid report list.');
  // Do not silently choose between multiple report revisions.
  if (data.reports.length > 1) throw new Error('This study has multiple reports. Open a specific report using reportId.');
  return data.reports.length ? validateReport(data.reports[0], context) : null;
}
export async function startBackendReport(uid: string, modality: string): Promise<BackendReport> {
  const context = resolveContext(uid);
  if (context.reportId) {
    return validateReport(await request(`/reports/${context.reportId}/`), context);
  }
  const data = await request('/reports/session/start/', 'POST', {
    study_id: context.studyId, modality: modality === '—' ? '' : modality,
  });
  if (!data.report_id) throw new Error('The server did not return a report session.');
  return validateReport(await request(`/reports/${data.report_id}/`), context);
}
export async function saveBackendReport(uid: string, report: BackendReport, html: string) {
  const context = resolveContext(uid);
  validateReport(report, context);
  if (report.status !== 'draft') throw new Error('This report has been finalized and is read-only.');
  // Recheck status before writing; signing is a separate backend workflow.
  const current = validateReport(await request(`/reports/${report.id}/`), context);
  if (current.status !== 'draft' || current.updated_at !== report.updated_at) {
    throw new Error('This report changed on the server. Reopen it before saving; copy your unsaved text first.');
  }
  return validateReport(await request(`/reports/${report.id}/update/`, 'PATCH', {
    report: html, status: 'draft',
  }), context);
}
