export const TYPES = ["Expense", "Income"];

export const CATEGORIES = [
  "Groceries",
  "Rent",
  "Utilities",
  "Transport",
  "Dining",
  "Entertainment",
  "Health",
  "Shopping",
  "Travel",
  "Subscriptions",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

export const ICONS = [
  "🛒",
  "🏠",
  "💡",
  "🚗",
  "🍽️",
  "🎬",
  "💊",
  "🛍️",
  "✈️",
  "📱",
  "💼",
  "📈",
  "💵",
  "✨",
];

export const COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

// Default icon/color per category — used so a category "just looks right"
// without the user having to pick manually every time.
export const CATEGORY_META = {
  Groceries: { icon: "🛒", color: "#10b981" },
  Rent: { icon: "🏠", color: "#6366f1" },
  Utilities: { icon: "💡", color: "#f59e0b" },
  Transport: { icon: "🚗", color: "#0ea5e9" },
  Dining: { icon: "🍽️", color: "#ef4444" },
  Entertainment: { icon: "🎬", color: "#ec4899" },
  Health: { icon: "💊", color: "#14b8a6" },
  Shopping: { icon: "🛍️", color: "#8b5cf6" },
  Travel: { icon: "✈️", color: "#0ea5e9" },
  Subscriptions: { icon: "📱", color: "#8b5cf6" },
  Salary: { icon: "💼", color: "#10b981" },
  Freelance: { icon: "💵", color: "#10b981" },
  Investment: { icon: "📈", color: "#10b981" },
  Other: { icon: "✨", color: "#6366f1" },
};
