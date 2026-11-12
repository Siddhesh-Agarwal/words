import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { SiteHeader } from '@/components/site-header'
import { Toaster } from '@/components/ui/sonner'
import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-background py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 text-center text-sm text-muted-foreground">
          <p>
            Made for humans by{' '}
            <a
              className="underline underline-offset-4 transition-colors hover:text-foreground"
              href="https://siddhesh.cc"
              target="_blank"
              rel="noopener noreferrer"
            >
              Siddhesh Agarwal
            </a>
          </p>
        </div>
      </footer>
      <Toaster />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  )
}
