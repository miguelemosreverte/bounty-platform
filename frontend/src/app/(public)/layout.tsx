import { Navbar } from '@/components/Navbar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </>
  );
}
