import React from 'react';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-title">Confirmação</h2>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn-confirm-delete" onClick={onConfirm}>Sim</button>
        </div>
      </div>
    </div>
  );
}