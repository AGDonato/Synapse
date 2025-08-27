// src/test/components/StatusBadge.test.tsx

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('should render status badge with title tooltip', () => {
    render(<StatusBadge status="Em Andamento" />);
    const badge = screen.getByTitle('Em Andamento');
    expect(badge).toBeInTheDocument();
  });

  it('should render different status types with correct tooltips', () => {
    const { rerender } = render(<StatusBadge status="Em Andamento" />);
    expect(screen.getByTitle('Em Andamento')).toBeInTheDocument();

    rerender(<StatusBadge status="Finalizada" />);
    expect(screen.getByTitle('Finalizada')).toBeInTheDocument();

    rerender(<StatusBadge status="Fila de Espera" />);
    expect(screen.getByTitle('Fila de Espera')).toBeInTheDocument();

    rerender(<StatusBadge status="Aguardando" />);
    expect(screen.getByTitle('Aguardando')).toBeInTheDocument();
  });

  it('should apply correct styles based on status', () => {
    const { rerender } = render(<StatusBadge status="Em Andamento" />);
    let badge = screen.getByTitle('Em Andamento');
    expect(badge).toHaveStyle({ backgroundColor: 'rgb(255, 193, 7)' });

    rerender(<StatusBadge status="Finalizada" />);
    badge = screen.getByTitle('Finalizada');
    expect(badge).toHaveStyle({ backgroundColor: 'rgb(40, 167, 69)' });

    rerender(<StatusBadge status="Fila de Espera" />);
    badge = screen.getByTitle('Fila de Espera');
    expect(badge).toHaveStyle({ backgroundColor: 'rgb(108, 117, 125)' });

    rerender(<StatusBadge status="Aguardando" />);
    badge = screen.getByTitle('Aguardando');
    expect(badge).toHaveStyle({ backgroundColor: 'rgb(220, 53, 69)' });
  });

  it('should render as circular badge', () => {
    render(<StatusBadge status="Em Andamento" />);
    const badge = screen.getByTitle('Em Andamento');
    expect(badge).toHaveStyle({
      width: '12px',
      height: '12px',
      borderRadius: '50%'
    });
  });

  it('should be accessible with title attribute', () => {
    render(<StatusBadge status="Finalizada" />);
    const badge = screen.getByTitle('Finalizada');
    expect(badge).toHaveAttribute('title', 'Finalizada');
  });

  it('should render as a div element', () => {
    render(<StatusBadge status="Em Andamento" />);
    const badge = screen.getByTitle('Em Andamento');
    expect(badge.tagName).toBe('DIV');
  });
});