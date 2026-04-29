import Nav from "./nav";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-indigo-700 text-lg">FLYNOW</span>
          <Nav />
        </div>
      </header>
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6">
        {children}
      </main>
    </div>
  );
}
