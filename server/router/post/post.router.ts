import { authProcedure, devProcedure, procedure, router } from "@/server/trpc";
import { z } from "zod";
import {
  createPost,
  deletePost,
  getDetailedPost,
  getFeedByCategory,
  getPostReportedReasons,
  getReportedPost,
  getUserPosts,
  reportPost,
  safePost,
  takeDown,
  updatePost,
} from "./post.service";

export const postRouter = router({
  getFeedByCategory: procedure
    .input(z.object({ categoryId: z.enum(["1", "2"]) }))
    .query(
      async ({ ctx, input }) =>
        await getFeedByCategory(ctx.prisma, input.categoryId),
    ),
  getPostReportedReasons: devProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) =>
      getPostReportedReasons(ctx.prisma, input.postId),
    ),
  getReportedPost: devProcedure.query(async ({ ctx }) =>
    getReportedPost(ctx.prisma),
  ),
  getUserPosts: authProcedure
    .input(
      z.object({
        withAnonymousPosts: z.boolean().default(false),
        withComments: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) =>
      getUserPosts(
        ctx.prisma,
        ctx.user.id,
        input.withAnonymousPosts,
        input.withComments,
      ),
    ),
  getDetailedPost: procedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => getDetailedPost(ctx.prisma, input.postId)),
  createPost: authProcedure
    .input(
      z.object({
        content: z.string(),
        categoryId: z.enum(["1", "2"]),
        isAnonymousPost: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Omit<typeof input, "isAnonymousPost"> & { userId: string } = {
        ...input,
        userId: ctx.user.id,
        categoryId: ctx.user.Role.name === "developer" ? input.categoryId : "1",
      };

      return createPost(ctx.prisma, data, input.isAnonymousPost);
    }),
  updatePost: authProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string(),
        categoryId: z.enum(["1", "2"]),
        visibilityTo: z.enum(["anonymous", "public"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Omit<typeof input, "postId" | "visibilityTo"> & {
        userId: string;
      } = {
        ...input,
        userId: ctx.user.id,
      };

      return updatePost(ctx.prisma, input.postId, data, input.visibilityTo);
    }),
  deletePost: authProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => deletePost(ctx.prisma, input.postId)),
  reportPost: authProcedure
    .input(
      z.object({
        postId: z.string(),
        reason: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      reportPost(ctx.prisma, input.postId, input.reason),
    ),
  safePost: devProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => safePost(ctx.prisma, input.postId)),
  takeDown: devProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => takeDown(ctx.prisma, input.postId)),
});
