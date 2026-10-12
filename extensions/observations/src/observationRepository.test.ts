import { observationRepository } from './observationRepository';

const reportId = '11111111-1111-1111-1111-111111111111';
const record = { id: 'note', report_id: reportId, study_id: null, study_instance_uid: '1.2.3', text: 'Finding', created_at: '2026-10-12T10:00:00Z' };
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => ({ status: status < 400, data }) });
beforeEach(() => {
  history.replaceState({}, '', `/?StudyInstanceUIDs=1.2.3&reportId=${reportId}`);
  (window as any).config = { reporting: { apiBaseUrl: '/api', getAccessToken: () => 'token' } };
  global.fetch = jest.fn();
});
it('persists text using the shared bearer authentication and report context', async () => {
  (fetch as jest.Mock).mockResolvedValue(response(record));
  expect(observationRepository.isDemo).toBe(false);
  await expect(observationRepository.create({ studyInstanceUID: '1.2.3', text: 'Finding' })).resolves.toMatchObject({ id: 'note', recordedAt: record.created_at });
  expect(fetch).toHaveBeenCalledWith('/api/reports/observations/', expect.objectContaining({
    method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer token' }),
    body: JSON.stringify({ study_instance_uid: '1.2.3', report_id: reportId, text: 'Finding' }),
  }));
});
it('loads all server pages and validates observation identity', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(response({ observations: [record], next_page: 2 }))
    .mockResolvedValueOnce(response({ observations: [{ ...record, id: 'second' }], next_page: null }));
  const rows = await observationRepository.list!('1.2.3');
  expect(rows.map(row => row.id)).toEqual(['note', 'second']);
  expect((fetch as jest.Mock).mock.calls[1][0]).toContain('page=2');
});
it('rejects failed writes and data for a different report or DICOM study', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(response({}, 403))
    .mockResolvedValueOnce(response({ ...record, report_id: 'other' }))
    .mockResolvedValueOnce(response({ ...record, study_instance_uid: '9.9' }));
  const input = { studyInstanceUID: '1.2.3', text: 'Finding' };
  await expect(observationRepository.create(input)).rejects.toThrow('cannot access');
  await expect(observationRepository.create(input)).rejects.toThrow('invalid observation');
  await expect(observationRepository.create(input)).rejects.toThrow('invalid observation');
});
