import React, { useState, useRef } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function AddTaskModal({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [currentSubtask, setCurrentSubtask] = useState('');
  const subtaskInputRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  const handleAddSubtask = () => {
    if (currentSubtask.trim()) {
      setSubtasks([...subtasks, { title: currentSubtask, completed: 0 }]);
      setCurrentSubtask('');
      subtaskInputRef.current.focus();
    }
  };

  const handleRemoveSubtask = (indexToRemove) => {
    setSubtasks(subtasks.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('O título da tarefa principal é obrigatório.');
      return;
    }
    const taskData = { title, priority, due_date: dueDate, subtasks };
    onSave(taskData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Adicionar Nova Tarefa</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="add-task-title">Tarefa Principal</label>
            <input id="add-task-title" className="task-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="add-task-priority">Prioridade</label>
              <select id="add-task-priority" className="priority-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Alta">Alta</option>
                <option value="Normal">Normal</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="add-task-due-date">Data de Vencimento</label>
              <input id="add-task-due-date" className="date-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={today} />
            </div>
          </div>
          
          <hr className="divider" />

          <div className="form-group">
            <label>Marcos da Tarefa (Sub-tarefas)</label>
            <div className="subtask-input-group">
              <input 
                ref={subtaskInputRef}
                className="task-input" 
                placeholder="Digite um marco e clique em +"
                value={currentSubtask}
                onChange={(e) => setCurrentSubtask(e.target.value)}
                onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
              />
              <button type="button" className="action-btn add-subtask-form-btn" onClick={handleAddSubtask}><FaPlus /></button>
            </div>
          </div>

          <ul className="subtask-preview-list">
            {subtasks.map((sub, index) => (
              <li key={index}>
                <span>{sub.title}</span>
                <button type="button" className="delete-preview-btn" onClick={() => handleRemoveSubtask(index)}><FaTrash /></button>
              </li>
            ))}
          </ul>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save">Salvar Tarefa</button>
          </div>
        </form>
      </div>
    </div>
  );
}