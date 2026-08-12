export function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 1) }] };
}

export function fail(message: string, fixes: string[] = []) {
  return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ error: message, fixes }, null, 1) }] };
}

export async function guard(fn: () => Promise<ReturnType<typeof ok>>) {
  try {
    return await fn();
  } catch (e: unknown) {
    const err = e as Error & { fixes?: string[] };
    return fail(err.message, err.fixes ?? []);
  }
}
