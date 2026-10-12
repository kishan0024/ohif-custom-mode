import { getLaunchAccessToken } from './launchAuth';

const origin = 'http://localhost:3000';
let opener: { closed: boolean; postMessage: jest.Mock };
beforeEach(() => {
  jest.useFakeTimers();
  history.replaceState({}, '', '/?launchId=launch&appOrigin=http%3A%2F%2Flocalhost%3A3000');
  (window as any).config = { reporting: { allowedAppOrigins: [origin] } };
  opener = { closed: false, postMessage: jest.fn() };
  Object.defineProperty(window, 'opener', { configurable: true, value: opener });
  Object.defineProperty(window.crypto, 'randomUUID', { configurable: true, value: () => 'request' });
});
afterEach(() => {
  jest.useRealTimers();
  history.replaceState({}, '', '/');
  Object.defineProperty(window, 'opener', { configurable: true, value: null });
});
function reply(overrides: any = {}) {
  window.dispatchEvent(new MessageEvent('message', {
    origin, source: opener as any,
    data: { type: 'mediscribe:viewer-auth-response', launchId: 'launch', requestId: 'request', accessToken: 'secret' },
    ...overrides,
  }));
}
it('requests a token from the exact opener and trusted origin', async () => {
  const result = getLaunchAccessToken();
  expect(opener.postMessage).toHaveBeenCalledWith({ type: 'mediscribe:viewer-auth-request', launchId: 'launch', requestId: 'request' }, origin);
  reply();
  await expect(result).resolves.toBe('secret');
  expect(jest.getTimerCount()).toBe(0);
});
it('ignores wrong origins, windows, launches, and request IDs', async () => {
  const result = getLaunchAccessToken();
  reply({ origin: 'https://untrusted.example' });
  reply({ source: window });
  reply({ data: { type: 'mediscribe:viewer-auth-response', launchId: 'other', requestId: 'request', accessToken: 'secret' } });
  reply({ data: { type: 'mediscribe:viewer-auth-response', launchId: 'launch', requestId: 'old', accessToken: 'secret' } });
  const rejection = expect(result).rejects.toThrow('did not respond');
  jest.advanceTimersByTime(10000);
  await rejection;
});
it('identifies a missing runtime allowlist', async () => {
  (window as any).config.reporting.allowedAppOrigins = [];
  await expect(getLaunchAccessToken()).rejects.toThrow('loaded viewer config');
  expect(opener.postMessage).not.toHaveBeenCalled();
});
it('requires the full exact origin rather than just a port', async () => {
  history.replaceState({}, '', '/?launchId=launch&appOrigin=3000');
  await expect(getLaunchAccessToken()).rejects.toThrow('exact scheme, hostname, and port');
  expect(opener.postMessage).not.toHaveBeenCalled();
});
it('identifies a missing appOrigin', async () => {
  history.replaceState({}, '', '/?launchId=launch');
  await expect(getLaunchAccessToken()).rejects.toThrow('missing appOrigin');
});
it('identifies a missing opener even when localhost:3000 is allowed', async () => {
  Object.defineProperty(window, 'opener', { configurable: true, value: null });
  await expect(getLaunchAccessToken()).rejects.toThrow('window.opener');
  expect(opener.postMessage).not.toHaveBeenCalled();
});
it('identifies a closed main-app window', async () => {
  opener.closed = true;
  await expect(getLaunchAccessToken()).rejects.toThrow('window.opener');
  expect(opener.postMessage).not.toHaveBeenCalled();
});
it('rejects invalidated main-app sessions', async () => {
  const result = getLaunchAccessToken();
  reply({ data: { type: 'mediscribe:viewer-auth-response', launchId: 'launch', requestId: 'request', accessToken: null } });
  await expect(result).rejects.toThrow('session changed');
});
it('leaves standalone token providers available', () => {
  history.replaceState({}, '', '/');
  expect(getLaunchAccessToken()).toBeUndefined();
});
