import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h1 className="text-2xl font-serif font-bold text-[var(--color-brown-dark)] mb-4">
          Check your email
        </h1>
        <p className="text-[var(--color-brown)] mb-6">
          A sign-in link has been sent to your email address. Click the link to continue.
        </p>
        <Link href="/login" className="text-[var(--color-brown)] underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
