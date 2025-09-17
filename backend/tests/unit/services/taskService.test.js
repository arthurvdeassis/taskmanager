const taskService = require('../../../src/services/taskService');
const taskRepository = require('../../../src/repositories/taskRepository');

jest.mock('../../../src/repositories/taskRepository');

describe('Task Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testes para a busca de tarefas
  describe('getTasksForUser', () => {
    // Teste 1: Busca e mapeamento de tarefas e subtarefas
    it('Deve buscar e mapear tarefas e subtarefas corretamente', async () => {
      const tasks = [{ id: 1, title: 'Task 1' }, { id: 2, title: 'Task 2' }];
      const subtasks = [{ id: 10, title: 'Subtask 1.1', task_id: 1 }];
      taskRepository.findAllByUserId.mockResolvedValue(tasks);
      taskRepository.findAllSubtasksByUserId.mockResolvedValue(subtasks);

      const result = await taskService.getTasksForUser(1);

      expect(result[0].subtasks).toHaveLength(1);
      expect(result[1].subtasks).toHaveLength(0);
    });

    // Teste 2: Usuário sem tarefas
    it('Deve retornar um array vazio se o usuário não tiver tarefas', async () => {
      taskRepository.findAllByUserId.mockResolvedValue([]);
      taskRepository.findAllSubtasksByUserId.mockResolvedValue([]);

      const result = await taskService.getTasksForUser(1);

      expect(result).toEqual([]);
    });

    // Teste 3: Tarefas sem subtarefas
    it('Deve retornar tarefas com array de subtarefas vazio se não houver subtarefas', async () => {
        const tasks = [{ id: 1, title: 'Task 1' }];
        taskRepository.findAllByUserId.mockResolvedValue(tasks);
        taskRepository.findAllSubtasksByUserId.mockResolvedValue([]);

        const result = await taskService.getTasksForUser(1);

        expect(result[0].subtasks).toEqual([]);
      });

    // Teste 4: Erro - Repositório falhou ao buscar tarefas
    it('Deve repassar um erro se o repositório falhar ao buscar tarefas', async () => {
      taskRepository.findAllByUserId.mockRejectedValue(new Error('DB Error'));

      await expect(taskService.getTasksForUser(1)).rejects.toThrow('DB Error');
    });
  });

  // Testes para a criação de tarefas
  describe('createTaskForUser', () => {
    // Teste 5: Criação com valores padrão
    it('Deve criar uma nova tarefa com sucesso, usando valores padrão', async () => {
      taskRepository.findByTitleAndUserId.mockResolvedValue(null);
      taskRepository.create.mockResolvedValue({ id: 1 });

      await taskService.createTaskForUser({ title: 'New Task', userId: 1 });

      expect(taskRepository.create).toHaveBeenCalledWith(expect.objectContaining({ priority: 'Normal', dueDate: 'Sem vencimento' }));
    });
    
    // Teste 6: Erro - Falta de título
    it('Deve lançar um erro 400 se o título da tarefa não for fornecido', async () => {
      await expect(taskService.createTaskForUser({ userId: 1 })).rejects.toThrow('Título obrigatório');
    });

    // Teste 7: Erro - Duplicidade
    it('Deve lançar um erro 409 se uma tarefa com o mesmo título já existir', async () => {
      taskRepository.findByTitleAndUserId.mockResolvedValue({ id: 1 });

      await expect(taskService.createTaskForUser({ title: 'Existing Task', userId: 1 }))
        .rejects
        .toThrow('Já existe uma tarefa com este nome.');
    });

    // Teste 8: Criação com data vazia
    it('Deve definir data como "Sem vencimento" se uma string vazia for passada', async () => {
        taskRepository.findByTitleAndUserId.mockResolvedValue(null);
        taskRepository.create.mockResolvedValue({ id: 1 });

        await taskService.createTaskForUser({ title: 'Task Date Test', due_date: '', userId: 1 });

        expect(taskRepository.create).toHaveBeenCalledWith(expect.objectContaining({ dueDate: 'Sem vencimento' }));
      });
  });

  // Testes para atualização de tarefas
  describe('updateTaskForUser', () => {
    // Teste 9: Atualização de múltiplos campos
    it('Deve atualizar múltiplos campos de uma tarefa com sucesso', async () => {
      taskRepository.update.mockResolvedValue({ changes: 1 });
      const updateData = { title: 'Updated Task', completed: true };

      await taskService.updateTaskForUser(1, 1, updateData);

      expect(taskRepository.update).toHaveBeenCalledWith(1, 1, { title: 'Updated Task', completed: 1 });
    });

    // Teste 10: Erro - Tarefa não encontrada
    it('Deve lançar um erro 404 se a tarefa a ser atualizada não for encontrada', async () => {
      taskRepository.update.mockResolvedValue({ changes: 0 });

      await expect(taskService.updateTaskForUser(999, 1, { title: 'Nonexistent' }))
        .rejects
        .toThrow('Tarefa não encontrada');
    });

    // Teste 11: Erro - Falta de campos
    it('Deve lançar um erro 400 se nenhum campo for fornecido para atualização', async () => {
      await expect(taskService.updateTaskForUser(1, 1, {}))
        .rejects
        .toThrow('Nenhum campo para atualizar fornecido.');
    });

    // Teste 12: Atualização do status 'completed' para false
    it('Deve converter "completed: false" para 0 corretamente', async () => {
        taskRepository.update.mockResolvedValue({ changes: 1 });

        await taskService.updateTaskForUser(1, 1, { completed: false });

        expect(taskRepository.update).toHaveBeenCalledWith(1, 1, { completed: 0 });
      });
  });

  // Testes para deleção de tarefas
  describe('deleteTaskForUser', () => {
    // Teste 13: Caminho da deleção
    it('Deve deletar uma tarefa com sucesso', async () => {
      taskRepository.remove.mockResolvedValue({ changes: 1 });

      await taskService.deleteTaskForUser(1, 1);

      expect(taskRepository.remove).toHaveBeenCalledWith(1, 1);
    });

    // Teste 14: Erro - Deleção por tarefa não encontrada
    it('Deve lançar um erro 404 se a tarefa a ser deletada não for encontrada', async () => {

      taskRepository.remove.mockResolvedValue({ changes: 0 });

      await expect(taskService.deleteTaskForUser(999, 1))
        .rejects
        .toThrow('Tarefa não encontrada');
    });
  });

  // Testes para criação de subtarefas
  describe('createSubtaskForUser', () => {
    // Teste 15: Caminho da criação de subtarefa
    it('Deve criar uma nova subtarefa com sucesso', async () => {
      taskRepository.createSubtask.mockResolvedValue({ id: 10 });

      await taskService.createSubtaskForUser({ title: 'New Subtask', taskId: 1, userId: 1 });

      expect(taskRepository.createSubtask).toHaveBeenCalled();
    });

    // Teste 16: Erro - Falta de título
    it('Deve lançar um erro 400 se o título da subtarefa não for fornecido', async () => {

      await expect(taskService.createSubtaskForUser({ taskId: 1, userId: 1 }))
        .rejects
        .toThrow('Título da sub-tarefa é obrigatório.');
    });
  });
  
  // Testes para atualização de subtarefas
  describe('updateSubtaskForUser', () => {
    // Teste 17: Caminho da atualização
    it('Deve atualizar uma subtarefa com sucesso', async () => {
        taskRepository.updateSubtask.mockResolvedValue({ changes: 1 });

        await taskService.updateSubtaskForUser(10, 1, { completed: true });

        expect(taskRepository.updateSubtask).toHaveBeenCalledWith(10, 1, { completed: 1 });
    });

    // Teste 18: Erro - Subtarefa não encontrada
    it('Deve lançar um erro 404 se a subtarefa a ser atualizada não for encontrada', async () => {
        taskRepository.updateSubtask.mockResolvedValue({ changes: 0 });

        await expect(taskService.updateSubtaskForUser(999, 1, { completed: true }))
            .rejects
            .toThrow('Sub-tarefa não encontrada.');
    });
  });

  // Testes para deleção de subtarefas
  describe('deleteSubtaskForUser', () => {
    // Teste 19: Caminho da deleção
    it('Deve deletar uma subtarefa com sucesso', async () => {
      taskRepository.removeSubtask.mockResolvedValue({ changes: 1 });

      await taskService.deleteSubtaskForUser(10, 1);

      expect(taskRepository.removeSubtask).toHaveBeenCalledWith(10, 1);
    });
    
    // Teste 20: Erro - Subtarefa não encontrada
    it('Deve lançar um erro 404 se a subtarefa a ser deletada não for encontrada', async () => {
      taskRepository.removeSubtask.mockResolvedValue({ changes: 0 });
      
      await expect(taskService.deleteSubtaskForUser(999, 1))
        .rejects
        .toThrow('Sub-tarefa não encontrada.');
    });
  });
});