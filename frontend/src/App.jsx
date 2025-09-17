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
import Login from "./Login";
import Register from "./Register";

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Sem vencimento') {
    return 'Sem vencimento';
  }
  if (!dateString.includes('-')) return dateString;
  const [year, month, day] = dateString.split("T")[0].split("-");
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
  const [editingTask, setEditingTask] = useState(null);
  const [sortBy, setSortBy] = useState('vencimento');
  const [notification, setNotification] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [dueDate, setDueDate] = useState("");
  const titleInputRef = useRef(null);

  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [tempSubtasks, setTempSubtasks] = useState([]);
  const [currentSubtaskTitle, setCurrentSubtaskTitle] = useState('');
  const [currentSubtaskDueDate, setCurrentSubtaskDueDate] = useState('');
  const [subtaskToDelete, setSubtaskToDelete] = useState(null);
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        setIsLoggedIn(false);
        return;
    }
    try {
      const response = await fetch("/api/tasks", { headers: getAuthHeaders() });
      if (response.status === 401 || response.status === 403) {
          handleLogout();
          throw new Error('Token inválido ou expirado.');
      }
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAllTasks(data);
      setIsLoggedIn(true);
    } catch (e) {
      console.error("Falha ao buscar as tarefas:", e);
      if (isLoggedIn) {
        setNotification({ message: "Sua sessão expirou. Por favor, faça login novamente.", type: 'error' });
      }
      handleLogout();
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowRegisterForm(false);
    fetchTasks();
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setAllTasks([]);
    setNotification({ message: "Você foi desconectado.", type: 'success' });
  };

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
            if (!task.due_date || task.due_date === 'Sem vencimento') return false;
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0));
            const taskDate = new Date(task.due_date + 'T00:00:00');
            return taskDate.getTime() === todayStart.getTime();
        });
        break;
      case 'semana':
        tasksToFilter = allTasks.filter(task => {
            if (!task.due_date || task.due_date === 'Sem vencimento') return false;
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
        if (a.due_date === 'Sem vencimento' && b.due_date === 'Sem vencimento') return 0;
        if (a.due_date === 'Sem vencimento' || !a.due_date) return 1;
        if (b.due_date === 'Sem vencimento' || !b.due_date) return -1;
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

  const handleOpenDeleteSubtaskModal = (subtask) => {
    setSubtaskToDelete(subtask);
  };

  const handleConfirmDeleteSubtask = async () => {
    if (!subtaskToDelete) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/tasks/subtasks/${subtaskToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao deletar a sub-tarefa');
      }
      
      setNotification({ message: `Sub-tarefa "${subtaskToDelete.title}" excluída.`, type: 'success' });
      fetchTasks(); 

    } catch (error) {
      console.error("Erro:", error);
      setNotification({ message: "Não foi possível deletar a sub-tarefa.", type: 'error' });
    } finally {
      setSubtaskToDelete(null); 
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setNotification({ message: "O título da tarefa é obrigatório.", type: 'error' });
      return;
    }

    try {
        const mainTaskRes = await fetch("/api/tasks", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, priority, due_date: dueDate }),
        });
    
        if (!mainTaskRes.ok) {
            const errorData = await mainTaskRes.json();
            throw new Error(errorData.error || "Ocorreu um erro.");
        }
    
        const newMainTask = await mainTaskRes.json();
    
        if (tempSubtasks.length > 0) {
            await Promise.all(tempSubtasks.map(sub => 
                fetch(`/api/tasks/${newMainTask.id}/subtasks`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ title: sub.title, due_date: sub.due_date }),
                })
            ));
        }
    
        fetchTasks();
        
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
    } catch(error) {
        setNotification({ message: error.message, type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
        const res = await fetch(`/api/tasks/${taskToDelete.id}`, { 
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Falha ao deletar a tarefa.");
        
        setNotification({ message: `Tarefa "${taskToDelete.title}" excluída.`, type: 'success' });
        fetchTasks();
    } catch(error) {
        setNotification({ message: error.message, type: 'error' });
    } finally {
        setTaskToDelete(null);
    }
  };

  const toggleTaskCompletion = async (id, completed) => {
    try {
        const res = await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ completed: !completed }),
        });
        if (!res.ok) throw new Error("Falha ao atualizar o status da tarefa.");

        fetchTasks();
    } catch(error) {
        setNotification({ message: error.message, type: 'error' });
    }
  };
  
  const handleAddSubtask = async (taskId, subtaskTitle, subtaskDueDate) => {
    if (!subtaskTitle.trim()) return;
    try {
        const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title: subtaskTitle, due_date: subtaskDueDate }),
        });
        if (!res.ok) throw new Error("Falha ao adicionar sub-tarefa.");

        fetchTasks();
    } catch(error) {
        setNotification({ message: error.message, type: 'error' });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-page-container">
        <div className="auth-forms-container">
          {showRegisterForm ? (
            <Register onRegisterSuccess={() => {
                setNotification({ message: "Registro bem-sucedido! Por favor, faça login.", type: 'success' });
                setShowRegisterForm(false);
            }} onSwitchToLogin={() => setShowRegisterForm(false)} />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setShowRegisterForm(true)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <button onClick={handleLogout} className="logout-btn">Sair</button>
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
                <div className="subtask-input-group">
                  <div className="form-group-inline">
                    <label className="subtask-label">Sub-tarefa</label>
                    <input 
                      type="text"
                      className="add-subtask-input"
                      placeholder="Digite aqui"
                      value={currentSubtaskTitle}
                      onChange={(e) => setCurrentSubtaskTitle(e.target.value)}
                      onKeyPress={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddTempSubtask(); } }}
                    />
                  </div>
                  <div className="form-group-inline">
                    <label className="subtask-label">Data de vencimento</label>
                    <input 
                      type="date"
                      className="add-subtask-date-input"
                      value={currentSubtaskDueDate}
                      onChange={(e) => setCurrentSubtaskDueDate(e.target.value)}
                      min={today}
                    />
                  </div>
                  <button type="button" className="add-subtask-form-btn" onClick={handleAddTempSubtask}>
                    <FaPlus />
                  </button>
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
                    const [dueDate, setDueDate] = useState('');
                    const onFormSubmit = (e) => {
                        e.preventDefault();
                        handleAddSubtask(taskId, title, dueDate);
                        setTitle('');
                        setDueDate('');
                    };
                    return (
                        <form className="add-subtask-form" onSubmit={onFormSubmit}>
                            <input 
                                type="text"
                                className="add-subtask-input"
                                placeholder="Digite a sub-tarefa e selecione sua data de vencimento"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <input
                                type="date"
                                className="add-subtask-date-input"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={today}
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
                        <button className="action-btn edit-task-btn" onClick={() => setEditingTask(t)} title="Editar tarefa">✏️</button>
                        <button className="action-btn toggle-task-btn" onClick={() => toggleTaskCompletion(t.id, t.completed)} title={t.completed ? "Desmarcar" : "Marcar como concluída"}>✔</button>
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
                              onUpdate={fetchTasks}
                              onEdit={setEditingSubtask}
                              onDelete={handleOpenDeleteSubtaskModal}
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
      
      {editingTask && <EditTaskModal task={editingTask} onSave={fetchTasks} onClose={() => setEditingTask(null)} />}
      {taskToDelete && <ConfirmModal message={`Tem certeza que deseja excluir a tarefa "${taskToDelete.title}"?`} onConfirm={handleConfirmDelete} onCancel={() => setTaskToDelete(null)} />}
      {editingSubtask && <EditSubtaskModal subtask={editingSubtask} onSave={fetchTasks} onClose={() => setEditingSubtask(null)} />}
      {subtaskToDelete && <ConfirmModal message={`Tem certeza que deseja excluir a sub-tarefa "${subtaskToDelete.title}"?`} onConfirm={handleConfirmDeleteSubtask} onCancel={() => setSubtaskToDelete(null)} />}
    </div>
  );
}