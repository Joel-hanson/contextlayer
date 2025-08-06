export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0012 15c-2.34 0-4.5-.743-6.26-2.009C7.773 10.994 9.823 10 12 10s4.227.994 6.26 2.991A7.962 7.962 0 0012 15z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Bridge Not Found</h1>
                <p className="text-gray-600 mb-6">
                    The bridge you&apos;re looking for doesn&apos;t exist or may have been removed.
                </p>
                <a
                    href="/dashboard/bridges"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Back to Dashboard
                </a>
            </div>
        </div>
    );
}
