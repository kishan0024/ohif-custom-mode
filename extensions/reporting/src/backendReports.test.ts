import { loadBackendReport, saveBackendReport, startBackendReport, resolveContext } from './backendReports';
const studyId = '11111111-1111-1111-1111-111111111111';
const report = { id: '22222222-2222-2222-2222-222222222222', study_id: studyId, report: '<p>Draft</p>', status: 'draft', updated_at: '2026-10-06T10:00:00Z' };
const reply = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => ({ status: status < 400, data }) });
beforeEach(() => {
  (window as any).config = { reporting: { apiBaseUrl: '/api', getAccessToken: () => 'test-token', resolveStudy: () => ({ studyId }) } };
  global.fetch = jest.fn();
});
it('loads reports through authenticated requests scoped to the backend UUID', async () => {
  (fetch as jest.Mock).mockResolvedValue(reply({ reports: [report] }));
  expect(await loadBackendReport('dicom-uid')).toEqual(report);
  expect(fetch).toHaveBeenCalledWith(`/api/reports/?study_id=${studyId}`, expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }));
});
it('rejects another study report and ambiguous revisions', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(reply({ reports: [{ ...report, study_id: 'other' }] })).mockResolvedValueOnce(reply({ reports: [report, report] }));
  await expect(loadBackendReport('uid')).rejects.toThrow('different backend study');
  await expect(loadBackendReport('uid')).rejects.toThrow('multiple reports');
});
it('never applies a URL study mapping to another DICOM study', () => {
  delete (window as any).config.reporting.resolveStudy;
  history.replaceState({}, '', `/?StudyInstanceUIDs=one&studyId=${studyId}`);
  expect(resolveContext('one').studyId).toBe(studyId);
  expect(() => resolveContext('two')).toThrow('valid studyId');
});
it('does not send requests without authentication', async () => {
  delete (window as any).config.reporting.getAccessToken;
  await expect(loadBackendReport('uid')).rejects.toThrow('Sign in');
  expect(fetch).not.toHaveBeenCalled();
});
it('retains draft status and sends HTML on save', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(reply(report)).mockResolvedValueOnce(reply(report));
  await saveBackendReport('uid', report, '<p>Updated</p>');
  expect(fetch).toHaveBeenLastCalledWith(`/api/reports/${report.id}/update/`, expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ report: '<p>Updated</p>', status: 'draft' }) }));
});
it('refuses finalized or concurrently changed reports', async () => {
  await expect(saveBackendReport('uid', { ...report, status: 'reported' }, 'text')).rejects.toThrow('read-only');
  expect(fetch).not.toHaveBeenCalled();
  (fetch as jest.Mock).mockResolvedValue(reply({ ...report, updated_at: '2026-10-06T11:00:00Z' }));
  await expect(saveBackendReport('uid', report, 'text')).rejects.toThrow('changed on the server');
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('starts a draft session instead of using the finalized-report creation endpoint', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(reply({ report_id: report.id })).mockResolvedValueOnce(reply(report));
  await expect(startBackendReport('uid', 'CT')).resolves.toEqual(report);
  expect(fetch).toHaveBeenNthCalledWith(1, '/api/reports/session/start/', expect.objectContaining({ method: 'POST', body: JSON.stringify({ study_id: studyId, modality: 'CT' }) }));
});
it('reports expired credentials and network failures', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(reply({}, 401)).mockRejectedValueOnce(new Error('offline'));
  await expect(loadBackendReport('uid')).rejects.toThrow('session expired');
  await expect(loadBackendReport('uid')).rejects.toThrow('Cannot reach');
});
