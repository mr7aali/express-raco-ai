import axios, { type AxiosInstance } from "axios";
import { env } from "../../../config/env";
import { ApiError } from "../../../utils/api-error";
import type { CreatePaymentInput, PaymentResult, PaymentStrategy } from "../payment.types";

type BkashTokenResponse = {
  id_token: string;
};

type BkashCreatePaymentResponse = {
  paymentID?: string;
  bkashURL?: string;
  statusCode?: string;
  statusMessage?: string;
  transactionStatus?: string;
};

type BkashExecutePaymentResponse = BkashCreatePaymentResponse & {
  trxID?: string;
};

export class BkashPaymentStrategy implements PaymentStrategy {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.bkashBaseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const token = await this.grantToken();

    const response = await this.http.post<BkashCreatePaymentResponse>(
      "/tokenized/checkout/create",
      {
        mode: "0011",
        payerReference: input.userId,
        callbackURL: env.bkashCallbackUrl,
        amount: input.amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: input.orderId,
      },
      {
        headers: this.authHeaders(token),
      },
    );

    if (!response.data.paymentID) {
      throw new ApiError(502, response.data.statusMessage ?? "bKash create payment failed");
    }

    return {
      provider: "BKASH",
      transactionId: response.data.paymentID,
      status: "PENDING",
      rawResponse: response.data,
      redirectUrl: response.data.bkashURL,
    };
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    return this.executePayment(paymentId);
  }

  async handleWebhook(payload: unknown): Promise<PaymentResult> {
    const paymentId = this.getPaymentIdFromPayload(payload);
    return this.executePayment(paymentId);
  }

  async executePayment(paymentId: string): Promise<PaymentResult> {
    const token = await this.grantToken();

    const response = await this.http.post<BkashExecutePaymentResponse>(
      "/tokenized/checkout/execute",
      {
        paymentID: paymentId,
      },
      {
        headers: this.authHeaders(token),
      },
    );

    return {
      provider: "BKASH",
      transactionId: response.data.paymentID ?? paymentId,
      status: this.mapBkashStatus(response.data),
      rawResponse: response.data,
      redirectUrl: response.data.bkashURL,
    };
  }

  async queryPayment(paymentId: string): Promise<PaymentResult> {
    const token = await this.grantToken();

    const response = await this.http.post<BkashExecutePaymentResponse>(
      "/tokenized/checkout/payment/status",
      {
        paymentID: paymentId,
      },
      {
        headers: this.authHeaders(token),
      },
    );

    return {
      provider: "BKASH",
      transactionId: response.data.paymentID ?? paymentId,
      status: this.mapBkashStatus(response.data),
      rawResponse: response.data,
      redirectUrl: response.data.bkashURL,
    };
  }

  private async grantToken() {
    const response = await this.http.post<BkashTokenResponse>(
      "/tokenized/checkout/token/grant",
      {
        app_key: env.bkashAppKey,
        app_secret: env.bkashAppSecret,
      },
      {
        headers: {
          username: env.bkashUsername,
          password: env.bkashPassword,
        },
      },
    );

    if (!response.data.id_token) {
      throw new ApiError(502, "Unable to retrieve bKash token");
    }

    return response.data.id_token;
  }

  private authHeaders(token: string) {
    return {
      Authorization: token,
      "x-app-key": env.bkashAppKey,
    };
  }

  private mapBkashStatus(response: BkashExecutePaymentResponse) {
    if (response.transactionStatus === "Completed" || response.statusCode === "0000") {
      return "SUCCESS";
    }

    if (response.transactionStatus === "Failed") {
      return "FAILED";
    }

    return "PENDING";
  }

  private getPaymentIdFromPayload(payload: unknown) {
    if (!payload || typeof payload !== "object" || !("paymentID" in payload)) {
      throw new ApiError(400, "bKash paymentID is required");
    }

    const paymentId = payload.paymentID;

    if (typeof paymentId !== "string") {
      throw new ApiError(400, "bKash paymentID must be a string");
    }

    return paymentId;
  }
}
