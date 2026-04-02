/**
 * Egyptian mobile phone number validator.
 * Accepts these prefixes: +20, 0020, 0 — followed by 1[0125] and 8 digits.
 * Valid networks: Vodafone (010), Orange (012), Etisalat (011), WE (015)
 *
 * Examples:
 *   01012345678  ✅
 *   +201012345678 ✅
 *   00201012345678 ✅
 *   01234567890  ❌ (invalid prefix)
 */
export const EGY_PHONE_REGEX = /^(\+20|0020|0)?1[0-2,5][0-9]{8}$/;

/**
 * Returns true if the phone number is a valid Egyptian mobile number.
 */
export const isValidEgyptianPhone = (phone: string): boolean =>
  EGY_PHONE_REGEX.test(phone.trim());

/**
 * Normalises an Egyptian phone number to the local 11-digit format (01XXXXXXXXX).
 * Strips +20 or 0020 prefix.
 */
export const normaliseEgyptianPhone = (phone: string): string => {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+20')) return '0' + trimmed.slice(3);
  if (trimmed.startsWith('0020')) return '0' + trimmed.slice(4);
  return trimmed;
};
