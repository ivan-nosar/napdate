const RETRIES = 3;

export async function latestVersion(name: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        if (response.status !== 429 && response.status < 500) {
          throw new PermanentError(`Registry returned HTTP ${response.status}`);
        }
        throw new Error(`Registry returned HTTP ${response.status}`);
      }
      const data: unknown = await response.json();
      const version = typeof data === 'object' && data !== null && 'version' in data ? data.version : undefined;
      if (typeof version !== 'string' || !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
        throw new PermanentError('Registry returned an invalid version');
      }
      return version;
    } catch (error) {
      lastError = error;
      if (error instanceof PermanentError || attempt === RETRIES) break;
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
  }
  throw new Error(`Unable to resolve ${name}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

class PermanentError extends Error {}
