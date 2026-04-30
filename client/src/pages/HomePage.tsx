import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold">Welcome</h1>
      </main>
    </div>
  );
}
