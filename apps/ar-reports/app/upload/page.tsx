import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <div className="mb-10 flex items-baseline justify-between gap-6">
        <span className="eyebrow">Upload</span>
        <p className="max-w-[440px] text-right text-[14px] text-[var(--muted)]">
          Re-uploading replaces the prior active dataset. All pages read from
          the most recent upload of each type.
        </p>
      </div>
      <UploadForm />
    </section>
  );
}
