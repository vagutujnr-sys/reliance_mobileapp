export function normalizePhone(input: string, defaultCountry = "263") {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith(defaultCountry) && digits.length >= defaultCountry.length + 8) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) return `+${defaultCountry}${digits.slice(1)}`;
  return `+${defaultCountry}${digits}`;
}

export function formatPhoneDisplay(e164: string) {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("263") && digits.length >= 12) {
    const local = digits.slice(3);
    return `+263 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  return e164;
}
