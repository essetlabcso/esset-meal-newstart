type RoleBadgeProps = {
    role: string;
    tone?: "light" | "dark";
};

export default function RoleBadge({ role, tone = "dark" }: RoleBadgeProps) {
    const normalized = role.toLowerCase();
    const roleLabel = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    const classes =
        tone === "light"
            ? "border-esset-border bg-esset-bg text-esset-teal-800"
            : "border-white/30 bg-white/10 text-white";

    return (
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${classes}`}>
            {roleLabel}
        </span>
    );
}
