import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-semibold text-foreground">
                    Page Not Found
                </h2>
                <p className="text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
