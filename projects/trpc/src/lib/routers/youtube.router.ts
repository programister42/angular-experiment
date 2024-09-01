import {
  type CreateAWSLambdaContextOptions,
  awsLambdaRequestHandler,
} from '@trpc/server/adapters/aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { z } from 'zod';
import { youtube } from '@googleapis/youtube';
import { publicProcedure, router } from '../trpc';

const youtubeApi = youtube({
  version: 'v3',
  auth: process.env['YOUTUBE_API_KEY'] as string,
});

export const youtubeRouter = router({
  searchVideos: publicProcedure
    .input(z.object({ q: z.string() }))
    .query(async ({ input }) => {
      const { q } = input;

      const videosResponse = await youtubeApi.search.list({
        q,
        part: ['snippet'],
        type: ['video'],
      });

      return (
        videosResponse.data?.items?.map((video) => ({
          id: video.id?.videoId,
          title: video.snippet?.title,
          description: video.snippet?.description,
          thumbnail: video.snippet?.thumbnails?.default?.url,
        })) ?? []
      );
    }),
});

// created for each request
const createContext = ({
  event,
  context,
}: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;

export const handler = awsLambdaRequestHandler({
  router: youtubeRouter,
  createContext,
});
