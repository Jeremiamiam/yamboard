import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GlobalNav } from '@/components/GlobalNav'
import { AgencyChatFab } from '@/components/AgencyChatFab'
import { StoreProvider } from '@/components/StoreProvider'
import { ClientSidebarWrapper } from '@/components/ClientSidebarWrapper'

function SidebarSkeleton() {
  return (
    <aside
      className="fixed top-20 left-0 bottom-0 z-40 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      style={{ width: 'var(--sidebar-w)' }}
    />
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  if (pathname.startsWith('/api/')) {
    return <>{children}</>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <>
      <GlobalNav />
      <StoreProvider>
        <ClientSidebarWrapper fallback={<SidebarSkeleton />} />
        {children}
      </StoreProvider>
      <AgencyChatFab />
    </>
  )
}
