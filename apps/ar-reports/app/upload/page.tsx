import Link from "next/link";
import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-vance-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link href="/" className="text-xs text-gray-200 hover:underline">
            ← Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Upload Foundation Reports</h1>
          <p className="mt-1 text-sm text-gray-200">
            Re-uploading replaces the prior active dataset. All pages read from the
            most recent upload of each type.
          </p>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <UploadForm />
      </section>
    </main>
  );
}
