import styles from './ChimeraApp.module.css'

const ChimeraApp = () => (
  <div className={styles.app}>
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav}>
        <button type="button" className={styles.sidebarItem}>
          Персонажи
        </button>
        <button type="button" className={styles.sidebarItem}>
          Промпты
        </button>
        <button type="button" className={styles.sidebarItemActive}>
          Поведение
        </button>
        <button type="button" className={styles.sidebarItem}>
          Голос
        </button>
        <button type="button" className={styles.sidebarItem}>
          Внешность
        </button>
      </nav>
    </aside>

    <main className={styles.main}>
      <header className={styles.mainHeader}>
        <h1 className={styles.mainTitle}>Chimera — Настройка ИИ</h1>
      </header>
      <div className={styles.mainContent}>
        <div className={styles.field}>
          <span className={styles.label}>Реакция на донаты</span>
          <div className={styles.input} />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Тон общения</span>
          <div className={styles.input} />
        </div>
        <div className={styles.hint}>
          <span className={styles.hintIcon}>👆</span>
          Настрой параметры ИИ под свой стиль
        </div>
      </div>
    </main>
  </div>
)

export default ChimeraApp
