/**
 * TESTES DO COMPONENTE BUTTON
 *
 * Este arquivo contém todos os testes unitários para o componente Button.
 * Testa funcionalidades como:
 * - Renderização básica com diferentes props
 * - Variantes visuais (primary, secondary, outline, etc.)
 * - Tamanhos (sm, md, lg)
 * - Estados (disabled, loading, fullWidth)
 * - Eventos de click
 * - Acessibilidade (aria-busy, disabled)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils';
import Button from '../../components/ui/Button';

// Garante que os tipos dos matchers sejam reconhecidos
import '@testing-library/jest-dom';

describe('Button Component', () => {
  it('renderiza o botão com texto corretamente', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument();
  });

  it('executa onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clique</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('não executa onClick quando disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Botão Desabilitado
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('não executa onClick quando loading', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} loading>
        Carregando
      </Button>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renderiza spinner quando loading=true', () => {
    render(<Button loading>Carregando</Button>);

    // Verifica se o SVG do spinner está presente
    const spinner = screen.getByRole('button').querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('aplica classes corretas para variante primary', () => {
    render(<Button variant='primary'>Primary</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('aplica classes corretas para variante secondary', () => {
    render(<Button variant='secondary'>Secondary</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-gray-100', 'text-gray-900');
  });

  it('aplica classes corretas para variante error', () => {
    render(<Button variant='error'>Error</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-red-600', 'text-white');
  });

  it('aplica classes corretas para tamanho small', () => {
    render(<Button size='sm'>Small</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('text-sm', 'px-3', 'py-1.5');
  });

  it('aplica classes corretas para tamanho large', () => {
    render(<Button size='lg'>Large</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('text-base', 'px-6', 'py-3');
  });

  it('aplica classe fullWidth quando prop é true', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('w-full');
  });

  it('aplica type correto no elemento button', () => {
    render(<Button type='submit'>Submit</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('type', 'submit');
  });

  it('combina className customizada com classes padrão', () => {
    render(<Button className='custom-class'>Custom</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-blue-600'); // Classe padrão também deve estar presente
  });
});
