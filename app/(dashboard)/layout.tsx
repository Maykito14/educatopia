export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* TODO: navbar con rol del usuario */}
      <main className="flex-1 py-4">
        {children}
      </main>
    </div>
  );
}
