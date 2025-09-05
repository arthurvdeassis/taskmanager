import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsCheck2Square } from "react-icons/bs";
import { FaPlus, FaTrash } from 'react-icons/fa';
import "./App.css";
import AlertMessage from "./AlertMessage";
import EditTaskModal from "./EditTaskModal";
import ConfirmModal from "./ConfirmModal";
import SubtaskItem from "./SubtaskItem";
import EditSubtaskModal from './EditSubtaskModal';

const formatDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

const listVariants = {
  visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.1 } },
  hidden: { opacity: 0 },
};

const itemVariants = {
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  hidden: { y: 20, opacity: 0 },
};

export default function App() {
  const [allTasks, setAllTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("pendentes");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [sortBy, setSortBy] = useState('vencimento');
  const [notification, setNotification] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);
  
  // Estados para o formulário principal
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [dueDate, setDueDate] = useState("");
  const titleInputRef = useRef(null);

  // Estados para o formulário de sub-tarefas condicional
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [tempSubtasks, setTempSubtasks] = useState([]);
  const [currentSubtaskTitle, setCurrentSubtaskTitle] = useState('');
  const [currentSubtaskDueDate, setCurrentSubtaskDueDate] = useState('');
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setAllTasks(data);
      } catch (e) {
        console.error("Falha ao buscar as tarefas:", e);
        setNotification({ message: "Não foi possível carregar as tarefas.", type: 'error' });
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const taskCounts = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const nextWeek = new Date(new Date().setDate(todayStart.getDate() + 7));
    
    return {
      pendentes: allTasks.filter(t => !t.completed).length,
      hoje: allTasks.filter(t => t.due_date && new Date(t.due_date + 'T00:00:00').getTime() === todayStart.getTime()).length,
      semana: allTasks.filter(t => t.due_date && new Date(t.due_date + 'T00:00:00') >= todayStart && new Date(t.due_date + 'T00:00:00') < nextWeek).length,
      concluidas: allTasks.filter(t => t.completed).length,
      todas: allTasks.length,
    };
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    const priorityValues = { 'Alta': 1, 'Normal': 2, 'Baixa': 3 };
    let tasksToFilter = [];

    switch (activeFilter) {
      case 'hoje':
        tasksToFilter = allTasks.filter(task => {
            if (!task.due_date) return false;
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0));
            const taskDate = new Date(task.due_date + 'T00:00:00');
            return taskDate.getTime() === todayStart.getTime();
        });
        break;
      case 'semana':
        tasksToFilter = allTasks.filter(task => {
            if (!task.due_date) return false;
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0));
            const nextWeek = new Date(new Date().setDate(todayStart.getDate() + 7));
            const taskDate = new Date(task.due_date + 'T00:00:00');
            return taskDate >= todayStart && taskDate < nextWeek;
        });
        break;
      case 'concluidas':
        tasksToFilter = allTasks.filter(task => task.completed);
        break;
      case 'todas':
        tasksToFilter = allTasks;
        break;
      case 'pendentes':
      default:
        tasksToFilter = allTasks.filter(task => !task.completed);
        break;
    }

    return [...tasksToFilter].sort((a, b) => {
      if (sortBy === 'prioridade') {
        return (priorityValues[a.priority] || 3) - (priorityValues[b.priority] || 3);
      }
      if (sortBy === 'vencimento') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return 0;
    });
  }, [allTasks, activeFilter, sortBy]);
  
  const handleAddTempSubtask = () => {
    if (!currentSubtaskTitle.trim()) return;
    setTempSubtasks([
      ...tempSubtasks,
      { title: currentSubtaskTitle, due_date: currentSubtaskDueDate || null, completed: 0 }
    ]);
    setCurrentSubtaskTitle('');
    setCurrentSubtaskDueDate('');
  };

  const handleRemoveTempSubtask = (indexToRemove) => {
    setTempSubtasks(tempSubtasks.filter((_, index) => index !== indexToRemove));
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setNotification({ message: "O título da tarefa é obrigatório.", type: 'error' });
      return;
    }

    const mainTaskRes = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority, due_date: dueDate }),
    });

    if (!mainTaskRes.ok) {
      const errorData = await mainTaskRes.json();
      setNotification({ message: errorData.error || "Ocorreu um erro.", type: 'error' });
      return;
    }

    const newMainTask = await mainTaskRes.json();
    let createdSubtasks = [];

    if (tempSubtasks.length > 0) {
        for (const sub of tempSubtasks) {
            const subTaskRes = await fetch(`/api/tasks/${newMainTask.id}/subtasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: sub.title, due_date: sub.due_date }),
            });
            if (subTaskRes.ok) {
                createdSubtasks.push(await subTaskRes.json());
            }
        }
    }

    setAllTasks([...allTasks, { ...newMainTask, subtasks: createdSubtasks }]);
    
    // Resetar o formulário
    setTitle("");
    setPriority("Normal");
    setDueDate("");
    setTempSubtasks([]);
    setCurrentSubtaskTitle('');
    setCurrentSubtaskDueDate('');
    setShowSubtaskForm(false);
    setNotification({ message: "Tarefa adicionada com sucesso!", type: 'success' });
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    await fetch(`/api/tasks/${taskToDelete.id}`, { method: "DELETE" });
    setAllTasks(allTasks.filter((t) => t.id !== taskToDelete.id));
    setNotification({ message: `Tarefa "${taskToDelete.title}" excluída.`, type: 'success' });
    setTaskToDelete(null);
  };

  const toggle = async (id, completed) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    setAllTasks(
      allTasks.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
    );
  };
  
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTask = async (id, updatedData) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    if (res.ok) {
      setAllTasks(
        allTasks.map((task) =>
          task.id === id ? { ...task, subtasks: task.subtasks, ...updatedData } : task
        )
      );
      handleCloseEditModal();
      setNotification({ message: "Tarefa atualizada com sucesso!", type: 'success' });
    } else {
      setNotification({ message: "Falha ao atualizar a tarefa.", type: 'error' });
    }
  };

  const handleAddSubtask = async (taskId, subtaskTitle) => {
    if (!subtaskTitle.trim()) return;
    
    const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: subtaskTitle }),
    });

    if (res.ok) {
      const newSubtask = await res.json();
      setAllTasks(allTasks.map(task => 
        task.id === taskId 
          ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
          : task
      ));
    } else {
      setNotification({ message: "Falha ao adicionar sub-tarefa.", type: 'error' });
    }
  };

  const handleToggleSubtask = async (subtaskId, completed, taskId) => {
    await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });

    setAllTasks(allTasks.map(task => 
      task.id === taskId
        ? { ...task, subtasks: task.subtasks.map(st => st.id === subtaskId ? {...st, completed} : st) }
        : task
    ));
  };

  const handleDeleteSubtask = async (subtaskId, taskId) => {
    await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });

    setAllTasks(allTasks.map(task => 
      task.id === taskId 
        ? { ...task, subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId) }
        : task
    ));
  };

  const handleUpdateSubtask = async (subtaskId, data) => {
    const taskId = editingSubtask.task_id;
    const res = await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if(res.ok){
      setAllTasks(allTasks.map(task => 
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.map(st => st.id === subtaskId ? {...st, ...data} : st) }
          : task
      ));
      setEditingSubtask(null);
      setNotification({ message: "Sub-tarefa atualizada.", type: 'success' });
    } else {
      setNotification({ message: "Falha ao atualizar sub-tarefa.", type: 'error' });
    }
  };

  return (
    <div className="main-container">
      <div className="left-column">
        <h1>Nova Tarefa</h1>
        <AlertMessage notification={notification} />
        <form className="add-task-form" onSubmit={addTask}>
          <div className="form-group">
            <label htmlFor="task-title">Tarefa</label>
            <input 
              ref={titleInputRef}
              id="task-title" 
              className="task-input" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="O que precisa ser feito?"
              required 
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-priority">Prioridade</label>
              <select id="task-priority" className="priority-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-due-date">Data de vencimento</label>
              <input id="task-due-date" className="date-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={today} />
            </div>
          </div>

          <div className="subtask-toggle-form">
            <label htmlFor="show-subtasks">Adicionar sub-tarefas?</label>
            <input 
              id="show-subtasks"
              type="checkbox" 
              className="toggle-switch"
              checked={showSubtaskForm}
              onChange={e => setShowSubtaskForm(e.target.checked)}
            />
          </div>
          
          <AnimatePresence>
            {showSubtaskForm && (
              <motion.div 
                className="subtask-entry-section"
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: '20px' }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
              >
                <div className="form-group">
                  <label>Sub-tarefas</label>
                  <div className="subtask-input-group">
                    <div className="form-group subtask-title-group">
                      <label htmlFor="subtask-title-input" className="sub-label">O que deseja fazer?</label>
                      <input 
                        id="subtask-title-input"
                        className="task-input" 
                        placeholder="Digite aqui!"
                        value={currentSubtaskTitle}
                        onChange={(e) => setCurrentSubtaskTitle(e.target.value)}
                        onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddTempSubtask(); } }}
                      />
                    </div>
                    <div className="form-group subtask-date-group">
                      <label htmlFor="subtask-date-input" className="sub-label">Data de vencimento</label>
                      <input 
                        id="subtask-date-input"
                        className="date-input"
                        type="date"
                        value={currentSubtaskDueDate}
                        onChange={(e) => setCurrentSubtaskDueDate(e.target.value)}
                        min={today}
                      />
                    </div>
                    <button type="button" className="action-btn add-subtask-form-btn" onClick={handleAddTempSubtask}><FaPlus /></button>
                  </div>
                </div>
                <ul className="subtask-preview-list">
                  {tempSubtasks.map((sub, index) => (
                    <li key={index}>
                      <span>{sub.title}{sub.due_date ? ` (${formatDate(sub.due_date)})` : ''}</span>
                      <button type="button" className="delete-preview-btn" onClick={() => handleRemoveTempSubtask(index)}><FaTrash /></button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="add-task-btn">
            <FaPlus />
            Adicionar tarefa
          </button>
        </form>
      </div>

      <div className="right-column">
        <div className="controls-container">
          <div className="filter-container">
            <button onClick={() => setActiveFilter('pendentes')} className={`filter-btn ${activeFilter === 'pendentes' ? 'active' : ''}`}>Pendentes ({taskCounts.pendentes})</button>
            <button onClick={() => setActiveFilter('hoje')} className={`filter-btn ${activeFilter === 'hoje' ? 'active' : ''}`}>Hoje ({taskCounts.hoje})</button>
            <button onClick={() => setActiveFilter('semana')} className={`filter-btn ${activeFilter === 'semana' ? 'active' : ''}`}>Esta semana ({taskCounts.semana})</button>
            <button onClick={() => setActiveFilter('concluidas')} className={`filter-btn ${activeFilter === 'concluidas' ? 'active' : ''}`}>Concluídas ({taskCounts.concluidas})</button>
            <button onClick={() => setActiveFilter('todas')} className={`filter-btn ${activeFilter === 'todas' ? 'active' : ''}`}>Todas ({taskCounts.todas})</button>
          </div>
          <div className="sort-container">
            <label htmlFor="sort-by">Ordenar por:</label>
            <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="vencimento">Vencimento</option>
              <option value="prioridade">Prioridade</option>
            </select>
          </div>
        </div>
        <div className="task-list-wrapper">
          <div className="task-list-header">
            <span className="header-priority">Prioridade</span>
            <span className="header-task">Tarefa</span>
            <span className="header-subtasks">Sub-tarefas</span>
            <span className="header-date">Vencimento</span>
            <span className="header-actions">Ações</span>
          </div>
          <motion.ul
            className="task-list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredTasks.map((t) => {
                const subtasksCompleted = (t.subtasks || []).filter(st => st.completed).length;
                const totalSubtasks = (t.subtasks || []).length;
                const InlineSubtaskForm = ({ taskId }) => {
                    const [title, setTitle] = useState('');
                    const onFormSubmit = (e) => {
                        e.preventDefault();
                        handleAddSubtask(taskId, title);
                        setTitle('');
                    };
                    return (
                        <form className="add-subtask-form" onSubmit={onFormSubmit}>
                            <input 
                                type="text"
                                className="add-subtask-input"
                                placeholder="Adicionar sub-tarefa..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <button type="submit" className="action-btn add-subtask-form-btn" title="Adicionar sub-tarefa">
                                <FaPlus />
                            </button>
                        </form>
                    );
                };

                return (
                  <motion.li
                    key={t.id}
                    className={`task-item ${t.completed ? "completed" : ""}`}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                  >
                    <div className="task-item-content">
                      <div className="task-col-priority">
                        <span className={`priority-tag ${t.priority?.toLowerCase()}`}>{t.priority}</span>
                      </div>
                      <div className="task-col-title" title={t.title}>
                        <span className="task-title">{t.title}</span>
                      </div>
                      <div className="task-col-subtasks">
                        {totalSubtasks > 0 ? (
                          <>
                            <div className="subtask-progress">
                              <BsCheck2Square className="subtask-progress-icon" />
                              <span>{subtasksCompleted} / {totalSubtasks}</span>
                            </div>
                            <button className="expand-btn" onClick={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)}>
                              {expandedTaskId === t.id ? '▲' : '▼'}
                            </button>
                          </>
                        ) : (
                          <button className="add-subtask-placeholder-btn" onClick={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} title="Adicionar/Ver sub-tarefas">
                            <FaPlus className="subtask-placeholder-icon" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                      <div className="task-col-date">
                        <span className="task-date">{formatDate(t.due_date)}</span>
                      </div>
                      <div className="task-col-actions">
                        <button className="action-btn edit-task-btn" onClick={() => handleOpenEditModal(t)} title="Editar tarefa">✏️</button>
                        <button className="action-btn toggle-task-btn" onClick={() => toggle(t.id, t.completed)} title={t.completed ? "Desmarcar" : "Marcar como concluída"}>✔</button>
                        <button className="action-btn delete-task-btn" onClick={() => setTaskToDelete(t)} title="Deletar tarefa">🗑</button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedTaskId === t.id && (
                        <motion.div 
                          className="subtasks-container"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {(t.subtasks || []).map(subtask => (
                            <SubtaskItem 
                              key={subtask.id}
                              subtask={subtask}
                              onToggle={(subtaskId, completed) => handleToggleSubtask(subtaskId, completed, t.id)}
                              onDelete={() => handleDeleteSubtask(subtask.id, t.id)}
                              onEdit={setEditingSubtask}
                            />
                          ))}
                          <InlineSubtaskForm taskId={t.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </div>
      </div>
      
      {isEditModalOpen && <EditTaskModal task={editingTask} onSave={handleUpdateTask} onClose={handleCloseEditModal} />}
      {taskToDelete && <ConfirmModal message={`Tem certeza que deseja excluir a tarefa "${taskToDelete.title}"?`} onConfirm={handleConfirmDelete} onCancel={() => setTaskToDelete(null)} />}
      {editingSubtask && <EditSubtaskModal subtask={editingSubtask} onSave={handleUpdateSubtask} onClose={() => setEditingSubtask(null)} />}
    </div>
  );
}