export default {
  fetch() {
    return new Response('OpenNext worker has not been built yet', { status: 503 });
  },
} satisfies ExportedHandler<CloudflareEnv>;
