const taskService = require('../services/taskService');

const getAllTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasksForUser(req.user.id);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const taskData = { ...req.body, userId: req.user.id };
    const { id } = await taskService.createTaskForUser(taskData);
    res.status(201).json({ id, ...taskData, completed: 0 });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    await taskService.updateTaskForUser(req.params.id, req.user.id, req.body);
    res.status(200).json({ message: "Tarefa atualizada com sucesso" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    await taskService.deleteTaskForUser(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const createSubtask = async (req, res) => {
  try {
    const subtaskData = { 
      ...req.body, 
      taskId: req.params.taskId, 
      userId: req.user.id 
    };
    const { id } = await taskService.createSubtaskForUser(subtaskData);
    res.status(201).json({ id, ...subtaskData, completed: 0 });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const updateSubtask = async (req, res) => {
  try {
    await taskService.updateSubtaskForUser(req.params.id, req.user.id, req.body);
    res.status(200).json({ message: "Sub-tarefa atualizada com sucesso." });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

const deleteSubtask = async (req, res) => {
  try {
    await taskService.deleteSubtaskForUser(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
};