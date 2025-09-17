import React, { useState } from 'react';
import AlertMessage from './AlertMessage';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState(null);
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setNotification(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotification({ message: data.error || "Erro no registro.", type: 'error' });
      } else {
        onRegisterSuccess();
      }
    } catch (e) {
      setNotification({ message: "Não foi possível conectar ao servidor.", type: 'error' });
    }
  };

  return (
    <div className="auth-container">
      <h1>Gerenciador de Tarefas</h1>
      <h2>Criar conta</h2>
      <AlertMessage notification={notification} />
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Nome de usuário</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="auth-btn">Registrar</button>
      </form>
      <p>Já tem uma conta? <a href="#" onClick={onSwitchToLogin}>Faça login aqui.</a></p>
    </div>
  );
}