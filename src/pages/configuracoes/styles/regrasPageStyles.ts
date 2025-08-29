import { theme } from '../../../styles/theme';

export const getSectionHeaderStyle = (isOpen: boolean, isHovered = false): React.CSSProperties => ({
  padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
  backgroundColor: isOpen
    ? theme.colors.background.secondary
    : isHovered
      ? theme.colors.background.muted
      : 'transparent',
  borderBottom: isOpen ? `1px solid ${theme.colors.border}` : 'none',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: theme.fontSize.lg,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.text.primary,
  transition: 'all 0.2s ease',
  userSelect: 'none',
});

export const dynamicStyles = {
  sectionHeader: (isOpen: boolean, isHovered = false) =>
    ({
      padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      backgroundColor: isOpen
        ? theme.colors.background.secondary
        : isHovered
          ? theme.colors.background.muted
          : 'transparent',
      borderBottom: isOpen ? `1px solid ${theme.colors.border}` : 'none',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text.primary,
      transition: 'all 0.2s ease',
      userSelect: 'none',
    }) as React.CSSProperties,

  tabButton: (isActive: boolean) =>
    ({
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      border: 'none',
      borderBottom: `3px solid ${isActive ? theme.colors.primary : 'transparent'}`,
      backgroundColor: isActive ? theme.colors.background.secondary : 'transparent',
      cursor: 'pointer',
      fontWeight: isActive ? theme.fontWeight.semibold : theme.fontWeight.normal,
      fontSize: theme.fontSize.sm,
      color: isActive ? theme.colors.primary : theme.colors.text.secondary,
      transition: 'all 0.2s ease',
      borderRadius: `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`,
    }) as React.CSSProperties,

  pageDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    margin: 0,
    lineHeight: '1.4',
  } as React.CSSProperties,

  subSectionTitle: {
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  } as React.CSSProperties,
};
