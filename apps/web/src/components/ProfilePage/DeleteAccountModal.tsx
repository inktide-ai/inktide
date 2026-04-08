import styles from './ProfilePage.module.css'

interface DeleteAccountModalProps {
  isDeleting: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteAccountModal({
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  return (
    <div
      className={styles.accountModalOverlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.accountModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-account-title" className={styles.accountModalTitle}>
          Delete account
        </h2>
        <p className={styles.accountModalText}>
          This removes your characters and related data from Chimera. If the server is configured
          for it, your login identity is removed from Keycloak as well.
        </p>
        {error && (
          <p className={styles.accountModalError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.accountModalActions}>
          <button
            type="button"
            className={styles.accountModalBtnSecondary}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.accountModalBtnDanger}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
