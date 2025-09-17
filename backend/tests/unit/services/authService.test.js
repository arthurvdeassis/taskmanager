const authService = require('../../../src/services/authService');
const userRepository = require('../../../src/repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../../src/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testes para a função registerUser
  describe('registerUser', () => {

    // Teste 1: Caminho do registro
    it('Deve registrar um novo usuário com sucesso', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.create.mockResolvedValue({ id: 1 });

      const result = await authService.registerUser({ username: 'testuser', password: 'password123' });
      
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.create).toHaveBeenCalledWith({ username: 'testuser', hashedPassword: 'hashedPassword' });
      expect(result).toEqual({ id: 1 });
    });

    // Teste 2: Erro - usuário já existe
    it('Deve lançar um erro 409 se o nome de usuário já existe', async () => {
      userRepository.findByUsername.mockResolvedValue({ id: 1, username: 'testuser' });
      
      await expect(authService.registerUser({ username: 'testuser', password: 'password123' }))
        .rejects
        .toThrow('Nome de usuário já existe.');
    });

    // Teste 3: Erro - username ausente (undefined)
    it('Deve lançar um erro 400 se o nome de usuário for undefined', async () => {
      await expect(authService.registerUser({ password: 'password123' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 4: Erro - password ausente (undefined)
    it('Deve lançar um erro 400 se a senha for undefined', async () => {
      await expect(authService.registerUser({ username: 'testuser' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 5: Erro - username nulo
    it('Deve lançar um erro 400 se o nome de usuário for null', async () => {
      await expect(authService.registerUser({ username: null, password: 'password123' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 6: Erro - password nulo
    it('Deve lançar um erro 400 se a senha for null', async () => {
      await expect(authService.registerUser({ username: 'testuser', password: null }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 7: Erro - username como string vazia
    it('Deve lançar um erro 400 se o nome de usuário for uma string vazia', async () => {
      await expect(authService.registerUser({ username: '', password: 'password123' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 8: Erro - password como string vazia
    it('Deve lançar um erro 400 se a senha for uma string vazia', async () => {
      await expect(authService.registerUser({ username: 'testuser', password: '' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 9: Erro - Falha no repositório ao buscar usuário
    it('Deve repassar um erro inesperado do repositório durante a busca', async () => {
      userRepository.findByUsername.mockRejectedValue(new Error('DB Error'));

      await expect(authService.registerUser({ username: 'testuser', password: 'password123' }))
        .rejects
        .toThrow('DB Error');
    });

    // Teste 10: Erro - Falha no bcrypt
    it('Deve repassar um erro inesperado do bcrypt ao hashear a senha', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      bcrypt.hash.mockRejectedValue(new Error('Hash Error'));
      
      await expect(authService.registerUser({ username: 'testuser', password: 'password123' }))
        .rejects
        .toThrow('Hash Error');
    });
  });

  // Testes para a função loginUser
  describe('loginUser', () => {
    
    // Teste 11: Caminho do login
    it('Deve logar um usuário com sucesso e retornar um token', async () => {
      const user = { id: 1, username: 'testuser', password: 'hashedPassword' };
      userRepository.findByUsername.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fakeToken');

      const result = await authService.loginUser({ username: 'testuser', password: 'password123' });

      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1, username: 'testuser' }, expect.any(String), expect.any(Object));
      expect(result).toEqual({ token: 'fakeToken' });
    });

    // Teste 12: Erro - usuário não encontrado
    it('Deve lançar um erro 401 se o usuário não for encontrado', async () => {
      userRepository.findByUsername.mockResolvedValue(null);

      await expect(authService.loginUser({ username: 'nonexistent', password: 'password123' }))
        .rejects
        .toThrow('Credenciais inválidas.');
    });

    // Teste 13: Erro - senha incorreta
    it('Deve lançar um erro 401 se a senha estiver incorreta', async () => {
      const user = { id: 1, username: 'testuser', password: 'hashedPassword' };
      userRepository.findByUsername.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);
      
      await expect(authService.loginUser({ username: 'testuser', password: 'wrongpassword' }))
        .rejects
        .toThrow('Credenciais inválidas.');
    });

    // Teste 14: Erro - username ausente (undefined)
    it('Deve lançar um erro 400 se o username for undefined no login', async () => {
      await expect(authService.loginUser({ password: 'password123' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });
    
    // Teste 15: Erro - password ausente (undefined)
    it('Deve lançar um erro 400 se a senha for undefined no login', async () => {
      await expect(authService.loginUser({ username: 'testuser' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 16: Erro - Username como string com espaços
    it('Deve lançar um erro 400 se o username for apenas espaços', async () => {
      await expect(authService.loginUser({ username: '   ', password: 'password123' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });
        
    // Teste 17: Erro - Senha como string com espaços
    it('Deve lançar um erro 400 se a senha for apenas espaços', async () => {
      await expect(authService.loginUser({ username: 'testuser', password: '   ' }))
        .rejects
        .toThrow('Nome de usuário e senha são obrigatórios.');
    });

    // Teste 18: Erro - Falha no repositório ao buscar usuário para login
    it('Deve repassar um erro inesperado do repositório na busca para login', async () => {
        userRepository.findByUsername.mockRejectedValue(new Error('DB Error on find'));

        await expect(authService.loginUser({ username: 'testuser', password: 'password123' }))
          .rejects
          .toThrow('DB Error on find');
      });
  
    // Teste 19: Erro - Falha no bcrypt.compare
    it('Deve repassar um erro inesperado do bcrypt.compare', async () => {
        const user = { id: 1, username: 'testuser', password: 'hashedPassword' };
        userRepository.findByUsername.mockResolvedValue(user);
        bcrypt.compare.mockRejectedValue(new Error('Compare Error'));
        
        await expect(authService.loginUser({ username: 'testuser', password: 'password123' }))
          .rejects
          .toThrow('Compare Error');
    });

    // Teste 20: Erro - Usuário sem senha no banco
    it('Deve falhar se o usuário retornado do banco não tiver senha', async () => {
      const userWithoutPassword = { id: 1, username: 'testuser', password: null };
      userRepository.findByUsername.mockResolvedValue(userWithoutPassword);
      
      bcrypt.compare.mockRejectedValue(new TypeError('hash must be a string'));
      await expect(authService.loginUser({ username: 'testuser', password: 'password123' }))
        .rejects
        .toThrow('hash must be a string');
    });
  });
});