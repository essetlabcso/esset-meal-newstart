type SpinnerProps = {
    label?: string;
    className?: string;
};

export default function Spinner({ label = "Loading", className = "" }: SpinnerProps) {
    return (
        <span
            aria-label={label}
            role="status"
            className={`inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
        />
    );
}
