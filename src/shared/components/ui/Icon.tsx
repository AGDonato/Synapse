import React from 'react';
import {
  // Navegação e UI
  Home,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,

  // Status e Estados
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  Hourglass,
  Loader,

  // Documentos e Dados
  File,
  FileImage,
  FileVideo,
  Database,
  Archive,
  Folder,
  FolderOpen,

  // Análise e Charts
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  MapPin,

  // Ações
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Save,
  Send,
  Mail,
  Phone,

  // Institucional
  Building2,
  Scale,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Gavel,

  // Outros
  Star,
  Heart,
  Bookmark,
  Flag,
  Tag,
  Link,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { createModuleLogger } from '../../utils/logger';

const logger = createModuleLogger('Icon');

// Mapeamento de nomes para ícones
const iconMap = {
  // Navegação e UI
  home: Home,
  'file-text': FileText,
  users: Users,
  settings: Settings,
  menu: Menu,
  x: X,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  eye: Eye,
  search: Search,
  filter: Filter,
  refresh: RefreshCw,
  download: Download,
  upload: Upload,

  // Status e Estados
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  info: Info,
  clock: Clock,
  hourglass: Hourglass,
  loader: Loader,

  // Documentos e Dados
  file: File,
  'file-image': FileImage,
  'file-video': FileVideo,
  database: Database,
  archive: Archive,
  folder: Folder,
  'folder-open': FolderOpen,

  // Análise e Charts
  'bar-chart': BarChart3,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  activity: Activity,
  calendar: Calendar,
  'map-pin': MapPin,

  // Ações
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash2,
  copy: Copy,
  save: Save,
  send: Send,
  mail: Mail,
  phone: Phone,

  // Institucional - específico para órgão público
  building: Building2,
  scales: Scale,
  'shield-check': ShieldCheck,
  'user-check': UserCheck,
  'file-check': FileCheck,
  gavel: Gavel,

  // Outros
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  tag: Tag,
  link: Link,
  'external-link': ExternalLink,
} as const;

export type IconName = keyof typeof iconMap;

export interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
  className?: string;
  strokeWidth?: number;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Componente Icon unificado usando Lucide React
 *
 * Centraliza todos os ícones da aplicação com props consistentes.
 * Adequado para órgão público com ícones profissionais e acessíveis.
 *
 * @example
 * <Icon name="home" size={24} />
 * <Icon name="check-circle" color="var(--color-success-600)" />
 * <Icon name="alert-triangle" className="text-warning" />
 */
export default function Icon({
  name,
  size = 20,
  color = 'currentColor',
  className = '',
  strokeWidth = 2,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  onClick,
  style,
  ...props
}: IconProps) {
  const IconComponent = iconMap[name] as LucideIcon;

  if (!IconComponent) {
    logger.warn(`Icon "${name}" não encontrado no mapeamento de ícones`);
    return null;
  }

  const iconProps = {
    size,
    color,
    strokeWidth,
    className: `synapse-icon ${className}`.trim(),
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden ?? (ariaLabel ? false : true),
    onClick,
    role: onClick ? 'button' : ariaLabel ? 'img' : 'presentation',
    tabIndex: onClick ? 0 : -1,
    style: {
      // Garantir que o ícone seja acessível
      minWidth: size,
      minHeight: size,
      flexShrink: 0,
      // Aplicar cor usando CSS custom properties quando apropriado
      ...(color.startsWith('--') && { color: `var(${color})` }),
      // Cursor apropriado
      cursor: onClick ? 'pointer' : 'default',
      // Focus outline se clicável
      ...(onClick && {
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-1)',
      }),
      ...style,
    },
    // Navegação por teclado se clicável
    ...(onClick && {
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      },
    }),
    ...props,
  };

  return <IconComponent {...iconProps} />;
}

// Componente auxiliar para ícones de loading
export function LoadingIcon({ size = 20, className = '', ...props }: Omit<IconProps, 'name'>) {
  return (
    <Icon
      name='loader'
      size={size}
      className={`animate-spin ${className}`}
      {...props}
      style={{
        animation: 'spin 1s linear infinite',
        ...props.style,
      }}
    />
  );
}

// Componente auxiliar para ícones de status
export function StatusIcon({
  status,
  size = 20,
  className = '',
  ...props
}: Omit<IconProps, 'name'> & {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
}) {
  const statusConfig = {
    success: {
      name: 'check-circle' as const,
      color: 'var(--color-success-600)',
    },
    error: { name: 'x-circle' as const, color: 'var(--color-error-600)' },
    warning: {
      name: 'alert-triangle' as const,
      color: 'var(--color-warning-600)',
    },
    info: { name: 'info' as const, color: 'var(--color-primary-600)' },
    loading: { name: 'loader' as const, color: 'var(--color-gray-600)' },
  };

  const config = statusConfig[status];

  return (
    <Icon
      name={config.name}
      size={size}
      color={config.color}
      className={status === 'loading' ? `animate-spin ${className}` : className}
      {...props}
    />
  );
}

// Animação CSS inline para compatibilidade
if (typeof document !== 'undefined' && !document.querySelector('#synapse-icon-animations')) {
  const style = document.createElement('style');
  style.id = 'synapse-icon-animations';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
}
