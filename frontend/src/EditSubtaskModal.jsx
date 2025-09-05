import React, { useState } from 'react';

export default function EditSubtaskModal({ subtask, onSave, onClose }) {
  const [title, setTitle] = useState(subtask.title);
  const [dueDate, setDueDate] = useState(subtask.due_date || '');

  const today = new Date().toISOString().split('T')[0];

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('O título é obrigatório.');
      return;
    }
    onSave(subtask.id, { title, due_date: dueDate });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Sub-tarefa</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="edit-subtask-title">Título</label>
            <input id="edit-subtask-title" className="task-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-subtask-due-date">Data de Vencimento</label>
            <input id="edit-subtask-due-date" className="date-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={today} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}