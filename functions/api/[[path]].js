export async function onRequest(context) {
  // This tells Pages to talk to your Worker internally
  return await context.env.WORKER_API.fetch(context.request);
}