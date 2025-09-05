import React from 'react';
import { motion } from 'framer-motion';
import { FaEdit } from 'react-icons/fa';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export default function SubtaskItem({ subtask, onToggle, onDelete, onEdit }) {
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
        onClick={() => onToggle(subtask.id, !subtask.completed)}
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
        onClick={() => onDelete(subtask.id)}
        title="Excluir sub-tarefa"
      >
        🗑️
      </button>
    </motion.div>
  );
}