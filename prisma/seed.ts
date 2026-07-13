import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { connectRedis, redis } from "../src/lib/redis";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Add it to your .env file.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type CategorySeed = {
  name: string;
  slug: string;
  parentSlug?: string;
};

type ProductSeed = {
  name: string;
  sku: string;
  description: string;
  price: string;
  stock: number;
  status?: "ACTIVE" | "INACTIVE";
  categorySlug: string;
};

const categorySeeds: CategorySeed[] = [
  { name: "Electronics", slug: "electronics" },
  { name: "Phones", slug: "phones", parentSlug: "electronics" },
  { name: "Laptops", slug: "laptops", parentSlug: "electronics" },
  { name: "Audio", slug: "audio", parentSlug: "electronics" },
  { name: "Accessories", slug: "accessories", parentSlug: "electronics" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
  { name: "Kitchen Appliances", slug: "kitchen-appliances", parentSlug: "home-kitchen" },
  { name: "Home Office", slug: "home-office", parentSlug: "home-kitchen" },
  { name: "Fashion", slug: "fashion" },
  { name: "Bags", slug: "bags", parentSlug: "fashion" },
  { name: "Shoes", slug: "shoes", parentSlug: "fashion" },
  { name: "Fitness", slug: "fitness" },
];

const productSeeds: ProductSeed[] = [
  {
    name: "Starter Smartphone",
    sku: "PHONE-001",
    description: "Reliable Android smartphone with a bright display and all-day battery life.",
    price: "699.00",
    stock: 25,
    categorySlug: "phones",
  },
  {
    name: "Pro Camera Phone",
    sku: "PHONE-002",
    description: "Flagship phone with advanced camera tools for photos, video, and travel.",
    price: "999.00",
    stock: 14,
    categorySlug: "phones",
  },
  {
    name: "Compact Budget Phone",
    sku: "PHONE-003",
    description: "Affordable daily phone for browsing, messaging, and light apps.",
    price: "249.00",
    stock: 40,
    categorySlug: "phones",
  },
  {
    name: "Ultrabook Air 14",
    sku: "LAP-001",
    description: "Thin 14-inch laptop for productivity, study, and remote work.",
    price: "1199.00",
    stock: 12,
    categorySlug: "laptops",
  },
  {
    name: "Creator Laptop 16",
    sku: "LAP-002",
    description: "High-performance laptop for design, development, and video editing.",
    price: "1899.00",
    stock: 8,
    categorySlug: "laptops",
  },
  {
    name: "Student Chromebook",
    sku: "LAP-003",
    description: "Lightweight laptop for classes, documents, and web apps.",
    price: "399.00",
    stock: 30,
    categorySlug: "laptops",
  },
  {
    name: "Wireless Noise-Canceling Headphones",
    sku: "AUD-001",
    description: "Over-ear Bluetooth headphones with active noise cancellation.",
    price: "179.99",
    stock: 35,
    categorySlug: "audio",
  },
  {
    name: "Portable Bluetooth Speaker",
    sku: "AUD-002",
    description: "Water-resistant speaker with rich bass and long battery life.",
    price: "89.99",
    stock: 50,
    categorySlug: "audio",
  },
  {
    name: "True Wireless Earbuds",
    sku: "AUD-003",
    description: "Compact earbuds with charging case and touch controls.",
    price: "69.99",
    stock: 75,
    categorySlug: "audio",
  },
  {
    name: "Protective Phone Case",
    sku: "CASE-001",
    description: "Shock-absorbing case for everyday phone protection.",
    price: "19.99",
    stock: 100,
    categorySlug: "accessories",
  },
  {
    name: "USB-C Fast Charger",
    sku: "ACC-001",
    description: "Compact 45W charger for phones, tablets, and small laptops.",
    price: "29.99",
    stock: 90,
    categorySlug: "accessories",
  },
  {
    name: "Braided USB-C Cable",
    sku: "ACC-002",
    description: "Durable two-meter charging cable with reinforced connectors.",
    price: "12.99",
    stock: 150,
    categorySlug: "accessories",
  },
  {
    name: "Smart LED Desk Lamp",
    sku: "OFF-001",
    description: "Adjustable desk lamp with warm and cool lighting modes.",
    price: "54.99",
    stock: 22,
    categorySlug: "home-office",
  },
  {
    name: "Ergonomic Office Chair",
    sku: "OFF-002",
    description: "Comfortable chair with lumbar support for long work sessions.",
    price: "229.00",
    stock: 10,
    categorySlug: "home-office",
  },
  {
    name: "Mechanical Keyboard",
    sku: "OFF-003",
    description: "Tactile keyboard with hot-swappable switches and backlighting.",
    price: "109.99",
    stock: 28,
    categorySlug: "home-office",
  },
  {
    name: "Air Fryer 5L",
    sku: "KIT-001",
    description: "Family-size air fryer with digital presets and easy cleanup.",
    price: "129.99",
    stock: 18,
    categorySlug: "kitchen-appliances",
  },
  {
    name: "Smart Coffee Maker",
    sku: "KIT-002",
    description: "Programmable coffee maker with app control and reusable filter.",
    price: "149.99",
    stock: 16,
    categorySlug: "kitchen-appliances",
  },
  {
    name: "Travel Backpack",
    sku: "BAG-001",
    description: "Water-resistant backpack with laptop sleeve and organizer pockets.",
    price: "79.99",
    stock: 45,
    categorySlug: "bags",
  },
  {
    name: "Everyday Crossbody Bag",
    sku: "BAG-002",
    description: "Compact bag for daily essentials with adjustable strap.",
    price: "39.99",
    stock: 60,
    categorySlug: "bags",
  },
  {
    name: "Running Shoes",
    sku: "SHOE-001",
    description: "Lightweight running shoes with breathable mesh upper.",
    price: "89.99",
    stock: 42,
    categorySlug: "shoes",
  },
  {
    name: "Training Yoga Mat",
    sku: "FIT-001",
    description: "Non-slip mat for yoga, stretching, and home workouts.",
    price: "24.99",
    stock: 80,
    categorySlug: "fitness",
  },
  {
    name: "Adjustable Dumbbell Set",
    sku: "FIT-002",
    description: "Space-saving dumbbell pair for strength training at home.",
    price: "249.99",
    stock: 9,
    categorySlug: "fitness",
  },
  {
    name: "Archived Wired Mouse",
    sku: "ACC-OLD-001",
    description: "Inactive sample product for admin status filtering tests.",
    price: "9.99",
    stock: 0,
    status: "INACTIVE",
    categorySlug: "accessories",
  },
];

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

  const categoriesBySlug = new Map<string, { id: string }>();

  for (const category of categorySeeds) {
    const parentId = category.parentSlug
      ? categoriesBySlug.get(category.parentSlug)?.id
      : undefined;

    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        parentId,
      },
      create: {
        name: category.name,
        slug: category.slug,
        parentId,
      },
    });

    categoriesBySlug.set(category.slug, savedCategory);
  }

  for (const product of productSeeds) {
    const category = categoriesBySlug.get(product.categorySlug);

    if (!category) {
      throw new Error(`Missing category for product ${product.sku}: ${product.categorySlug}`);
    }

    const data = {
      name: product.name,
      description: product.description,
      price: new Prisma.Decimal(product.price),
      stock: product.stock,
      status: product.status ?? "ACTIVE",
      categoryId: category.id,
    };

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: data,
      create: {
        ...data,
        sku: product.sku,
      },
    });
  }

  try {
    const client = await connectRedis();
    await client.del("categories:tree");
  } catch {
    // Redis may be offline during local seeding; database seed should still succeed.
  }
}

main()
  .then(async () => {
    if (redis.isOpen) {
      await redis.disconnect();
    }
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    if (redis.isOpen) {
      await redis.disconnect();
    }
    await prisma.$disconnect();
    process.exit(1);
  });
