export const SHARE_PROVIDERS = {
  whatsapp: {
    baseUrl: "https://wa.me",
  },
} as const;

export type ShareProvider = keyof typeof SHARE_PROVIDERS;

export interface ShareUrlParams {
  phone?: string;
  text: string;
}

export function normalizePhoneNumber(phone?: string): string {
  return (phone ?? "").replace(/[^\d]/g, "");
}

export function buildShareUrl(provider: ShareProvider, params: ShareUrlParams): string {
  if (provider !== "whatsapp") {
    throw new Error(`Unsupported share provider: ${provider}`);
  }

  const phone = normalizePhoneNumber(params.phone);
  const url = new URL(phone ? `/${phone}` : "/", `${SHARE_PROVIDERS.whatsapp.baseUrl}/`);
  url.search = new URLSearchParams({ text: params.text }).toString();
  return url.toString();
}
