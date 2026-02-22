export default function ProjectHomeLoading() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 5 }).map((_, index) => (
                <div
                    key={index}
                    className="h-44 animate-pulse rounded-3xl border border-esset-border bg-white"
                />
            ))}
        </div>
    );
}
