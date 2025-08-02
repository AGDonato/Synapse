// src/components/ui/StatusBadge.tsx

// Definimos as props que nosso componente vai aceitar.
// Neste caso, ele espera receber um 'status'.
type StatusBadgeProps = {
  status: 'Pendente' | 'Em andamento' | 'Concluída';
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Uma função para determinar a cor de fundo com base no status
  const getColor = () => {
    switch (status) {
      case 'Concluída':
        return '#dcfce7'; // Verde claro
      case 'Em andamento':
        return '#dbeafe'; // Azul claro
      case 'Pendente':
        return '#fef9c3'; // Amarelo claro
      default:
        return '#f3f4f6'; // Cinza padrão
    }
  };

  // Estilos para o nosso "selo" de status
  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: getColor(), // A cor é definida dinamicamente
  };

  return <span style={badgeStyle}>{status}</span>;
}
