// src/design-system/index.ts
// Enterprise Design System - Synapse

// Tokens
export { designTokens, colors, typography, spacing, borderRadius, shadows, zIndex, animation, breakpoints, components, themes } from './tokens';

// Components
export { Button, ButtonGroup } from './components/Button/Button';
export type { ButtonProps, ButtonGroupProps } from './components/Button/Button';

export { Input, Textarea } from './components/Input/Input';
export type { InputProps, TextareaProps } from './components/Input/Input';

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter, 
  CardImage, 
  CardActionArea 
} from './components/Card/Card';
export type { 
  CardProps, 
  CardHeaderProps, 
  CardTitleProps, 
  CardDescriptionProps, 
  CardContentProps, 
  CardFooterProps, 
  CardImageProps, 
  CardActionAreaProps 
} from './components/Card/Card';

// Utilities
export { cn } from './utils/cn';

// Re-export default Card compound component
import CardDefault from './components/Card/Card';
export { CardDefault as CardCompound };

// Design System Provider (for theme management)
export { DesignSystemProvider, useDesignSystem } from './provider/DesignSystemProvider';
export type { DesignSystemConfig, Theme } from './provider/DesignSystemProvider';