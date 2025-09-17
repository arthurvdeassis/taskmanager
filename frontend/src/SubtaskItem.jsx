import React from 'react';
import { motion } from 'framer-motion';
import { FaEdit } from 'react-icons/fa';

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Sem vencimento') {
    return 'Sem vencimento';
  }
  if (!dateString.includes('-')) {
    return dateString;
  }
  const [year, month, day] = dateString.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};

export default function SubtaskItem({ subtask, onUpdate, onEdit, onDelete }) {

  const handleToggleCompletion = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/tasks/subtasks/${subtask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !subtask.completed }),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar o status da sub-tarefa');
      }

      onUpdate();

    } catch (error) {
      console.error("Erro:", error);
      alert("Não foi possível atualizar a sub-tarefa.");
    }
  };

  const handleDeleteClick = () => {
    onDelete(subtask);
  };

  return (
    <motion.div
      className={`subtask-item ${subtask.completed ? 'completed' : ''}`}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <button 
        className="subtask-toggle-btn"
        onClick={handleToggleCompletion}
      >
        <div className="checkbox-icon">
          {subtask.completed && '✔'}
        </div>
      </button>
      <div className="subtask-info">
        <span className="subtask-title">{subtask.title}</span>
        {subtask.due_date && <span className="subtask-date">{formatDate(subtask.due_date)}</span>}
      </div>
      <button className="subtask-edit-btn" onClick={() => onEdit(subtask)}><FaEdit /></button>
      <button 
        className="subtask-delete-btn"
        onClick={handleDeleteClick}
        title="Excluir sub-tarefa"
      >
        🗑️
      </button>
    </motion.div>
  );
}