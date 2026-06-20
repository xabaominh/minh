export const MANAGEMENT_ROLES = ['ADMIN', 'MANAGER'];


export function isManagementUser(user) {
    return MANAGEMENT_ROLES.includes((user?.role || '').toUpperCase());
}
