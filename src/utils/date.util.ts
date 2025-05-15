// create a function that takes a YYYY-MM-DD date string and returns a DD-MM-YYYY date string
export function formatDate(date: string): string {
  return date.split("-").reverse().join("-");
}
