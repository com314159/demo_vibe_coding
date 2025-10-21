import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerClient } from '../../lib/supabaseServer';
import { Button } from '../../components/ui/button';

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = getServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    const serverSupabase = getServerClient();
    await serverSupabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/assets" className="text-lg font-semibold">
              IT 设备资产管理
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/assets" className="hover:text-foreground">
                设备清单
              </Link>
              <Link href="/repairs" className="hover:text-foreground">
                TODO: 维修记录
              </Link>
            </nav>
          </div>
          <form action={handleSignOut}>
            <Button type="submit" variant="outline">
              退出登录
            </Button>
          </form>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
