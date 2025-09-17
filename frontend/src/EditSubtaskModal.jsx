import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function EditSubtaskModal({ subtask, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title);
      
      if (subtask.due_date && subtask.due_date !== 'Sem vencimento') {
        try {
          const formattedDate = format(new Date(subtask.due_date), 'yyyy-MM-dd');
          setDueDate(formattedDate);
        } catch (e) {
          console.error("Data inválida recebida da API:", subtask.due_date);
          setDueDate('');
        }
      } else {
        setDueDate('');
      }
    }
  }, [subtask]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('O título é obrigatório.');
      return;
    }

    const token = localStorage.getItem('token');
    const updatedSubtaskData = { 
      title: title.trim(), 
      due_date: dueDate 
    };

    try {
      const res = await fetch(`/api/tasks/subtasks/${subtask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSubtaskData),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar a sub-tarefa');
      }

      onSave();
      onClose();

    } catch (error) {
      console.error("Erro ao salvar a sub-tarefa:", error);
      alert("Ocorreu um erro ao salvar as alterações.");
    }
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