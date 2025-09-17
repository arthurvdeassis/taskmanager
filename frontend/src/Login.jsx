import React, { useState } from 'react';
import AlertMessage from './AlertMessage';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState(null);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setNotification(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotification({ message: data.error || "Erro no login.", type: 'error' });
      } else {
        localStorage.setItem('token', data.token);
        onLoginSuccess();
      }
    } catch (e) {
      setNotification({ message: "Não foi possível conectar ao servidor.", type: 'error' });
    }
  };

  return (
    <div className="auth-container">
      <h1>Gerenciador de Tarefas</h1>
      <h2>Login</h2>
      <AlertMessage notification={notification} />
      <form onSubmit={handleLogin}>
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
        <button type="submit" className="auth-btn">Entrar</button>
      </form>
      <p>Não tem uma conta? <a href="#" onClick={onSwitchToRegister}>Registre-se aqui.</a></p>
    </div>
  );
}