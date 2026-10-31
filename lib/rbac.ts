export type UserRole = 'Owner' | 'Manager' | 'Staff';

export const PERMISSIONS = {
  MANAGE_BILLING: ['Owner'],
  MANAGE_SETTINGS: ['Owner'],
  MANAGE_CARS: ['Owner', 'Manager'],
  MANAGE_BOOKINGS: ['Owner', 'Manager', 'Staff'],
  DELETE_RECORDS: ['Owner'],
};

export function hasPermission(role: UserRole, action: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[action].includes(role);
}