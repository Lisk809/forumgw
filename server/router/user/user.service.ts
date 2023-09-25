import { sendTRPCResponse } from "@/lib/helper/api.helper";
import { excludeField } from "@/lib/helper/obj.helper";
import type { PrismaContext } from "@/server/trpc";
import { compareSync, hashSync } from "bcrypt-ts";
import { SignJWT } from "jose";
import { nanoid } from "nanoid";

type TSignUpUser = {
  name: string;
  username: string;
  password: string;
};

type TSignInUser = Omit<TSignUpUser, "name">;

type TUserUnique = {
  username: string | null;
};

type TUpdateUser = {
  name: string;
  username: string;
  bio: string | null;
  image: string | null;
};

export const signUp = async (prisma: PrismaContext, input: TSignUpUser) => {
  const username = input.username.split(" ").join("");
  const { name, password } = input;

  const userExist = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (userExist) {
    return sendTRPCResponse({
      status: 400,
      message: "User udah terdaftar bre!",
    });
  }

  const createdUser = await prisma.user.create({
    data: {
      username,
      name,
      password: hashSync(password, 10),
      role_id: username === "adicss" ? 2 : 1, // Role = common | developer
    },
  });

  if (!createdUser) {
    return sendTRPCResponse({
      status: 400,
      message: "Gagal nge-daftarin akun lu bre :(",
    });
  }

  return sendTRPCResponse(
    {
      status: 201,
      message: "Akun lu berhasil terdaftar",
    },
    createdUser,
  );
};

export const signIn = async (prisma: PrismaContext, input: TSignInUser) => {
  const { username, password } = input;
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      password: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user) {
    return sendTRPCResponse({
      status: 400,
      message: "Akun ini belom terdaftar bre!",
    });
  }

  const isPasswordCorrect = compareSync(password, user.password);

  if (!isPasswordCorrect) {
    return sendTRPCResponse({
      status: 401,
      message: "Username dan Password gk match bre",
    });
  }

  const authUser = excludeField(user, ["password"]);

  const token = await new SignJWT(authUser)
    .setProtectedHeader({ alg: "HS256" })
    .setJti(nanoid())
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  return sendTRPCResponse(
    {
      status: 200,
      message: "Ok, Selamat berdiskusi..",
    },
    token,
  );
};

export const getProfile = async (
  prisma: PrismaContext,
  user_id: string,
  input: TUserUnique & { withPosts: boolean },
) => {
  const whereClause = input.username
    ? { username: input.username }
    : { id: user_id };

  const existingUser = await prisma.user.findUnique({
    where: whereClause,
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      posts: input.withPosts && {
        select: {
          id: true,
          content: true,
          created_at: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      },
    },
  });

  if (!existingUser) {
    return sendTRPCResponse({
      status: 404,
      message: "User yang dicari tidak ketemu!",
    });
  }

  return sendTRPCResponse(
    {
      status: 200,
      message: "Nih user yang lu cari",
    },
    existingUser,
  );
};

export const editProfile = async (
  prisma: PrismaContext,
  input: TUpdateUser,
) => {
  const username = input.username.split(" ").join("");
  const updatedUser = await prisma.user.update({
    where: {
      username,
    },
    data: input,
  });

  if (!updatedUser) {
    return sendTRPCResponse({
      status: 400,
      message: "Gagal mengubah data user lu",
    });
  }

  return sendTRPCResponse({
    status: 201,
    message: "Berhasil mengubah data user lu",
  });
};
