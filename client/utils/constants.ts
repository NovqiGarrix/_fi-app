export type RawCategory = {
  name: string;
  color: string;
};

export const DEFAULT_CATEGORIES = [
  { name: "Housing", color: "#6C5CE7" },
  { name: "Utilities", color: "#00B894" },
  { name: "Transportation", color: "#0984E3" },
  { name: "Groceries", color: "#E17055" },
  { name: "Dining Out", color: "#E84393" },
  { name: "Healthcare", color: "#2ECC71" },
  { name: "Insurance", color: "#E67E22" },
  { name: "Debt Payments", color: "#1ABC9C" },
  { name: "Personal Care", color: "#9B59B6" },
  { name: "Shopping", color: "#3498DB" },
  { name: "Entertainment", color: "#F1C40F" },
  { name: "Subscriptions", color: "#E74C3C" },
  { name: "Gifts & Donations", color: "#16A085" },
  { name: "Travel", color: "#8E44AD" },
  { name: "Education", color: "#2C3E50" },
];

export const API_URL = process.env.EXPO_PUBLIC_API_URL as string;
