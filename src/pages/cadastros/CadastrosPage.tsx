// src/pages/CadastrosPage.tsx
import { Link } from 'react-router-dom';
import styles from '../../shared/styles/shared.module.css';

export default function CadastrosPage() {
  return (
    <div>
      <h2>Central de Cadastros</h2>
      <p>Selecione uma das opções abaixo para gerenciar.</p>

      <div className={styles.container}>
        <Link to='/cadastros/assuntos' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Assuntos</div>
          <p className={styles.cardDescription}>
            Adicione, edite ou remova os assuntos das demandas.
          </p>
        </Link>

        <Link to='/cadastros/orgaos' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Órgãos</div>
          <p className={styles.cardDescription}>
            Adicione, edite ou remova os órgãos solicitantes.
          </p>
        </Link>

        <Link to='/cadastros/autoridades' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Autoridades</div>
          <p className={styles.cardDescription}>Adicione, edite ou remova autoridades.</p>
        </Link>

        <Link to='/cadastros/tipos-documentos' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Tipos de Documentos</div>
          <p className={styles.cardDescription}>
            Adicione, edite ou remova os tipos de documentos.
          </p>
        </Link>

        <Link to='/cadastros/distribuidores' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Distribuidores</div>
          <p className={styles.cardDescription}>Adicione, edite ou remova distribuidores.</p>
        </Link>

        <Link to='/cadastros/provedores' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Provedores</div>
          <p className={styles.cardDescription}>Adicione, edite ou remova provedores de serviço.</p>
        </Link>

        <Link to='/cadastros/tipos-demandas' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Tipos de Demandas</div>
          <p className={styles.cardDescription}>Adicione, edite ou remova os tipos de demandas.</p>
        </Link>

        <Link to='/cadastros/tipos-identificadores' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Tipos de Identificadores</div>
          <p className={styles.cardDescription}>
            Adicione, edite ou remova os tipos de identificadores.
          </p>
        </Link>

        <Link to='/cadastros/tipos-midias' className={styles.cardLink}>
          <div className={styles.cardTitle}>Gerenciar Tipos de Mídias</div>
          <p className={styles.cardDescription}>Adicione, edite ou remova os tipos de mídias.</p>
        </Link>
      </div>
    </div>
  );
}
