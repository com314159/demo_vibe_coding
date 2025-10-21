export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted">
      <div className="w-full max-w-md rounded-lg border bg-background p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
