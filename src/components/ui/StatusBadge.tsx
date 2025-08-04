// src/components/ui/StatusBadge.tsx

// Definimos as props que nosso componente vai aceitar.
// Neste caso, ele espera receber um 'status'.
type StatusBadgeProps = {
  status: 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando';
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Uma função para determinar a cor de fundo com base no status
  const getColor = () => {
    switch (status) {
      case 'Em Andamento':
        return '#fbbf24'; // Amarelo
      case 'Finalizada':
        return '#10b981'; // Verde
      case 'Fila de Espera':
        return '#6b7280'; // Cinza
      case 'Aguardando':
        return '#ef4444'; // Vermelho
      default:
        return '#6b7280'; // Cinza padrão
    }
  };

  // Estilos para o quadrado de status
  const squareStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    backgroundColor: getColor(),
    borderRadius: '2px',
    marginRight: '8px',
    verticalAlign: 'middle',
  };

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
  };

  return (
    <span style={containerStyle}>
      <span style={squareStyle}></span>
      {status}
    </span>
  );
}
