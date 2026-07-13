import { prisma } from "../../lib/prisma";
import { connectRedis } from "../../lib/redis";
import { ApiError } from "../../utils/api-error";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validation";

type CategoryNode = {
  id: string;
  parentId: string | null;
  children: CategoryNode[];
};

const CATEGORY_TREE_CACHE_KEY = "categories:tree";
const CATEGORY_TREE_TTL_SECONDS = 60 * 10;

export class CategoryService {
  async create(input: CreateCategoryInput) {
    if (input.parentId) {
      await this.ensureCategoryExists(input.parentId);
    }

    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        parentId: input.parentId,
      },
    });

    await this.clearCategoryTreeCache();
    return category;
  }

  async update(categoryId: string, input: UpdateCategoryInput) {
    await this.ensureCategoryExists(categoryId);

    if (input.parentId) {
      if (input.parentId === categoryId) {
        throw new ApiError(400, "Category cannot be its own parent");
      }

      await this.ensureCategoryExists(input.parentId);
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: input,
    });

    await this.clearCategoryTreeCache();
    return category;
  }

  async delete(categoryId: string) {
    await this.ensureCategoryExists(categoryId);

    const hasProducts = await prisma.product.count({
      where: { categoryId },
    });

    if (hasProducts > 0) {
      throw new ApiError(409, "Cannot delete category with products");
    }

    const category = await prisma.category.delete({
      where: { id: categoryId },
    });

    await this.clearCategoryTreeCache();
    return category;
  }

  async findAll() {
    return prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        products: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parent: true,
        children: true,
        products: true,
      },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    return category;
  }

  async getChildren(categoryId: string) {
    await this.ensureCategoryExists(categoryId);

    return prisma.category.findMany({
      where: { parentId: categoryId },
      orderBy: { name: "asc" },
    });
  }

  async getProductsInTree(categoryId: string, excludeProductId?: string) {
    await this.ensureCategoryExists(categoryId);

    const categoryIds = await this.getCategoryTreeIdsByDfs(categoryId);

    return prisma.product.findMany({
      where: {
        categoryId: {
          in: categoryIds,
        },
        id: excludeProductId
          ? {
              not: excludeProductId,
            }
          : undefined,
        status: "ACTIVE",
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  private async getCategoryTreeIdsByDfs(rootCategoryId: string) {
    const tree = await this.getCachedCategoryTree();
    const root = tree.find((category) => category.id === rootCategoryId);

    if (!root) {
      return [rootCategoryId];
    }

    const ids: string[] = [];
    const stack: CategoryNode[] = [root];

    while (stack.length > 0) {
      const current = stack.pop();

      if (!current) {
        continue;
      }

      ids.push(current.id);
      stack.push(...current.children);
    }

    return ids;
  }

  private async getCachedCategoryTree() {
    try {
      const client = await connectRedis();
      const cachedTree = await client.get(CATEGORY_TREE_CACHE_KEY);

      if (cachedTree) {
        return JSON.parse(cachedTree) as CategoryNode[];
      }

      const tree = await this.buildCategoryTree();

      await client.set(CATEGORY_TREE_CACHE_KEY, JSON.stringify(tree), {
        EX: CATEGORY_TREE_TTL_SECONDS,
      });

      return tree;
    } catch {
      return this.buildCategoryTree();
    }
  }

  private async buildCategoryTree() {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        parentId: true,
      },
    });

    const nodes = new Map<string, CategoryNode>();

    for (const category of categories) {
      nodes.set(category.id, {
        ...category,
        children: [],
      });
    }

    const roots: CategoryNode[] = [];

    for (const node of nodes.values()) {
      if (node.parentId) {
        const parent = nodes.get(node.parentId);
        parent?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private async clearCategoryTreeCache() {
    try {
      const client = await connectRedis();
      await client.del(CATEGORY_TREE_CACHE_KEY);
    } catch {
      // Cache invalidation should not block database writes.
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
}

export const categoryService = new CategoryService();
