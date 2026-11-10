globalThis.fetch = async (url) => {
  if (url.includes('/missing/')) return new Response('', { status: 404 });
  return Response.json({ version: url.includes('foo') ? '3.2.1' : '4.0.0' });
};
