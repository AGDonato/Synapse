// src/components/ui/StatusBadge.tsx

import React from 'react';

// Definimos as props que nosso componente vai aceitar.
// Neste caso, ele espera receber um 'status'.
interface StatusBadgeProps {
  status: 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando';
}

const StatusBadge = React.memo<StatusBadgeProps>(({ status }) => {
  // Uma função para determinar a cor de fundo com base no status
  const getColor = () => {
    switch (status) {
      case 'Em Andamento':
        return '#FFC107'; // Amarelo
      case 'Finalizada':
        return '#28A745'; // Verde
      case 'Fila de Espera':
        return '#6C757D'; // Cinza
      case 'Aguardando':
        return '#DC3545'; // Vermelho
      default:
        return '#6C757D'; // Cinza padrão
    }
  };

  // Estilos para a bolinha de status
  const circleStyle: React.CSSProperties = {
    width: '12px',
    height: '12px',
    backgroundColor: getColor(),
    borderRadius: '50%',
    margin: '0 auto',
  };

  return <div style={circleStyle} title={status} />;
});

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
