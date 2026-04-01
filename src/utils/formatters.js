const currencyCache = {
  currency: localStorage.getItem("currency") || "BRL",
  locale: "pt-BR",
  symbol: "R$"
};

const exchangeRates = {
  BRL: 1,
  USD: 0.1948,
  EUR: 0.1869,
  GBP: 0.1607,
  JPY: 29.45,
  CNY: 1.418,
  CHF: 0.1746,
  CAD: 0.2678,
  AUD: 0.3047,
  INR: 16.43,
  MXN: 3.312,
  KRW: 267.5,
  SGD: 0.2637,
  HKD: 1.523,
  BGN: 0.3656,
  CZK: 4.512,
  DKK: 1.395,
  NOK: 2.138,
  SEK: 2.108,
  PLN: 0.798,
  RUB: 18.25,
  TRY: 6.72,
  ZAR: 3.653,
  ARS: 192.52,
  CLP: 191.2,
  COP: 791.5,
  UYU: 7.95,
  PEN: 0.729,
  BOB: 1.345,
  PYG: 1456.5
};

function updateCurrencyCache() {
  const currency = localStorage.getItem("currency") || "BRL";
  const locales = {
    BRL: "pt-BR", USD: "en-US", EUR: "de-DE", GBP: "en-GB", JPY: "ja-JP",
    CNY: "zh-CN", CHF: "de-CH", CAD: "en-CA", AUD: "en-AU", INR: "en-IN",
    MXN: "es-MX", KRW: "ko-KR", SGD: "en-SG", HKD: "zh-HK", BGN: "bg-BG",
    CZK: "cs-CZ", DKK: "da-DK", NOK: "nb-NO", SEK: "sv-SE", PLN: "pl-PL",
    RUB: "ru-RU", TRY: "tr-TR", ZAR: "en-ZA", ARS: "es-AR", CLP: "es-CL",
    COP: "es-CO", UYU: "es-UY", PEN: "es-PE", BOB: "es-BO", PYG: "es-PY"
  };
  const symbols = {
    BRL: "R$", USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", CHF: "CHF",
    CAD: "$", AUD: "$", INR: "₹", MXN: "$", KRW: "₩", SGD: "$", HKD: "$",
    BGN: "лв", CZK: "Kč", DKK: "kr", NOK: "kr", SEK: "kr", PLN: "zł",
    RUB: "₽", TRY: "₺", ZAR: "R", ARS: "$", CLP: "$", COP: "$", UYU: "$",
    PEN: "S/", BOB: "Bs", PYG: "₲"
  };
  currencyCache.currency = currency;
  currencyCache.locale = locales[currency] || "pt-BR";
  currencyCache.symbol = symbols[currency] || "R$";
}

function convertFromBRL(amountBRL, targetCurrency) {
  if (targetCurrency === "BRL") return amountBRL;
  const rate = exchangeRates[targetCurrency] || 1;
  return amountBRL * rate;
}

updateCurrencyCache();

if (typeof window !== "undefined") {
  window.addEventListener("currencychange", updateCurrencyCache);
  window.addEventListener("storage", (e) => {
    if (e.key === "currency") updateCurrencyCache();
  });
}

export function formatBRL(value) {
  if (value == null) return "—";
  const converted = convertFromBRL(value, currencyCache.currency);
  return converted.toLocaleString(currencyCache.locale, {
    style: "currency",
    currency: currencyCache.currency,
  });
}

export function formatBRLCompact(value) {
  if (value == null) return "—";
  const converted = convertFromBRL(value, currencyCache.currency);
  return value >= 1000
    ? currencyCache.symbol + " " + (converted / 1000).toFixed(0) + "k"
    : currencyCache.symbol + " " + Math.round(converted);
}

export function formatMonthShortPt(dateStr) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

export function formatMonthLongPt(dateStr) {
  const [year, month] = dateStr.split("-");
  return new Date(year, month - 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/** Até 2 iniciais a partir das primeiras palavras do nome (ex.: "João Silva" → "JS"). */
export function getInitials(name) {
  if (!name?.trim()) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Applica máscara de moeda BRL em tempo real durante a digitação */
export function formatCurrencyInput(valueStr) {
  if (!valueStr) return "";
  const numericStr = String(valueStr).replace(/\D/g, "");
  if (!numericStr) return "";
  
  const amount = parseFloat(numericStr) / 100;

  return new Intl.NumberFormat(currencyCache.locale, {
    style: "currency",
    currency: currencyCache.currency,
  }).format(amount);
}

/** Desfaz a máscara retornando o valor float real (ex: "R$ 1.000,00" -> 1000.00) */
export function parseCurrencyToFloat(valueStr) {
  if (!valueStr) return null;
  const numericStr = String(valueStr).replace(/\D/g, "");
  if (!numericStr) return null;
  return parseFloat(numericStr) / 100;
}
