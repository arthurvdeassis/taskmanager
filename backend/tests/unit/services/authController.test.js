const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');

jest.mock('../../../src/services/authService');

describe('Auth Controller - Unit Tests', () => {

  let mockRequest;
  let mockResponse;
  let mockJson; 

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockJson = jest.fn(); 
    mockResponse = {
      status: jest.fn(() => ({ 
        json: mockJson,
      })),
    };
    jest.clearAllMocks();
  });

  // Testes para a função register
  describe('register', () => {

    // Teste 1: Caminho do registro
    it('Deve chamar o authService.registerUser e retornar status 201 em caso de sucesso', async () => {
      mockRequest.body = { username: 'test', password: 'password' };
      authService.registerUser.mockResolvedValue({ id: 1 });

      await authController.register(mockRequest, mockResponse);

      expect(authService.registerUser).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({ message: "Usuário registrado com sucesso!" });
    });

    // Teste 2: Erro - Usuário já existe
    it('Deve retornar status 409 se o serviço lançar um erro de conflito', async () => {
      mockRequest.body = { username: 'test', password: 'password' };
      const error = new Error('Nome de usuário já existe.');
      error.statusCode = 409;
      authService.registerUser.mockRejectedValue(error);

      await authController.register(mockRequest, mockResponse);
      
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Nome de usuário já existe.' });
    });

    // Teste 3: Erro - Falta de senha
    it('Deve retornar status 400 se o serviço lançar um erro de validação', async () => {
        mockRequest.body = { username: 'test' };
        const error = new Error('Dados faltando.');
        error.statusCode = 400;
        authService.registerUser.mockRejectedValue(error);

        await authController.register(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Dados faltando.' });
    });

    // Teste 4: Erro - Falha genérica no servidor no registro
    it('Deve retornar status 500 para um erro inesperado do serviço durante o registro', async () => {
        mockRequest.body = { username: 'test', password: 'password' };
        const error = new Error('Erro inesperado no servidor.');
        authService.registerUser.mockRejectedValue(error);

        await authController.register(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Erro inesperado no servidor.' });
    });
  });

  // Testes para a função login
  describe('login', () => {

    // Teste 5: Caminho do login
    it('Deve chamar o authService.loginUser e retornar status 200 com um token', async () => {
      mockRequest.body = { username: 'test', password: 'password' };
      authService.loginUser.mockResolvedValue({ token: 'fakeToken' });

      await authController.login(mockRequest, mockResponse);

      expect(authService.loginUser).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ token: 'fakeToken', message: "Login bem-sucedido!" });
    });

    // Teste 6: Erro - Credenciais inválidas
    it('Deve retornar status 401 se o serviço lançar erro de credenciais inválidas', async () => {
      mockRequest.body = { username: 'test', password: 'wrongpassword' };
      const error = new Error('Credenciais inválidas.');
      error.statusCode = 401;
      authService.loginUser.mockRejectedValue(error);

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Credenciais inválidas.' });
    });

    // Teste 7: Erro - Falha genérica do servidor no login
    it('Deve retornar status 500 para um erro inesperado do serviço durante o login', async () => {
        mockRequest.body = { username: 'test', password: 'password' };
        const error = new Error('Erro ao comparar senhas.');
        authService.loginUser.mockRejectedValue(error);

        await authController.login(mockRequest, mockResponse);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao comparar senhas.' });
    });
  });
});