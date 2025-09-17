const taskRepository = require("../repositories/taskRepository");

const getTasksForUser = async (userId) => {
  const tasks = await taskRepository.findAllByUserId(userId);
  const subtasks = await taskRepository.findAllSubtasksByUserId(userId);

  const tasksMap = tasks.reduce((acc, task) => {
    task.subtasks = [];
    acc[task.id] = task;
    return acc;
  }, {});

  subtasks.forEach(subtask => {
    if (tasksMap[subtask.task_id]) {
      tasksMap[subtask.task_id].subtasks.push(subtask);
    }
  });

  return Object.values(tasksMap);
};

const createTaskForUser = async ({ title, priority, due_date, userId }) => {
  if (!title) {
    const error = new Error("Título obrigatório");
    error.statusCode = 400;
    throw error;
  }

  const existingTask = await taskRepository.findByTitleAndUserId(title, userId);
  if (existingTask) {
    const error = new Error("Já existe uma tarefa com este nome.");
    error.statusCode = 409;
    throw error;
  }

  const taskData = {
    title,
    priority: priority || "Normal",
    dueDate: (!due_date || due_date.trim() === '') ? 'Sem vencimento' : due_date,
    userId,
  };

  return await taskRepository.create(taskData);
};

const updateTaskForUser = async (taskId, userId, updateData) => {
  const fields = {};
  if (updateData.title !== undefined) fields.title = updateData.title;
  if (updateData.priority !== undefined) fields.priority = updateData.priority;
  if (updateData.completed !== undefined) fields.completed = updateData.completed ? 1 : 0;
  if (updateData.due_date !== undefined) {
    fields.due_date = (updateData.due_date === '') ? 'Sem vencimento' : updateData.due_date;
  }
  
  if (Object.keys(fields).length === 0) {
    const error = new Error("Nenhum campo para atualizar fornecido.");
    error.statusCode = 400;
    throw error;
  }

  const result = await taskRepository.update(taskId, userId, fields);
  if (result.changes === 0) {
    const error = new Error("Tarefa não encontrada");
    error.statusCode = 404;
    throw error;
  }
  return result;
};

const deleteTaskForUser = async (taskId, userId) => {
  const result = await taskRepository.remove(taskId, userId);
  if (result.changes === 0) {
    const error = new Error("Tarefa não encontrada");
    error.statusCode = 404;
    throw error;
  }
  return result;
};

const createSubtaskForUser = async ({ title, due_date, taskId, userId }) => {
  if (!title) {
    const error = new Error("Título da sub-tarefa é obrigatório.");
    error.statusCode = 400;
    throw error;
  }

  const subtaskData = {
    title,
    dueDate: (!due_date || due_date.trim() === '') ? 'Sem vencimento' : due_date,
    taskId,
    userId
  };
  
  return await taskRepository.createSubtask(subtaskData);
};

const updateSubtaskForUser = async (subtaskId, userId, updateData) => {
  const fields = {};
  if (updateData.title !== undefined) fields.title = updateData.title;
  if (updateData.completed !== undefined) fields.completed = updateData.completed ? 1 : 0;
  if (updateData.due_date !== undefined) {
    fields.due_date = (updateData.due_date === '') ? 'Sem vencimento' : updateData.due_date;
  }

  if (Object.keys(fields).length === 0) {
    const error = new Error("Nenhum campo para atualizar.");
    error.statusCode = 400;
    throw error;
  }

  const result = await taskRepository.updateSubtask(subtaskId, userId, fields);
  if (result.changes === 0) {
    const error = new Error("Sub-tarefa não encontrada.");
    error.statusCode = 404;
    throw error;
  }
  return result;
};

const deleteSubtaskForUser = async (subtaskId, userId) => {
  const result = await taskRepository.removeSubtask(subtaskId, userId);
  if (result.changes === 0) {
    const error = new Error("Sub-tarefa não encontrada.");
    error.statusCode = 404;
    throw error;
  }
  return result;
};

module.exports = {
  getTasksForUser,
  createTaskForUser,
  updateTaskForUser,
  deleteTaskForUser,
  createSubtaskForUser,
  updateSubtaskForUser,
  deleteSubtaskForUser,
};