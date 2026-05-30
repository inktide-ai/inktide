import Link from 'next/link'
import { ArrowRight, Code2, Webhook, Shield } from 'lucide-react'

export default function DeveloperOverviewPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--text-heading)]">Developer Portal</h1>
        <p className="text-[var(--text-secondary)]">
          Build integrations with Inktide. Register your application, set up OAuth 2.0, and receive webhook events.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Code2 size={20} />, title: 'Register App', desc: 'Get client credentials to use with OAuth 2.0', href: '/developer/apps/new' },
          { icon: <Shield size={20} />, title: 'OAuth 2.0', desc: 'Standard Authorization Code flow via Keycloak', href: '/developer/apps' },
          { icon: <Webhook size={20} />, title: 'Webhooks', desc: 'Receive real-time events for your integration', href: '/developer/apps' },
        ].map(item => (
          <Link
            key={item.title}
            href={item.href}
            className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] p-5 hover:bg-[var(--surface-1)] transition-colors group"
          >
            <div className="text-[var(--text-secondary)]">{item.icon}</div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-heading)]">{item.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
            </div>
            <ArrowRight size={14} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors mt-auto" />
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] p-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-heading)]">OAuth 2.0 Authorization URL</h2>
        <code className="text-xs text-[var(--text-secondary)] bg-[var(--surface-1)] rounded-md px-3 py-2 break-all">
          {'{keycloak_base_url}'}/realms/chimera/protocol/openid-connect/auth
          ?client_id={'<your_client_id>'}
          &redirect_uri={'<your_redirect_uri>'}
          &response_type=code
          &scope=openid
          &state={'<random_state>'}
        </code>
        <p className="text-xs text-[var(--text-tertiary)]">
          After user authorizes, exchange the code at the standard Keycloak token endpoint.
        </p>
      </div>
    </div>
  )
}
