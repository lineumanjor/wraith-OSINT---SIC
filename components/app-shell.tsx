const NAV_GROUPS = [
  {
    label: 'Visão geral',
    items: [
      { href: '/', label: 'Investigações', short: 'Investigações', icon: FolderSearch, code: '01' },
      { href: '/dashboard', label: 'Painel operacional', short: 'Painel', icon: Radar, code: '02' },
    ],
  },
  {
    label: 'Análise',
    items: [
      { href: '/pivotagem', label: 'Pivotagem gráfica', short: 'Pivotagem', icon: GitFork, code: '03' },
    ],
  },
  {
    label: 'Referências',
    items: [
      { href: '/framework-osint', label: 'Framework OSINT', short: 'Framework', icon: BookOpen, code: '04' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/terminal', label: 'Spectre Terminal', short: 'Terminal', icon: SquareTerminal, code: '05' },
      { href: '/forge', label: 'Link Forge', short: 'Forge', icon: Link2, code: '06' },
      { href: '/preview', label: 'Ghost Preview', short: 'Preview', icon: Eye, code: '07' },
      { href: '/engine', label: 'Spectre Engine', short: 'Engine', icon: Cpu, code: '08' },
      { href: '/sandbox', label: 'Simulador de Treino', short: 'Treino', icon: ShieldCheck, code: '09' },
    ],
  },
]