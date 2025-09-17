const express = require('express');
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(authenticateToken);

router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.post('/:taskId/subtasks', taskController.createSubtask);
router.put('/subtasks/:id', taskController.updateSubtask);
router.delete('/subtasks/:id', taskController.deleteSubtask);

module.exports = router;