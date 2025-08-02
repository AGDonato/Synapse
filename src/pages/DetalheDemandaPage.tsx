// src/pages/DetalheDemandaPage.tsx
import { useParams, Link } from 'react-router-dom';
import { mockDemandas } from '../data/mockDemandas';
import StatusBadge from '../components/ui/StatusBadge';

export default function DetalheDemandaPage() {
  // 1. Usamos o hook useParams para pegar os parâmetros da URL.
  // O nome 'demandaId' deve ser o mesmo que definiremos na rota.
  const { demandaId } = useParams();

  // 2. Procuramos a demanda em nossos dados usando o ID da URL.
  // Usamos 'parseInt' porque o ID da URL vem como string.
  const demanda = mockDemandas.find((d) => d.id === parseInt(demandaId || ''));

  // 3. Se a demanda não for encontrada, mostramos uma mensagem.
  if (!demanda) {
    return (
      <div>
        <h2>Demanda não encontrada</h2>
        <p>Não foi possível encontrar uma demanda com o ID fornecido.</p>
        <Link to='/demandas'>Voltar para a lista</Link>
      </div>
    );
  }

  // 4. Se a demanda for encontrada, exibimos seus detalhes.
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Detalhes da Demanda</h2>
        <Link to='/demandas'>Voltar para a lista</Link>
      </div>
      <div style={{ marginTop: '1.5rem', lineHeight: '1.8' }}>
        <p>
          <strong>SGED:</strong> {demanda.sged}
        </p>
        <p>
          <strong>Assunto:</strong> {demanda.assunto}
        </p>
        <p>
          <strong>Órgão Solicitante:</strong> {demanda.orgao}
        </p>
        <p>
          <strong>Status:</strong> <StatusBadge status={demanda.status} />
        </p>
      </div>
    </div>
  );
}
