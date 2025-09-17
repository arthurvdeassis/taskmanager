const taskController = require('../../../src/controllers/taskController');
const taskService = require('../../../src/services/taskService');

jest.mock('../../../src/services/taskService');

describe('Task Controller - Unit Tests', () => {

  let mockRequest;
  let mockResponse;
  let mockJson;
  let mockSend;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      user: { id: 1 },
    };
    mockJson = jest.fn();
    mockSend = jest.fn();
    mockResponse = {
      status: jest.fn(() => ({
        json: mockJson,
        send: mockSend, 
      })),
    };
    jest.clearAllMocks();
  });

  // Testes para getAllTasks
  describe('getAllTasks', () => {
    // Teste 1: Sucesso ao buscar tarefas
    it('Deve retornar status 200 e a lista de tarefas do usuário', async () => {
      const tasks = [{ id: 1, title: 'Test Task' }];
      taskService.getTasksForUser.mockResolvedValue(tasks);

      await taskController.getAllTasks(mockRequest, mockResponse);

      expect(taskService.getTasksForUser).toHaveBeenCalledWith(mockRequest.user.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(tasks);
    });

    // Teste 2: Erro - Falha no servidor ao buscar tarefas
    it('Deve retornar status 500 se o serviço falhar ao buscar tarefas', async () => {
        const error = new Error("Falha no banco de dados");
        taskService.getTasksForUser.mockRejectedValue(error);

        await taskController.getAllTasks(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: error.message });
    });
  });

  // Testes para createTask
  describe('createTask', () => {
    // Teste 3: Sucesso ao criar tarefa
    it('Deve retornar status 201 e a nova tarefa criada', async () => {
      mockRequest.body = { title: 'New Task' };
      const createdTaskData = { id: 2, title: 'New Task', completed: 0, ...mockRequest.body };
      taskService.createTaskForUser.mockResolvedValue({ id: 2 }); 

      await taskController.createTask(mockRequest, mockResponse);

      expect(taskService.createTaskForUser).toHaveBeenCalledWith({ ...mockRequest.body, userId: mockRequest.user.id });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining(createdTaskData));
    });

    // Teste 4: Erro - Conflito ao criar tarefa
    it('Deve retornar status 409 se o serviço indicar que a tarefa já existe', async () => {
        mockRequest.body = { title: 'Existing Task' };
        const error = new Error('Já existe uma tarefa com este nome.');
        error.statusCode = 409;
        taskService.createTaskForUser.mockRejectedValue(error);

        await taskController.createTask(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(mockJson).toHaveBeenCalledWith({ error: error.message });
      });
  });

  // Testes para updateTask
  describe('updateTask', () => {
    // Teste 5: Sucesso ao atualizar tarefa
    it('Deve retornar status 200 e uma mensagem de sucesso', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { completed: true };
      taskService.updateTaskForUser.mockResolvedValue({}); 

      await taskController.updateTask(mockRequest, mockResponse);

      expect(taskService.updateTaskForUser).toHaveBeenCalledWith('1', mockRequest.user.id, mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: "Tarefa atualizada com sucesso" });
    });

    // Teste 6: Erro - Não encontrado ao atualizar
    it('Deve retornar status 404 se o serviço indicar que a tarefa não foi encontrada', async () => {
        mockRequest.params.id = '999';
        const error = new Error('Tarefa não encontrada');
        error.statusCode = 404;
        taskService.updateTaskForUser.mockRejectedValue(error);
  
        await taskController.updateTask(mockRequest, mockResponse);
  
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: error.message });
      });
  });

  // Testes para deleteTask
  describe('deleteTask', () => {
    // Teste 7: Sucesso ao deletar tarefa
    it('Deve retornar status 204 (No Content) em caso de sucesso', async () => {
      mockRequest.params.id = '1';
      taskService.deleteTaskForUser.mockResolvedValue({});

      await taskController.deleteTask(mockRequest, mockResponse);

      expect(taskService.deleteTaskForUser).toHaveBeenCalledWith('1', mockRequest.user.id);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });

    // Teste 8: Erro - Não encontrado ao deletar
    it('Deve retornar status 404 se o serviço indicar que a tarefa a ser deletada não existe', async () => {
        mockRequest.params.id = '999';
        const error = new Error('Tarefa não encontrada');
        error.statusCode = 404;
        taskService.deleteTaskForUser.mockRejectedValue(error);
  
        await taskController.deleteTask(mockRequest, mockResponse);
  
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockJson).toHaveBeenCalledWith({ error: error.message });
    });
  });

  // Testes para createSubtask
  describe('createSubtask', () => {
    // Teste 9: Sucesso ao criar subtarefa
    it('Deve retornar status 201 e a nova subtarefa', async () => {
      mockRequest.params.taskId = '1';
      mockRequest.body = { title: 'Nova Subtarefa' };
      const createdSubtask = { id: 10, ...mockRequest.body, completed: 0 };
      taskService.createSubtaskForUser.mockResolvedValue({ id: 10 });

      await taskController.createSubtask(mockRequest, mockResponse);

      expect(taskService.createSubtaskForUser).toHaveBeenCalledWith({ ...mockRequest.body, taskId: '1', userId: mockRequest.user.id });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining(createdSubtask));
    });
  });

  // Testes para updateSubtask
  describe('updateSubtask', () => {
    // Teste 10: Sucesso ao atualizar subtarefa
    it('Deve retornar status 200 e uma mensagem de sucesso', async () => {
      mockRequest.params.id = '10';
      mockRequest.body = { completed: true };
      taskService.updateSubtaskForUser.mockResolvedValue({});

      await taskController.updateSubtask(mockRequest, mockResponse);

      expect(taskService.updateSubtaskForUser).toHaveBeenCalledWith('10', mockRequest.user.id, mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: "Sub-tarefa atualizada com sucesso." });
    });
  });
});