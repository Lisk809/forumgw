import { authProcedure, router } from "@/server/trpc";
import {
  acceptOrDeclineInvite,
  createGroup,
  createGroupPost,
  getAllGroupByUser,
  getGroupByPublicId,
  getGroupByQuery,
  getGroupInvitation,
} from "./group.service";
import { z } from "zod";

export const groupRouter = router({
  getAllGroupByUser: authProcedure.query(
    async ({ ctx }) => await getAllGroupByUser(ctx.prisma, ctx.user.id),
  ),
  createGroup: authProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        invitedUsername: z.array(z.string()).nullable(),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await createGroup(ctx.prisma, input, ctx.user.id),
    ),

  getGroupInvitation: authProcedure.query(
    async ({ ctx }) => await getGroupInvitation(ctx.prisma, ctx.user.id),
  ),

  acceptOrDeclineInvite: authProcedure
    .input(
      z.object({
        type: z.enum(["accept", "decline"]),
        invite_id: z.number(),
        group_id: z.string(),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await acceptOrDeclineInvite(ctx.prisma, input, ctx.user.id),
    ),

  getGroupByQuery: authProcedure
    .input(
      z.object({
        searchTerm: z.string().min(1).nullable(),
      }),
    )
    .query(
      async ({ ctx, input }) =>
        await getGroupByQuery(ctx.prisma, input.searchTerm),
    ),
  getGroupByPublicId: authProcedure
    .input(
      z.object({
        public_id: z.string(),
      }),
    )
    .query(
      async ({ ctx, input }) =>
        await getGroupByPublicId(ctx.prisma, ctx.user.id, input.public_id),
    ),
  createGroupPost: authProcedure
    .input(
      z.object({
        content: z.string(),
        group_public_id: z.string(),
        isAnonymousPost: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        ...input,
        user_id: ctx.user.id,
      };
      return await createGroupPost(ctx.prisma, data, input.isAnonymousPost);
    }),
});
