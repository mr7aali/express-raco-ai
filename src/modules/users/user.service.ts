import type { User } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";

export type PublicUser = Omit<User, "passwordHash">;

export class UserService {
  async getUserById(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  async getMyOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getMyPayments(userId: string) {
    return prisma.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const userService = new UserService();
