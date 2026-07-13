import { loginSchema, registerSchema } from "../src/modules/auth/auth.validation";
import { createOrderSchema, listOrdersSchema } from "../src/modules/orders/order.validation";
import { checkoutSchema } from "../src/modules/payments/payment.validation";
import {
  createProductSchema,
  updateProductSchema,
} from "../src/modules/products/product.validation";

const categoryId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const orderId = "33333333-3333-4333-8333-333333333333";

describe("request validation", () => {
  it("normalizes auth email addresses", () => {
    const registerResult = registerSchema.parse({
      body: {
        name: "Test Customer",
        email: " Customer@Example.COM ",
        password: "Password123",
      },
    });
    const loginResult = loginSchema.parse({
      body: {
        email: " Customer@Example.COM ",
        password: "Password123",
      },
    });

    expect(registerResult.body.email).toBe("customer@example.com");
    expect(loginResult.body.email).toBe("customer@example.com");
  });

  it("coerces product numbers and defaults status to active", () => {
    const result = createProductSchema.parse({
      body: {
        name: "Starter Smartphone",
        sku: "PHONE-001",
        price: "699.00",
        stock: "25",
        categoryId,
      },
    });

    expect(result.body.price).toBe(699);
    expect(result.body.stock).toBe(25);
    expect(result.body.status).toBe("ACTIVE");
  });

  it("rejects empty product updates", () => {
    expect(() =>
      updateProductSchema.parse({
        params: { id: productId },
        body: {},
      }),
    ).toThrow("At least one field is required");
  });

  it("requires at least one order item", () => {
    expect(() =>
      createOrderSchema.parse({
        body: { items: [] },
      }),
    ).toThrow();
  });

  it("coerces order pagination defaults", () => {
    const result = listOrdersSchema.parse({
      query: {},
    });

    expect(result.query).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it("normalizes checkout provider names", () => {
    const result = checkoutSchema.parse({
      body: {
        orderId,
        provider: "stripe",
      },
    });

    expect(result.body.provider).toBe("STRIPE");
  });
});
