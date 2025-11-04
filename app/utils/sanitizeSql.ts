export function sanitizeForSQL(str: string): string {
    return str.replace(/'/, "''");
}