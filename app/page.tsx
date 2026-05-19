import FounderForm from "@/components/FounderForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="font-crimson text-4xl sm:text-5xl font-semibold text-white leading-tight mb-3">
            Are You Ready to Validate?
          </h1>
          <p className="text-[#888] text-base sm:text-lg">
            Find out before you waste a single day.
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6 sm:p-8">
          <FounderForm />
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#555]">
            This is not a pitch evaluation. This is a readiness check.
          </p>
        </div>
      </div>

      <footer className="mt-16 text-center text-xs text-[#444]">
        Conversations are confidential.
      </footer>
    </main>
  );
}
