// lib/roles.ts
// Super Admin selalu bisa akses semuanya (superset), gak perlu ditulis manual
// di tiap daftar allowedRoles. Role lain cuma bisa akses kalau namanya ada
// di daftar allowedRoles.
export function canAccess(userRole: string | null | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  if (userRole === "super_admin") return true;
  return allowedRoles.includes(userRole);
}