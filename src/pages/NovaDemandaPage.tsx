// src/pages/NovaDemandaPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import SearchableSelect, {
  type Option,
} from '../components/forms/SearchableSelect';
import { useDemandas } from '../hooks/useDemandas';

// Importando dados para os selects
import { mockTiposDemandas } from '../data/mockTiposDemandas';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockDistribuidores } from '../data/mockDistribuidores';

// Tipo do formulário
type FormDataState = {
  tipoDemanda: Option | null;
  solicitante: Option | null;
  dataInicial: string;
  descricao: string;
  sged: string;
  autosAdministrativos: string;
  pic: string;
  autosJudiciais: string;
  autosExtrajudiciais: string;
  alvos: number | '';
  identificadores: number | '';
  analista: Option | null;
  distribuidor: Option | null;
};

// Estilos
const formContainerStyle: React.CSSProperties = {
  padding: '1rem 2rem',
  backgroundColor: '#fff',
  borderRadius: '8px',
  maxWidth: '900px',
  margin: '0 auto',
};
const formHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '1rem',
  borderBottom: '1px solid #eee',
};
const formSectionStyle: React.CSSProperties = {
  marginTop: '2rem',
  borderTop: '1px solid #eee',
  paddingTop: '2rem',
};
const formGroupStyle: React.CSSProperties = { marginBottom: '1.5rem' };
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: 'bold',
  fontSize: '14px',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  boxSizing: 'border-box',
  borderRadius: '4px',
  border: '1px solid #ccc',
};
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1.5rem',
};

export default function NovaDemandaPage() {
  const { addDemanda } = useDemandas();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormDataState>({
    tipoDemanda: null,
    solicitante: null,
    dataInicial: '',
    descricao: '',
    sged: '',
    autosAdministrativos: '',
    pic: '',
    autosJudiciais: '',
    autosExtrajudiciais: '',
    alvos: '',
    identificadores: '',
    analista: null,
    distribuidor: null,
  });

  const idsDosSolicitantes = mockRegrasOrgaos
    .filter((regra) => regra.isSolicitante)
    .map((regra) => regra.orgaoId);
  const orgaosSolicitantes = mockOrgaos.filter((orgao) =>
    idsDosSolicitantes.includes(orgao.id)
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || '' : value,
    }));
  };

  const handleSelectChange = (
    name: keyof FormDataState,
    selected: Option | null
  ) => {
    setFormData((prev) => ({ ...prev, [name]: selected }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dadosParaSalvar = {
      sged: formData.sged,
      tipoDemanda: formData.tipoDemanda?.nome || 'Não especificado',
      autosAdministrativos: formData.autosAdministrativos,
      assunto:
        formData.descricao.substring(0, 50) +
        (formData.descricao.length > 50 ? '...' : ''),
      orgao: formData.solicitante?.nome || 'Não especificado',
      status: 'Pendente' as const,
      analista: formData.analista?.nome || 'Não atribuído',
      dataInicial: formData.dataInicial,
      dataFinal: null,
    };

    addDemanda(dadosParaSalvar);

    alert('Nova demanda adicionada com sucesso!');
    navigate('/demandas');
  };

  return (
    <div style={formContainerStyle}>
      <header style={formHeaderStyle}>
        <h2>Nova Demanda</h2>
        <Link to='/demandas'>
          <Button>Voltar</Button>
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <div style={formSectionStyle}>
          <h3>01. Informações Básicas</h3>
          <div style={gridStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Tipo de Demanda *</label>
              <SearchableSelect
                options={mockTiposDemandas}
                value={formData.tipoDemanda}
                onChange={(selected) =>
                  handleSelectChange('tipoDemanda', selected)
                }
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Solicitante *</label>
              <SearchableSelect
                options={orgaosSolicitantes.map((o) => ({
                  id: o.id,
                  nome: `${o.abreviacao} - ${o.nomeCompleto}`,
                }))}
                value={formData.solicitante}
                onChange={(selected) =>
                  handleSelectChange('solicitante', selected)
                }
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor='dataInicial'>
                Data Inicial *
              </label>
              <input
                type='date'
                name='dataInicial'
                id='dataInicial'
                value={formData.dataInicial}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor='descricao'>
              Descrição *
            </label>
            <textarea
              name='descricao'
              id='descricao'
              value={formData.descricao}
              onChange={handleChange}
              style={{ ...inputStyle, height: '100px' }}
              required
              maxLength={240}
            ></textarea>
            <small style={{ float: 'right' }}>
              {formData.descricao.length}/240
            </small>
          </div>
        </div>

        <div style={formSectionStyle}>
          <h3>02. Referências</h3>
          <div style={gridStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor='sged'>
                SGED *
              </label>
              <input
                type='text'
                name='sged'
                id='sged'
                value={formData.sged}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor='autosAdministrativos'>
                Autos Administrativos *
              </label>
              <input
                type='text'
                name='autosAdministrativos'
                id='autosAdministrativos'
                value={formData.autosAdministrativos}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor='pic'>
                PIC
              </label>
              <input
                type='text'
                name='pic'
                id='pic'
                value={formData.pic}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor='autosJudiciais'>
                Autos Judiciais
              </label>
              <input
                type='text'
                name='autosJudiciais'
                id='autosJudiciais'
                value={formData.autosJudiciais}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={formSectionStyle}>
          <h3>03. Estatísticas Iniciais</h3>
          <div style={gridStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor='alvos'>
                Alvos *
              </label>
              <input
                type='number'
                name='alvos'
                id='alvos'
                value={formData.alvos}
                onChange={handleChange}
                style={inputStyle}
                min='0'
                required
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor='identificadores'>
                Identificadores *
              </label>
              <input
                type='number'
                name='identificadores'
                id='identificadores'
                value={formData.identificadores}
                onChange={handleChange}
                style={inputStyle}
                min='0'
                required
              />
            </div>
          </div>
        </div>

        <div style={formSectionStyle}>
          <h3>04. Responsáveis</h3>
          <div style={gridStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Analista *</label>
              <SearchableSelect
                options={mockDistribuidores}
                value={formData.analista}
                onChange={(selected) =>
                  handleSelectChange('analista', selected)
                }
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Distribuidor *</label>
              <SearchableSelect
                options={mockDistribuidores}
                value={formData.distribuidor}
                onChange={(selected) =>
                  handleSelectChange('distribuidor', selected)
                }
              />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '2rem',
            borderTop: '1px solid #eee',
            paddingTop: '1rem',
            textAlign: 'right',
          }}
        >
          <Button type='submit'>Cadastrar Demanda</Button>
        </div>
      </form>
    </div>
  );
}
