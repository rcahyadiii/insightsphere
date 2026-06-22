type DemoExtendedProfile = {
  email: string;
  phone: string;
  positionKey: string;
  location: string;
  joinDate: string;
};

export const DEMO_USER_PROFILE: Record<string, DemoExtendedProfile> = {
  default: {
    email: "user@example.test",
    phone: "081234567890",
    positionKey: "prof.position.staff",
    location: "Jakarta, ID",
    joinDate: "01 Jan 2024",
  },
  admin: {
    email: "admin@example.test",
    phone: "081234567890",
    positionKey: "prof.position.system_admin",
    location: "Jakarta, ID",
    joinDate: "01 Jan 2024",
  },
  owner: {
    email: "owner@example.test",
    phone: "082345678901",
    positionKey: "prof.position.store_owner",
    location: "Jakarta, ID",
    joinDate: "01 Feb 2024",
  },
  cashier: {
    email: "cashier@example.test",
    phone: "083456789012",
    positionKey: "prof.position.cashier",
    location: "Jakarta, ID",
    joinDate: "01 Mar 2024",
  },
};
