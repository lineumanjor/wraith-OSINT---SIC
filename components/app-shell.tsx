const NAV_GROUPS = [
  {
    label: 'Visão geral',
    items: [
      { href: '/', label: 'Investigações', short: 'Investigações', icon: FolderSearch, code: '01' },
      { href: '/dashboard', label: 'Painel operacional', short: 'Painel', icon: Radar, code: '02' },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { href: '/pivotagem', label: 'Pivotagem gráfica', short: 'Pivotagem', icon: GitFork, code: '03' },
      { href: '/framework-osint', label: 'Framework OSINT', short: 'Framework', icon: BookOpen, code: '04' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/forge', label: 'Link Forge', short: 'Forge', icon: Link2, code: '05' },
      { href: '/engine', label: 'Spectre Engine', short: 'Engine', icon: Cpu, code: '06' },
      { href: '/terminal', label: 'Spectre Terminal', short: 'Terminal', icon: SquareTerminal, code: '07' },
      { href: '/preview', label: 'Ghost Preview', short: 'Preview', icon: Eye, code: '08' },
      { href: '/fort', label: 'Testes locais', short: 'Fort', icon: ShieldCheck, code: '09' },
    ],
  },
]