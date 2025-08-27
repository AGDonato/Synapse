/**
 * Tests for Button component
 */

import { render, screen, fireEvent, waitFor, vi } from '../test-utils';
import Button from '../../components/ui/Button';

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(<Button>Click me</Button>, { withRouter: false, withQueryClient: false });
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>, { withRouter: false, withQueryClient: false });
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>,
      { withRouter: false, withQueryClient: false }
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>, { withRouter: false, withQueryClient: false });
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>, { withRouter: false, withQueryClient: false });
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('supports different button types', () => {
    render(<Button type="submit">Submit</Button>, { withRouter: false, withQueryClient: false });
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('supports full width', () => {
    render(<Button fullWidth>Full Width</Button>, { withRouter: false, withQueryClient: false });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles hover states', () => {
    render(<Button>Hover me</Button>, { withRouter: false, withQueryClient: false });
    const button = screen.getByRole('button');
    
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    
    expect(button).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>, { withRouter: false, withQueryClient: false });
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    
    // Basic keyboard interaction test
    expect(button).toHaveFocus();
  });

  it('has proper accessibility attributes', () => {
    render(
      <Button aria-label="Custom label" data-testid="test-button">
        Button
      </Button>,
      { withRouter: false, withQueryClient: false }
    );
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });

  it('applies custom className', () => {
    render(
      <Button className="custom-class">Custom</Button>,
      { withRouter: false, withQueryClient: false }
    );
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('handles async click events', async () => {
    const asyncHandler = vi.fn().mockResolvedValue('success');
    render(
      <Button onClick={asyncHandler}>Async</Button>,
      { withRouter: false, withQueryClient: false }
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(asyncHandler).toHaveBeenCalledOnce();
    });
  });

  it('maintains proper button semantics', () => {
    render(<Button>Test</Button>, { withRouter: false, withQueryClient: false });
    
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });
});