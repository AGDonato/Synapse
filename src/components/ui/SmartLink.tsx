// src/components/ui/SmartLink.tsx

import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { preloadOnHover } from '../../router/lazyRoutes';

interface SmartLinkProps extends LinkProps {
  preloadRoute?: () => Promise<any>;
  children: React.ReactNode;
  className?: string;
}

export const SmartLink: React.FC<SmartLinkProps> = ({
  preloadRoute,
  children,
  className,
  ...linkProps
}) => {
  const preloadHandlers = preloadRoute ? preloadOnHover(preloadRoute) : {};

  return (
    <Link
      {...linkProps}
      className={className}
      {...preloadHandlers}
    >
      {children}
    </Link>
  );
};

// Links específicos com preload automático
export const DemandasLink: React.FC<Omit<SmartLinkProps, 'preloadRoute'>> = (props) => (
  <SmartLink
    {...props}
    preloadRoute={() => import('../../pages/DemandasPage')}
  />
);

export const DocumentosLink: React.FC<Omit<SmartLinkProps, 'preloadRoute'>> = (props) => (
  <SmartLink
    {...props}
    preloadRoute={() => import('../../pages/DocumentosPage')}
  />
);

export const HomeLink: React.FC<Omit<SmartLinkProps, 'preloadRoute'>> = (props) => (
  <SmartLink
    {...props}
    preloadRoute={() => import('../../pages/HomePage')}
  />
);

export const CadastrosLink: React.FC<Omit<SmartLinkProps, 'preloadRoute'>> = (props) => (
  <SmartLink
    {...props}
    preloadRoute={() => import('../../pages/CadastrosPage')}
  />
);

export const RelatoriosLink: React.FC<Omit<SmartLinkProps, 'preloadRoute'>> = (props) => (
  <SmartLink
    {...props}
    preloadRoute={() => import('../../pages/RelatoriosPage')}
  />
);