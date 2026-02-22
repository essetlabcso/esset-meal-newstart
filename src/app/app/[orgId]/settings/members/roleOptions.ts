export const ROLE_OPTIONS = [
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "member", label: "Member" },
] as const;

export function getRoleLabel(value: string) {
    const match = ROLE_OPTIONS.find((option) => option.value === value);
    return match?.label ?? value;
}
