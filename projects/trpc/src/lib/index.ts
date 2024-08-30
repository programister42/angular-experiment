import { router } from './trpc';
import { youtubeRouter } from './routers/youtube.router';

const appRouter = router({
  youtube: youtubeRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
