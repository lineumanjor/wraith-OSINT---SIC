import { cn } from '@/lib/utils'
import type { PreviewStyle } from '@/lib/spectre/types'
import { Check, ChevronRight, FileText, MoreVertical } from 'lucide-react'
import Image from 'next/image'

export const PREVIEW_STYLES: Array<{
  value: PreviewStyle
  label: string
  hint: string
}> = [
  {
    value: 'messaging',
    label: 'Mensageria',
    hint: 'Bolha de conversa com cartão de link — padrão de apps de chat.',
  },
  {
    value: 'cloud',
    label: 'Nuvem',
    hint: 'Linha de arquivo compartilhado — padrão de drives corporativos.',
  },
  {
    value: 'marketplace',
    label: 'Marketplace',
    hint: 'Cartão de produto com preço e fornecedor — padrão de B2B.',
  },
]

type GhostPreviewProps = {
  style: PreviewStyle
  title: string
  description?: string | null
  source?: string | null
  className?: string
}

function MessagingPreview({ title, description, source }: Omit<GhostPreviewProps, 'style' | 'className'>) {
  return (
    <div className="w-full max-w-sm">
      <div className="relative rounded-2xl rounded-tl-sm bg-[#1f2b26] p-1.5 shadow-lg ring-1 ring-white/5">
        <div className="overflow-hidden rounded-xl bg-[#111a16]">
          <div className="flex items-start gap-3 p-2.5">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
              <Image
                src="/preview-document.png"
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="truncate text-[13px] font-semibold text-white/95">{title}</p>
              {description && (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/55">
                  {description}
                </p>
              )}
              {source && (
                <p className="mt-1 truncate font-mono text-[10px] tracking-wide text-white/40">
                  {source}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 px-1.5 pt-1 pb-0.5">
          <span className="font-mono text-[9px] text-white/35">12:04</span>
          <Check className="size-2.5 text-[#53bdeb]" aria-hidden />
          <Check className="-ml-2 size-2.5 text-[#53bdeb]" aria-hidden />
        </div>
      </div>
      <p className="mt-2 pl-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60 uppercase">
        Padrão de mensageria
      </p>
    </div>
  )
}

function CloudPreview({ title, description, source }: Omit<GhostPreviewProps, 'style' | 'className'>) {
  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1b1c22] p-3 shadow-lg">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#2a2c36]">
          <FileText className="size-5 text-[#8ab4f8]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-white/95">{title}</p>
          <p className="mt-0.5 truncate text-[11px] text-white/50">
            {description ?? 'Documento compartilhado'}
          </p>
          {source && (
            <p className="mt-0.5 truncate font-mono text-[10px] text-white/35">{source}</p>
          )}
        </div>
        <MoreVertical className="size-4 shrink-0 text-white/35" aria-hidden />
      </div>
      <p className="mt-2 pl-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60 uppercase">
        Padrão de nuvem
      </p>
    </div>
  )
}

function MarketplacePreview({
  title,
  description,
  source,
}: Omit<GhostPreviewProps, 'style' | 'className'>) {
  return (
    <div className="w-full max-w-[15rem]">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1b1c22] shadow-lg">
        <div className="relative aspect-[4/3] w-full bg-white/5">
          <Image
            src="/preview-product.png"
            alt=""
            fill
            sizes="240px"
            className="object-cover"
          />
          <span className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-white/80">
            NOVO
          </span>
        </div>
        <div className="p-2.5">
          <p className="line-clamp-2 text-[12px] leading-snug font-medium text-white/95">{title}</p>
          <p className="mt-1.5 font-mono text-[13px] font-semibold text-[#ff8a4c]">
            US$ 12,40<span className="text-[10px] font-normal text-white/40"> /un.</span>
          </p>
          <p className="mt-0.5 text-[10px] text-white/45">
            {description ?? 'Pedido mínimo 500 unidades'}
          </p>
          <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-2">
            <span className="truncate font-mono text-[10px] text-white/40">{source ?? 'fornecedor'}</span>
            <ChevronRight className="size-3.5 text-white/30" aria-hidden />
          </div>
        </div>
      </div>
      <p className="mt-2 pl-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60 uppercase">
        Padrão de marketplace
      </p>
    </div>
  )
}

export function GhostPreview({ style, title, description, source, className }: GhostPreviewProps) {
  const content = { title, description, source }

  return (
    <div className={cn('flex justify-center', className)}>
      {style === 'cloud' ? (
        <CloudPreview {...content} />
      ) : style === 'marketplace' ? (
        <MarketplacePreview {...content} />
      ) : (
        <MessagingPreview {...content} />
      )}
    </div>
  )
}
