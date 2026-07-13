import { z } from "zod";

const productStatusSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(["ACTIVE", "INACTIVE"]));

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(180),
    sku: z.string().trim().min(2).max(80),
    description: z.string().trim().max(5000).optional(),
    price: z.coerce.number().positive(),
    stock: z.coerce.number().int().nonnegative(),
    status: productStatusSchema.default("ACTIVE"),
    categoryId: z.string().uuid(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(180).optional(),
      sku: z.string().trim().min(2).max(80).optional(),
      description: z.string().trim().max(5000).nullable().optional(),
      price: z.coerce.number().positive().optional(),
      stock: z.coerce.number().int().nonnegative().optional(),
      status: productStatusSchema.optional(),
      categoryId: z.string().uuid().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required",
    }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    status: productStatusSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type ListProductsQuery = z.infer<typeof listProductsSchema>["query"];
