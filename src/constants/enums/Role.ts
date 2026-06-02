export enum Role {
    member = 1,
    creator = 2,
    admin = 3,
    owner = 4
}

export const getRoleById = (role: Role) => Object.entries(Role).find(([_, value]) => role === value)![0];

export const getRoleByValue = (role: string) => Object.entries(Role).find(([key, _]) => role === key)![1];

export const getRoleOptions = (role: Role) => [
    { label: 'Member', value: 'member' },
    { label: 'Creator', value: 'creator' },
    { label: 'Admin', value: 'admin' },
    ...(Role.owner === role ? [{ label: 'Owner', value: 'owner' }] : [])
];
