import { createContext, useContext, useState } from "react";

export const CURRENCIES = [
  { code: "USD", symbol: "$",  locale: "en-US",  label: "US Dollar ($)" },
  { code: "INR", symbol: "₹",  locale: "en-IN",  label: "Indian Rupee (₹)" },
  { code: "EUR", symbol: "€",  locale: "de-DE",  label: "Euro (€)" },
  { code: "GBP", symbol: "£",  locale: "en-GB",  label: "British Pound (£)" },
  { code: "JPY", symbol: "¥",  locale: "ja-JP",  label: "Japanese Yen (¥)" },
  { code: "CAD", symbol: "CA$", locale: "en-CA", label: "Canadian Dollar (CA$)" },
  { code: "AUD", symbol: "A$", locale: "en-AU",  label: "Australian Dollar (A$)" },
  { code: "CHF", symbol: "CHF",locale: "de-CH",  label: "Swiss Franc (CHF)" },
  { code: "CNY", symbol: "¥",  locale: "zh-CN",  label: "Chinese Yuan (¥)" },
  { code: "AED", symbol: "AED",locale: "ar-AE",  label: "UAE Dirham (AED)" },
  { code: "SGD", symbol: "S$", locale: "en-SG",  label: "Singapore Dollar (S$)" },
  { code: "MXN", symbol: "MX$",locale: "es-MX",  label: "Mexican Peso (MX$)" },
  { code: "BRL", symbol: "R$", locale: "pt-BR",  label: "Brazilian Real (R$)" },
  { code: "KRW", symbol: "₩",  locale: "ko-KR",  label: "South Korean Won (₩)" },
];

const getInitial = () => {
  const saved = localStorage.getItem("currency");
  return CURRENCIES.find((c) => c.code === saved) || CURRENCIES[0];
};

const CurrencyContext = createContext(null);
export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(getInitial);

  const setCurrency = (code) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (!found) return;
    localStorage.setItem("currency", code);
    setCurrencyState(found);
  };

  /** Format a number using the active currency */
  const fmt = (n, { decimals = 0 } = {}) =>
    new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(n);

  /** Same but always 2 decimal places */
  const fmtExact = (n) => fmt(n, { decimals: 2 });

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, fmtExact }}>
      {children}
    </CurrencyContext.Provider>
  );
};
