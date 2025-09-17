import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function EditTaskModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [originalSubtasks, setOriginalSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  const subtaskInputRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority || 'Normal');
      
      if (task.due_date && task.due_date !== 'Sem vencimento') {
        try {
          const formattedDate = format(new Date(task.due_date), 'yyyy-MM-dd');
          setDueDate(formattedDate);
        } catch (e) {
          setDueDate('');
        }
      } else {
        setDueDate('');
      }

      setSubtasks(task.subtasks || []);
      setOriginalSubtasks(task.subtasks || []);
    }
  }, [task]);

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), completed: 0 }]);
      setNewSubtaskTitle('');
      subtaskInputRef.current.focus();
    }
  };

  const handleRemoveSubtask = (indexToRemove) => {
    setSubtasks(subtasks.filter((_, index) => index !== indexToRemove));
  };
  
  const handleSubtaskChange = (index, field, value) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };
    setSubtasks(updatedSubtasks);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const mainTaskData = { title, priority, due_date: dueDate };
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(mainTaskData),
      });

      const promises = [];

      const deletedSubtasks = originalSubtasks.filter(
        origSub => !subtasks.some(currentSub => currentSub.id === origSub.id)
      );
      deletedSubtasks.forEach(sub => {
        promises.push(fetch(`/api/tasks/subtasks/${sub.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }));
      });

      subtasks.forEach(sub => {
        if (!sub.id) {
          promises.push(fetch(`/api/tasks/${task.id}/subtasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: sub.title }),
          }));
        } else {
          const originalSub = originalSubtasks.find(os => os.id === sub.id);
          if (originalSub.title !== sub.title || originalSub.completed !== sub.completed) {
            promises.push(fetch(`/api/tasks/subtasks/${sub.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ title: sub.title, completed: sub.completed }),
            }));
          }
        }
      });
      
      await Promise.all(promises);

      onSave();
      onClose();

    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      alert("Falha ao salvar as alterações.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Tarefa</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="edit-task-title">Tarefa</label>
            <input id="edit-task-title" className="task-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-task-priority">Prioridade</label>
              <select id="edit-task-priority" className="priority-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Alta">Alta</option>
                <option value="Normal">Normal</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-task-due-date">Data de vencimento</label>
              <input id="edit-task-due-date" className="date-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={today} />
            </div>
          </div>
          <hr className="divider" />
          
          <div className="form-group">
            <label>Marcos da Tarefa (Sub-tarefas)</label>
            <div className="subtask-input-group">
              <input ref={subtaskInputRef} className="task-input" placeholder="Adicionar novo marco..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }} />
              <button type="button" className="action-btn add-subtask-form-btn" onClick={handleAddSubtask}><FaPlus /></button>
            </div>
          </div>

          <ul className="subtask-edit-list">
            {subtasks.map((sub, index) => (
              <li key={sub.id || `new-${index}`}>
                <input type="checkbox" checked={!!sub.completed} onChange={(e) => handleSubtaskChange(index, 'completed', e.target.checked)} />
                <input type="text" value={sub.title} className="subtask-edit-input" onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)} />
                <button type="button" className="delete-preview-btn" onClick={() => handleRemoveSubtask(index)}><FaTrash /></button>
              </li>
            ))}
          </ul>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Salvar alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}