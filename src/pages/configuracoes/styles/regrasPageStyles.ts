export const getSectionHeaderStyle = (isOpen: boolean, isHovered = false): React.CSSProperties => ({
  padding: `${'1rem'} ${'1.25rem'}`,
  backgroundColor: isOpen
    ? 'var(--bg-secondary)'
    : isHovered
      ? 'var(--bg-tertiary)'
      : 'transparent',
  borderBottom: isOpen ? `1px solid ${'var(--border-primary)'}` : 'none',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '1.125rem',
  fontWeight: '600',
  color: 'var(--text-primary)',
  transition: 'all 0.2s ease',
  userSelect: 'none',
});

export const dynamicStyles = {
  sectionHeader: (isOpen: boolean, isHovered = false) =>
    ({
      padding: `${'1rem'} ${'1.25rem'}`,
      backgroundColor: isOpen
        ? 'var(--bg-secondary)'
        : isHovered
          ? 'var(--bg-tertiary)'
          : 'transparent',
      borderBottom: isOpen ? `1px solid ${'var(--border-primary)'}` : 'none',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      transition: 'all 0.2s ease',
      userSelect: 'none',
    }) as React.CSSProperties,

  tabButton: (isActive: boolean) =>
    ({
      padding: `${'0.75rem'} ${'1rem'}`,
      border: 'none',
      borderBottom: `3px solid ${isActive ? '#3b82f6' : 'transparent'}`,
      backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
      cursor: 'pointer',
      fontWeight: isActive ? '600' : '400',
      fontSize: '0.875rem',
      color: isActive ? '#3b82f6' : 'var(--text-secondary)',
      transition: 'all 0.2s ease',
      borderRadius: `${'0.375rem'} ${'0.375rem'} 0 0`,
    }) as React.CSSProperties,

  pageDescription: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: '1.4',
  } as React.CSSProperties,

  subSectionTitle: {
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
};
