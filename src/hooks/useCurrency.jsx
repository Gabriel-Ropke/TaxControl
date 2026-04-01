import { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem("currency") || "BRL");

  useEffect(() => {
    localStorage.setItem("currency", currency);
    window.dispatchEvent(new Event("currencychange"));
  }, [currency]);

  const currencyConfig = {
    BRL: { locale: "pt-BR", symbol: "R$" },
    USD: { locale: "en-US", symbol: "$" },
    EUR: { locale: "de-DE", symbol: "€" },
    GBP: { locale: "en-GB", symbol: "£" },
    JPY: { locale: "ja-JP", symbol: "¥" },
    CNY: { locale: "zh-CN", symbol: "¥" },
    CHF: { locale: "de-CH", symbol: "CHF" },
    CAD: { locale: "en-CA", symbol: "$" },
    AUD: { locale: "en-AU", symbol: "$" },
    INR: { locale: "en-IN", symbol: "₹" },
    MXN: { locale: "es-MX", symbol: "$" },
    KRW: { locale: "ko-KR", symbol: "₩" },
    SGD: { locale: "en-SG", symbol: "$" },
    HKD: { locale: "zh-HK", symbol: "$" },
    BGN: { locale: "bg-BG", symbol: "лв" },
    CZK: { locale: "cs-CZ", symbol: "Kč" },
    DKK: { locale: "da-DK", symbol: "kr" },
    NOK: { locale: "nb-NO", symbol: "kr" },
    SEK: { locale: "sv-SE", symbol: "kr" },
    PLN: { locale: "pl-PL", symbol: "zł" },
    RUB: { locale: "ru-RU", symbol: "₽" },
    TRY: { locale: "tr-TR", symbol: "₺" },
    ZAR: { locale: "en-ZA", symbol: "R" },
    ARS: { locale: "es-AR", symbol: "$" },
    CLP: { locale: "es-CL", symbol: "$" },
    COP: { locale: "es-CO", symbol: "$" },
    UYU: { locale: "es-UY", symbol: "$" },
    PEN: { locale: "es-PE", symbol: "S/" },
    BOB: { locale: "es-BO", symbol: "Bs" },
    PYG: { locale: "es-PY", symbol: "₲" },
  };

  const getConfig = () => currencyConfig[currency] || currencyConfig.BRL;

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, getConfig, currencyConfig }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    return { currency: "BRL", setCurrency: () => {}, getConfig: () => ({ locale: "pt-BR", symbol: "R$" }), currencyConfig: {} };
  }
  return context;
}