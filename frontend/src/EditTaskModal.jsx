import React, { useState } from 'react';

export default function EditTaskModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date || '');

  const today = new Date().toISOString().split('T')[0];

  const handleSave = (e) => {
    e.preventDefault();
    const updatedTask = {
      title,
      priority,
      due_date: dueDate,
    };
    onSave(task.id, updatedTask);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Tarefa</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="edit-task-title">Tarefa</label>
            <input
              id="edit-task-title"
              className="task-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-task-priority">Prioridade</label>
              <select
                id="edit-task-priority"
                className="priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Alta">Alta</option>
                <option value="Normal">Normal</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-task-due-date">Data de vencimento</label>
              <input
                id="edit-task-due-date"
                className="date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={today}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Salvar alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}