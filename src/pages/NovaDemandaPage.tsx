// src/pages/NovaDemandaPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SearchableSelect, {
  type Option,
} from '../components/forms/SearchableSelect';
import { useDemandas } from '../hooks/useDemandas';
import styles from './NovaDemandaPage.module.css';

// Importando dados para os selects
import { mockTiposDemandas } from '../data/mockTiposDemandas';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockDistribuidores } from '../data/mockDistribuidores';
import { mockAnalistas } from '../data/mockAnalistas';

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

export default function NovaDemandaPage() {
  const { demandas, addDemanda, updateDemanda } = useDemandas();
  const navigate = useNavigate();
  const { demandaId } = useParams();
  const isEditMode = Boolean(demandaId);

  // Prepare dados dos órgãos solicitantes
  const idsDosSolicitantes = mockRegrasOrgaos
    .filter((regra) => regra.isSolicitante)
    .map((regra) => regra.orgaoId);
  const orgaosSolicitantes = mockOrgaos.filter((orgao) =>
    idsDosSolicitantes.includes(orgao.id)
  );

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

  // Carregar dados da demanda quando estiver em modo de edição
  useEffect(() => {
    if (isEditMode && demandaId) {
      const demanda = demandas.find((d) => d.id === parseInt(demandaId));
      if (demanda) {
        setFormData({
          tipoDemanda:
            mockTiposDemandas.find((t) => t.nome === demanda.tipoDemanda) ||
            null,
          solicitante: orgaosSolicitantes.find(
            (o) =>
              o.nomeCompleto === demanda.orgao || o.abreviacao === demanda.orgao
          )
            ? { id: 0, nome: demanda.orgao }
            : null,
          dataInicial: demanda.dataInicial || '',
          descricao: demanda.assunto || '',
          sged: demanda.sged || '',
          autosAdministrativos: demanda.autosAdministrativos || '',
          pic: '',
          autosJudiciais: '',
          autosExtrajudiciais: '',
          alvos: '',
          identificadores: '',
          analista:
            mockAnalistas.find((d) => d.nome === demanda.analista) || null,
          distribuidor: null,
        });
      }
    }
  }, [isEditMode, demandaId, demandas, orgaosSolicitantes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number' ? (value === '' ? '' : parseInt(value) || 0) : value,
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
      status: 'Fila de Espera' as const,
      analista: formData.analista?.nome || 'Não atribuído',
      dataInicial: formData.dataInicial,
      dataFinal: null,
    };

    if (isEditMode && demandaId) {
      updateDemanda(parseInt(demandaId), dadosParaSalvar);
      alert('Demanda atualizada com sucesso!');
    } else {
      addDemanda(dadosParaSalvar);
      alert('Nova demanda adicionada com sucesso!');
    }

    navigate('/demandas');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        <header className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEditMode ? 'Editar Demanda' : 'Nova Demanda'}
          </h2>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path
                fillRule='evenodd'
                d='M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z'
              />
            </svg>
            Voltar
          </button>
        </header>

        <div className={styles.formContent}>
          <form onSubmit={handleSubmit}>
            <div className={styles.sectionsGrid}>
              {/* Seção 01 - Informações Básicas */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>01. Informações Básicas</h3>
                <div className={styles.sectionContent}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Tipo de Demanda <span className={styles.required}>*</span>
                    </label>
                    <SearchableSelect
                      options={mockTiposDemandas}
                      value={formData.tipoDemanda}
                      onChange={(selected) =>
                        handleSelectChange('tipoDemanda', selected)
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Solicitante <span className={styles.required}>*</span>
                    </label>
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
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor='dataInicial'>
                      Data Inicial <span className={styles.required}>*</span>
                    </label>
                    <input
                      type='date'
                      name='dataInicial'
                      id='dataInicial'
                      value={formData.dataInicial}
                      onChange={handleChange}
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor='descricao'>
                      Descrição <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      name='descricao'
                      id='descricao'
                      value={formData.descricao}
                      onChange={handleChange}
                      className={styles.formTextarea}
                      required
                      maxLength={240}
                    ></textarea>
                    <div className={styles.characterCount}>
                      {formData.descricao.length}/240
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 02 - Referências */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>02. Referências</h3>
                <div className={styles.sectionContent}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor='sged'>
                      SGED <span className={styles.required}>*</span>
                    </label>
                    <input
                      type='text'
                      name='sged'
                      id='sged'
                      value={formData.sged}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete='off'
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor='autosAdministrativos'
                    >
                      Autos Administrativos
                    </label>
                    <input
                      type='text'
                      name='autosAdministrativos'
                      id='autosAdministrativos'
                      value={formData.autosAdministrativos}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete='off'
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor='pic'>
                      PIC
                    </label>
                    <input
                      type='text'
                      name='pic'
                      id='pic'
                      value={formData.pic}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete='off'
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor='autosJudiciais'
                    >
                      Autos Judiciais
                    </label>
                    <input
                      type='text'
                      name='autosJudiciais'
                      id='autosJudiciais'
                      value={formData.autosJudiciais}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete='off'
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor='autosExtrajudiciais'
                    >
                      Autos Extrajudiciais
                    </label>
                    <input
                      type='text'
                      name='autosExtrajudiciais'
                      id='autosExtrajudiciais'
                      value={formData.autosExtrajudiciais}
                      onChange={handleChange}
                      className={styles.formInput}
                      autoComplete='off'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sectionsGrid}>
              {/* Seção 03 - Estatísticas Iniciais */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  03. Estatísticas Iniciais
                </h3>
                <div className={styles.sectionContent}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor='alvos'>
                      Alvos <span className={styles.required}>*</span>
                    </label>
                    <input
                      type='number'
                      name='alvos'
                      id='alvos'
                      value={formData.alvos}
                      onChange={handleChange}
                      className={styles.formInput}
                      min='0'
                      step='1'
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label
                      className={styles.formLabel}
                      htmlFor='identificadores'
                    >
                      Identificadores <span className={styles.required}>*</span>
                    </label>
                    <input
                      type='number'
                      name='identificadores'
                      id='identificadores'
                      value={formData.identificadores}
                      onChange={handleChange}
                      className={styles.formInput}
                      min='0'
                      step='1'
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Seção 04 - Responsáveis */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>04. Responsáveis</h3>
                <div className={styles.sectionContent}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Analista <span className={styles.required}>*</span>
                    </label>
                    <SearchableSelect
                      options={mockAnalistas}
                      value={formData.analista}
                      onChange={(selected) =>
                        handleSelectChange('analista', selected)
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Distribuidor <span className={styles.required}>*</span>
                    </label>
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
            </div>

            <div className={styles.submitSection}>
              <button type='submit' className={styles.submitButton}>
                {isEditMode ? 'Atualizar Demanda' : 'Cadastrar Demanda'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
