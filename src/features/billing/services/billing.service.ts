import mdwClient from '@/lib/mdwClient';
import type {
  BillingOverviewResponse,
  BillingTier,
  BillingInvoicesResponse,
  CheckoutResponse,
  InvoiceDownloadResponse,
  PortalResponse,
} from '../types/billing.types';

export const billingService = {
  getMe: (): Promise<BillingOverviewResponse> =>
    mdwClient.get('/billing/me').then((r) => r.data),

  createCheckout: (tier: BillingTier): Promise<CheckoutResponse> =>
    mdwClient.post('/billing/checkout', { tier }).then((r) => r.data),

  createPortal: (): Promise<PortalResponse> =>
    mdwClient.post('/billing/portal').then((r) => r.data),

  parentCheckout: (studentId: string, tier: BillingTier): Promise<CheckoutResponse> =>
    mdwClient.post('/billing/parent/checkout', { studentId, tier }).then((r) => r.data),

  parentPortal: (studentId: string): Promise<PortalResponse> =>
    mdwClient.post('/billing/parent/portal', { studentId }).then((r) => r.data),

  listInvoices: (): Promise<BillingInvoicesResponse> =>
    mdwClient.get('/billing/invoices').then((r) => r.data),

  getInvoiceDownload: (invoiceId: string): Promise<InvoiceDownloadResponse> =>
    mdwClient.get(`/billing/invoices/${invoiceId}/download`).then((r) => r.data),
};
