import type { Provider } from '@/lib/discovery'

export function ProviderLogo({ provider }: { provider: Provider }) {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-[7px] border border-white/10 bg-muted text-xs text-foreground"
    >
      {provider.name.slice(0, 1)}
      {provider.logo && (
        <img
          src={provider.logo}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      )}
    </span>
  )
}
