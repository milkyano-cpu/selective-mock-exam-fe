import mdwClient from '@/lib/mdwClient';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface VapidPublicKeyResponse {
  success: boolean;
  publicKey: string | null;
}

export interface PushSubscriptionMutationResponse {
  success: boolean;
  message: string;
}

export const pushService = {
  getVapidPublicKey: async (): Promise<VapidPublicKeyResponse> => {
    const response = await mdwClient.get('/push/vapid-public-key');
    return response.data;
  },

  subscribeDevice: async (
    subscription: PushSubscriptionData,
    userAgent?: string,
  ): Promise<PushSubscriptionMutationResponse> => {
    const response = await mdwClient.post('/push/subscribe', { subscription, userAgent });
    return response.data;
  },

  unsubscribeDevice: async (endpoint: string): Promise<PushSubscriptionMutationResponse> => {
    const response = await mdwClient.delete('/push/unsubscribe', { data: { endpoint } });
    return response.data;
  },
};
