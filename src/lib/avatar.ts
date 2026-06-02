export const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=8b5cf6,ec4899,3b82f6`;

export const displayName = (email?: string | null, name?: string | null) =>
  (name?.trim() || email?.split("@")[0] || "Student").slice(0, 40);
