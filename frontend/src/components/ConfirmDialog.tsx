import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  text: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title,
  text,
  confirmText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="glass modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p className="note">{text}</p>
        <div className="row-actions">
          <button autoFocus onClick={onCancel}>
            ביטול
          </button>
          <button className="danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
