import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import type { CreateOrderInput, ListOrdersQuery } from "./order.validation";

type OrderLineInput = {
  productId: string;
  quantity: number;
};

type NormalizedOrderLine = {
  productId: string;
  quantity: number;
  price: Prisma.Decimal;
  subtotal: Prisma.Decimal;
};

export class OrderService {
  async create(userId: string, input: CreateOrderInput) {
    const normalizedItems = await this.buildOrderItems(input.items);
    const totalAmount = this.calculateTotal(normalizedItems);

    return prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: "PENDING",
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: this.orderInclude,
    });
  }

  async findMine(userId: string, query: ListOrdersQuery) {
    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        include: this.orderInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.order.count({
        where: { userId },
      }),
    ]);

    return {
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      orders,
    };
  }

  async findMineById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: this.orderInclude,
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }

  async cancelMine(userId: string, orderId: string) {
    const order = await this.findMineById(userId, orderId);

    if (order.status !== "PENDING") {
      throw new ApiError(409, "Only pending orders can be canceled");
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELED" },
      include: this.orderInclude,
    });
  }

  async markAsPaid(orderId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      if (order.status === "PAID") {
        return tx.order.findUnique({
          where: { id: orderId },
          include: this.orderInclude,
        });
      }

      if (order.status !== "PENDING") {
        throw new ApiError(409, "Only pending orders can be marked as paid");
      }

      for (const item of order.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updated.count === 0) {
          throw new ApiError(409, "Insufficient stock while confirming payment");
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
        include: this.orderInclude,
      });
    });
  }

  calculateSubtotal(price: Prisma.Decimal, quantity: number) {
    return price.mul(quantity);
  }

  calculateTotal(items: Pick<NormalizedOrderLine, "subtotal">[]) {
    return items.reduce((total, item) => total.add(item.subtotal), new Prisma.Decimal(0));
  }

  private async buildOrderItems(items: OrderLineInput[]) {
    const mergedItems = this.mergeDuplicateItems(items);
    const productIds = mergedItems.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        price: true,
        stock: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new ApiError(400, "One or more products are unavailable");
    }

    return mergedItems.map((item) => {
      const product = products.find((currentProduct) => currentProduct.id === item.productId);

      if (!product) {
        throw new ApiError(400, "Product not found");
      }

      if (product.stock < item.quantity) {
        throw new ApiError(409, "Insufficient stock");
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        subtotal: this.calculateSubtotal(product.price, item.quantity),
      };
    });
  }

  private mergeDuplicateItems(items: OrderLineInput[]) {
    const itemMap = new Map<string, number>();

    for (const item of items) {
      itemMap.set(item.productId, (itemMap.get(item.productId) ?? 0) + item.quantity);
    }

    return Array.from(itemMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private readonly orderInclude = {
    items: {
      include: {
        product: true,
      },
    },
    payments: true,
  } satisfies Prisma.OrderInclude;
}

export const orderService = new OrderService();
