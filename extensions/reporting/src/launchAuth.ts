/** Request credentials from the exact main-app window that launched this viewer. */
export function getLaunchAccessToken(): Promise<string> | undefined {
  const params = new URLSearchParams(window.location.search);
  const launchId = params.get('launchId');
  if (!launchId) return undefined; // Keep manually configured standalone sessions working.
  const origin = params.get('appOrigin');
  const allowed = (window as any).config?.reporting?.allowedAppOrigins || [];
  const opener = window.opener;
  if (!origin) {
    return Promise.reject(new Error('The viewer URL is missing appOrigin. Reopen it using the main app report button.'));
  }
  if (!Array.isArray(allowed) || allowed.length === 0) {
    return Promise.reject(new Error('The loaded viewer config has no reporting.allowedAppOrigins. Load the observations config and restart the viewer.'));
  }
  if (!allowed.includes(origin)) {
    return Promise.reject(new Error(`The main-app origin "${origin}" is not in reporting.allowedAppOrigins. Configure the exact scheme, hostname, and port.`));
  }
  if (!opener || opener.closed) {
    return Promise.reject(new Error('The viewer has no open main-app window (window.opener). Open it using the report button, keep that tab open, and check that browser opener policies permit the connection.'));
  }
  return new Promise((resolve, reject) => {
    const requestId = window.crypto.randomUUID();
    const cleanup = () => {
      window.removeEventListener('message', receive);
      window.clearTimeout(timeout);
    };
    const receive = (event: MessageEvent) => {
      const data = event.data;
      if (event.origin !== origin || event.source !== opener ||
          data?.type !== 'mediscribe:viewer-auth-response' ||
          data.launchId !== launchId || data.requestId !== requestId) return;
      cleanup();
      if (typeof data.accessToken !== 'string' || !data.accessToken) {
        reject(new Error('Your main-app session changed. Reopen the viewer from the report.'));
      } else {
        resolve(data.accessToken);
      }
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('The main app did not respond. Reopen the viewer from the report.'));
    }, 10000);
    window.addEventListener('message', receive);
    opener.postMessage({ type: 'mediscribe:viewer-auth-request', launchId, requestId }, origin);
  });
}
