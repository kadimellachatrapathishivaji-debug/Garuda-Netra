// Indian Vehicle Registration Number regex
// Format: SS DD SS DDDD (e.g., AP03TC4590, DL01CA9999)
export function validateIndianRegNumber(value: string): boolean {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  // Pattern: 2 letters (state) + 2 digits (district) + 1-2 letters (series) + 4 digits
  const pattern = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;
  return pattern.test(cleaned);
}

export function validateIndianMobile(value: string): boolean {
  const cleaned = value.replace(/\s/g, '').replace(/^\+91/, '').replace(/^91/, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function validateGovEmail(value: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@(gov\.in|police\.gov\.in|nic\.in|ias\.in)$/i;
  return pattern.test(value);
}

export function validateFIRNumber(value: string): boolean {
  // Format: FIR-YYYY-NNNNNN or state prefix formats
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  return cleaned.length >= 5;
}

export function formatRegNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  if (cleaned.length >= 6) {
    // Insert spaces: SS DD XX DDDD
    const match = cleaned.match(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{1,4})$/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
  }
  return cleaned;
}

export function maskString(str: string, visibleEnd: number = 4, maskChar: string = '*'): string {
  if (str.length <= visibleEnd) return str;
  const masked = maskChar.repeat(str.length - visibleEnd);
  return masked + str.slice(-visibleEnd);
}
