export const getSectionHeaderStyle = (isOpen: boolean, isHovered = false): React.CSSProperties => ({
  padding: `${'1rem'} ${'1.25rem'}`,
  backgroundColor: isOpen ? '#f8fafc' : isHovered ? '#f1f5f9' : 'transparent',
  borderBottom: isOpen ? `1px solid ${'#e2e8f0'}` : 'none',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '1.125rem',
  fontWeight: '600',
  color: '#1e293b',
  transition: 'all 0.2s ease',
  userSelect: 'none',
});

export const dynamicStyles = {
  sectionHeader: (isOpen: boolean, isHovered = false) =>
    ({
      padding: `${'1rem'} ${'1.25rem'}`,
      backgroundColor: isOpen ? '#f8fafc' : isHovered ? '#f1f5f9' : 'transparent',
      borderBottom: isOpen ? `1px solid ${'#e2e8f0'}` : 'none',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1e293b',
      transition: 'all 0.2s ease',
      userSelect: 'none',
    }) as React.CSSProperties,

  tabButton: (isActive: boolean) =>
    ({
      padding: `${'0.75rem'} ${'1rem'}`,
      border: 'none',
      borderBottom: `3px solid ${isActive ? '#3b82f6' : 'transparent'}`,
      backgroundColor: isActive ? '#f8fafc' : 'transparent',
      cursor: 'pointer',
      fontWeight: isActive ? '600' : '400',
      fontSize: '0.875rem',
      color: isActive ? '#3b82f6' : '#64748b',
      transition: 'all 0.2s ease',
      borderRadius: `${'0.375rem'} ${'0.375rem'} 0 0`,
    }) as React.CSSProperties,

  pageDescription: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.4',
  } as React.CSSProperties,

  subSectionTitle: {
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
};
