import { compare, hash } from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import type { LoginInput, RegisterInput } from "./auth.validation";

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ApiError(409, "Email is already registered");
    }

    const passwordHash = await hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "CUSTOMER",
      },
      omit: {
        passwordHash: true,
      },
    });

    return {
      user,
      token: this.signAccessToken(user.id, user.role),
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { passwordHash: _passwordHash, ...publicUser } = user;

    return {
      user: publicUser,
      token: this.signAccessToken(user.id, user.role),
    };
  }

  private signAccessToken(userId: string, role: "CUSTOMER" | "ADMIN") {
    return jwt.sign(
      {
        sub: userId,
        role,
      },
      env.jwtSecret,
      {
        expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
      },
    );
  }
}

export const authService = new AuthService();
