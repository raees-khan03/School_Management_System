export function toDate(value: string | Date): Date {
    if (value instanceof Date) return value;
  
    // "YYYY-MM-DD" (date input ka format) ko UTC midnight par parse karo,
    // taake timezone ki wajah se date ek din aage/peeche na ho
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    const date = match
      ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
      : new Date(value);
  
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: "${value}"`);
    }
  
    return date;
  }