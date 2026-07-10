import { Prisma } from "../../generated/prisma/client";
import type { ProductStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { categoryService } from "../categories/category.service";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "./product.validation";

export class ProductService {
  async create(input: CreateProductInput) {
    await this.ensureCategoryExists(input.categoryId);
    await this.ensureSkuIsAvailable(input.sku);

    return prisma.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        description: input.description,
        price: new Prisma.Decimal(input.price),
        stock: input.stock,
        status: input.status as ProductStatus,
        categoryId: input.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  async update(productId: string, input: UpdateProductInput) {
    await this.ensureProductExists(productId);

    if (input.categoryId) {
      await this.ensureCategoryExists(input.categoryId);
    }

    if (input.sku) {
      await this.ensureSkuIsAvailable(input.sku, productId);
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        sku: input.sku,
        description: input.description,
        price: input.price === undefined ? undefined : new Prisma.Decimal(input.price),
        stock: input.stock,
        status: input.status as ProductStatus | undefined,
        categoryId: input.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  async delete(productId: string) {
    await this.ensureProductExists(productId);

    return prisma.product.delete({
      where: { id: productId },
    });
  }

  async findAll(query: ListProductsQuery) {
    const where: Prisma.ProductWhereInput = {
      status: query.status as ProductStatus | undefined,
      categoryId: query.categoryId,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    };

    const skip = (query.page - 1) * query.limit;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      products,
    };
  }

  async findById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return product;
  }

  async reduceStock(productId: string, quantity: number) {
    if (quantity <= 0) {
      throw new ApiError(400, "Quantity must be greater than zero");
    }

    const updated = await prisma.product.updateMany({
      where: {
        id: productId,
        stock: {
          gte: quantity,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    if (updated.count === 0) {
      throw new ApiError(409, "Insufficient stock");
    }

    return true;
  }

  async getRecommendations(productId: string) {
    const product = await this.findById(productId);
    return categoryService.getProductsInTree(product.categoryId, productId);
  }

  private async ensureProductExists(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }
  }

  private async ensureSkuIsAvailable(sku: string, currentProductId?: string) {
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });

    if (existingProduct && existingProduct.id !== currentProductId) {
      throw new ApiError(409, "SKU is already used by another product");
    }
  }
}

export const productService = new ProductService();
