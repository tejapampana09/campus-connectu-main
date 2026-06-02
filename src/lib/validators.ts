export const validateMessage = (text: string): { valid: boolean; error?: string } => {
  if (!text.trim()) {
    return { valid: false, error: "Message cannot be empty" };
  }
  if (text.length > 300) {
    return { valid: false, error: "Message too long (max 300 characters)" };
  }
  return { valid: true };
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateMarketplaceItem = (item: {
  title?: string;
  description?: string;
  price?: any;
}): { valid: boolean; error?: string } => {
  if (!item.title?.trim()) {
    return { valid: false, error: "Title required" };
  }
  if (item.title.length > 80) {
    return { valid: false, error: "Title too long (max 80 characters)" };
  }
  if (!item.description?.trim()) {
    return { valid: false, error: "Description required" };
  }
  if (item.description.length > 500) {
    return { valid: false, error: "Description too long (max 500 characters)" };
  }
  const price = Number(item.price);
  if (!price || price <= 0) {
    return { valid: false, error: "Invalid price" };
  }
  return { valid: true };
};

export const validateLostFoundItem = (item: {
  title?: string;
  description?: string;
  location?: string;
}): { valid: boolean; error?: string } => {
  if (!item.title?.trim()) {
    return { valid: false, error: "Title required" };
  }
  if (!item.description?.trim()) {
    return { valid: false, error: "Description required" };
  }
  if (!item.location?.trim()) {
    return { valid: false, error: "Location required" };
  }
  return { valid: true };
};
