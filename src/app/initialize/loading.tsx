import Spinner from "@/components/ui/Spinner";

export default function InitializeLoading() {
    return (
        <main className="esset-page-bg flex min-h-screen items-center justify-center px-6">
            <div className="esset-card flex w-full max-w-md flex-col items-center gap-4 p-10 text-center">
                <Spinner label="Loading workspace access" className="h-6 w-6 border-esset-teal-800 border-r-transparent text-esset-teal-800" />
                <p className="text-sm font-semibold text-esset-muted">
                    Checking your workspace access...
                </p>
            </div>
        </main>
    );
}
