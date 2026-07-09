import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Add it to your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
    },
    create: {
      name: "Admin User",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: { name: "Electronics" },
    create: {
      name: "Electronics",
      slug: "electronics",
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {
      name: "Accessories",
      parentId: electronics.id,
    },
    create: {
      name: "Accessories",
      slug: "accessories",
      parentId: electronics.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: "PHONE-001" },
    update: {
      name: "Starter Smartphone",
      description: "Sample active product for order and payment testing.",
      price: new Prisma.Decimal("699.00"),
      stock: 25,
      status: "ACTIVE",
      categoryId: electronics.id,
    },
    create: {
      name: "Starter Smartphone",
      sku: "PHONE-001",
      description: "Sample active product for order and payment testing.",
      price: new Prisma.Decimal("699.00"),
      stock: 25,
      status: "ACTIVE",
      categoryId: electronics.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: "CASE-001" },
    update: {
      name: "Protective Phone Case",
      description: "Sample related product for category recommendation testing.",
      price: new Prisma.Decimal("19.99"),
      stock: 100,
      status: "ACTIVE",
      categoryId: accessories.id,
    },
    create: {
      name: "Protective Phone Case",
      sku: "CASE-001",
      description: "Sample related product for category recommendation testing.",
      price: new Prisma.Decimal("19.99"),
      stock: 100,
      status: "ACTIVE",
      categoryId: accessories.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
