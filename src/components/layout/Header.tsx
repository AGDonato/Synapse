// src/components/layout/Header.tsx

type HeaderProps = {
  onMenuButtonClick: () => void; // Define que o Header receberá uma função
}

export default function Header({ onMenuButtonClick }: HeaderProps) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', padding: '10px', background: '#eee' }}>
      <button onClick={onMenuButtonClick} title="Abrir/Fechar menu">
        ☰
      </button>
      <h1 style={{ marginLeft: '1rem' }}>Synapse</h1>
      <div style={{ flexGrow: 1 }}></div>
      <span>Olá, Alan!</span>
      <button style={{ marginLeft: '1rem' }}>Sair</button>
    </header>
  );
}