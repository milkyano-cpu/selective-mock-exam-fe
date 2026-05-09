export type BillingTier = 'STANDARD' | 'PREMIUM';
export type MembershipTier = 'BASIC' | BillingTier;

export interface BillingSubscription {
  id: string;
  tier: BillingTier;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface BillingPrice {
  tier: BillingTier;
  unitAmount: number | null;
  unitAmountDecimal: string | null;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  intervalCount: number | null;
}

export interface BillingOverview {
  tier: MembershipTier;
  activeSubscription: BillingSubscription | null;
  subscriptions: BillingSubscription[];
  prices: Record<BillingTier, BillingPrice>;
}

export interface BillingOverviewResponse {
  success: boolean;
  message: string;
  data: BillingOverview;
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    url: string;
  };
}

export interface PortalResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
  };
}

export interface BillingInvoice {
  id: string;
  studentId: string;
  studentName: string;
  invoiceNumber: string | null;
  status: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  createdAt: string;
  downloadAvailable: boolean;
}

export interface BillingInvoicesResponse {
  success: boolean;
  message: string;
  data: {
    invoices: BillingInvoice[];
  };
}

export interface InvoiceDownloadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    fileName: string;
    source: 'minio' | 'stripe_pdf' | 'stripe_hosted';
  };
}
