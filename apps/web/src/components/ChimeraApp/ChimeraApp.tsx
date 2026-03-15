import styles from './ChimeraApp.module.css'

const ChimeraApp = () => (
  <div className={styles.app}>
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav}>
        <button type="button" className={styles.sidebarItem}>
          Characters
        </button>
        <button type="button" className={styles.sidebarItem}>
          Prompts
        </button>
        <button type="button" className={styles.sidebarItemActive}>
          Behavior
        </button>
        <button type="button" className={styles.sidebarItem}>
          Voice
        </button>
        <button type="button" className={styles.sidebarItem}>
          Appearance
        </button>
      </nav>
    </aside>

    <main className={styles.main}>
      <header className={styles.mainHeader}>
        <h1 className={styles.mainTitle}>Chimera — AI Setup</h1>
      </header>
      <div className={styles.mainContent}>
        <div className={styles.field}>
          <span className={styles.label}>Donation reactions</span>
          <div className={styles.input} />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Communication tone</span>
          <div className={styles.input} />
        </div>
        <div className={styles.hint}>
          <span className={styles.hintIcon}>👆</span>
          Customize AI parameters to match your style
        </div>
      </div>
    </main>
  </div>
)

export default ChimeraApp
