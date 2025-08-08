// src/components/layout/Sidebar.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

// Icon components
const ChevronRightIcon = () => (
  <svg
    className={styles.expandIcon}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 5l7 7-7 7'
    />
  </svg>
);

const HomeIcon = () => (
  <svg
    className={styles.icon}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    />
  </svg>
);

const FolderIcon = () => (
  <svg
    className={styles.icon}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
    />
  </svg>
);

const DocumentIcon = () => (
  <svg
    className={styles.icon}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    />
  </svg>
);

const ChartIcon = () => (
  <svg
    className={styles.icon}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    />
  </svg>
);

type SidebarProps = {
  isCollapsed?: boolean;
};

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (prefix: string) =>
    location.pathname.startsWith(prefix);

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
    >
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {/* Home */}
          <li className={styles.navItem}>
            <Link
              to='/'
              className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
              title={isCollapsed ? 'Início' : ''}
            >
              <HomeIcon />
              {!isCollapsed && <span>Início</span>}
            </Link>
          </li>

          {/* Demandas */}
          <li className={styles.navItem}>
            <Link
              to='/demandas'
              className={`${styles.navLink} ${isParentActive('/demandas') ? styles.active : ''}`}
              title={isCollapsed ? 'Demandas' : ''}
            >
              <FolderIcon />
              {!isCollapsed && <span>Demandas</span>}
            </Link>
          </li>

          {/* Documentos */}
          <li className={styles.navItem}>
            <Link
              to='/documentos'
              className={`${styles.navLink} ${isParentActive('/documentos') ? styles.active : ''}`}
              title={isCollapsed ? 'Documentos' : ''}
            >
              <DocumentIcon />
              {!isCollapsed && <span>Documentos</span>}
            </Link>
          </li>

          <div className={styles.divider} />

          {/* Relatórios */}
          <li className={styles.navItem}>
            <Link
              to='/relatorios'
              className={`${styles.navLink} ${isParentActive('/relatorios') ? styles.active : ''}`}
              title={isCollapsed ? 'Relatórios' : ''}
            >
              <ChartIcon />
              {!isCollapsed && <span>Relatórios</span>}
            </Link>
          </li>

          {!isCollapsed && <div className={styles.divider} />}

          {/* Cadastros - só aparece quando expandida */}
          {!isCollapsed && (
            <li className={styles.navItem}>
              <button
                className={`${styles.sectionLabel} ${cadastrosOpen ? styles.expanded : ''}`}
                onClick={() => setCadastrosOpen(!cadastrosOpen)}
                aria-expanded={cadastrosOpen}
              >
                <span>Cadastros</span>
                <ChevronRightIcon />
              </button>

              <div
                className={`${styles.subMenu} ${!cadastrosOpen ? styles.subMenuHidden : ''}`}
              >
                <Link
                  to='/cadastros/assuntos'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/assuntos') ? styles.active : ''}`}
                >
                  Assuntos
                </Link>
                <Link
                  to='/cadastros/autoridades'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/autoridades') ? styles.active : ''}`}
                >
                  Autoridades
                </Link>
                <Link
                  to='/cadastros/orgaos'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/orgaos') ? styles.active : ''}`}
                >
                  Órgãos
                </Link>
                <Link
                  to='/cadastros/tipos-documentos'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/tipos-documentos') ? styles.active : ''}`}
                >
                  Tipos de Documentos
                </Link>
                <Link
                  to='/cadastros/distribuidores'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/distribuidores') ? styles.active : ''}`}
                >
                  Distribuidores
                </Link>
                <Link
                  to='/cadastros/provedores'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/provedores') ? styles.active : ''}`}
                >
                  Provedores
                </Link>
                <Link
                  to='/cadastros/tipos-demandas'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/tipos-demandas') ? styles.active : ''}`}
                >
                  Tipos de Demandas
                </Link>
                <Link
                  to='/cadastros/tipos-identificadores'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/tipos-identificadores') ? styles.active : ''}`}
                >
                  Tipos de Identificadores
                </Link>
                <Link
                  to='/cadastros/tipos-midias'
                  className={`${styles.subMenuLink} ${isActive('/cadastros/tipos-midias') ? styles.active : ''}`}
                >
                  Tipos de Mídias
                </Link>
              </div>
            </li>
          )}

          {/* Configurações - só aparece quando expandida */}
          {!isCollapsed && (
            <li className={styles.navItem}>
              <button
                className={`${styles.sectionLabel} ${configOpen ? styles.expanded : ''}`}
                onClick={() => setConfigOpen(!configOpen)}
                aria-expanded={configOpen}
              >
                <span>Configurações</span>
                <ChevronRightIcon />
              </button>

              <div
                className={`${styles.subMenu} ${!configOpen ? styles.subMenuHidden : ''}`}
              >
                <Link
                  to='/configuracoes/regras'
                  className={`${styles.subMenuLink} ${isActive('/configuracoes/regras') ? styles.active : ''}`}
                >
                  Regras
                </Link>
                <Link
                  to='/configuracoes/sistema'
                  className={`${styles.subMenuLink} ${isActive('/configuracoes/sistema') ? styles.active : ''}`}
                >
                  Sistema
                </Link>
              </div>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
