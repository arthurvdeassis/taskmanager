# Gerenciador de Tarefas

Arthur Vieira de Assis Moreira

Um sistema completo para gerenciar suas tarefas diárias, com funcionalidades de autenticação de usuário, sub-tarefas, prioridade e datas de vencimento. Desenvolvido como uma aplicação Full-Stack, com backend em Node.js e frontend em React.

---

## 🚀 Funcionalidades

- **CRUD Completo**: Crie, leia, atualize e exclua tarefas e sub-tarefas.
- **Autenticação de Usuário**: Sistema de registro e login com senhas seguras (criptografadas com `bcryptjs`).
- **API Segura**: Todas as rotas de tarefas são protegidas por tokens JWT, garantindo que apenas usuários autenticados possam acessar e manipular seus dados.
- **Sub-tarefas**: Cada tarefa principal pode conter sub-tarefas, permitindo uma organização mais granular.
- **Detalhes da Tarefa**: Defina título, prioridade (**Alta**, **Normal**, **Baixa**) e data de vencimento para cada tarefa.
- **Interface Intuitiva**: Frontend com design responsivo, filtros por status da tarefa e ordenação por prioridade ou data de vencimento.
- **Banco de Dados Leve**: Utiliza SQLite para um banco de dados local e eficiente.
- **CI/CD com Cobertura de Código**: O projeto inclui um pipeline de CI/CD automatizado no GitHub Actions, que roda testes e monitora a cobertura de código com o Codecov.

---

## 💻 Tecnologias

### **Backend**
- **Node.js com Express**: Servidor web e roteamento da API.
- **SQLite3**: Banco de dados relacional leve.
- **bcryptjs**: Para criptografia segura de senhas.
- **jsonwebtoken**: Para autenticação com JWT (JSON Web Tokens).
- **Jest & Supertest**: Frameworks para testes de unidade e integração da API.

### **Frontend**
- **React**: Biblioteca JavaScript para construir a interface de usuário.
- **Framer Motion**: Para animações suaves.
- **HTML/CSS**: Estrutura e estilização dos componentes.

### **Testes e Automação**
- **Jest**: Framework de testes.
- **Codecov**: Ferramenta de relatórios de cobertura de código.
- **GitHub Actions**: Para automação do pipeline de CI/CD.

---

## ▶️ Como Rodar o Projeto

### **Pré-requisitos**
- Node.js (versão 18 ou superior)
- npm (gerenciador de pacotes do Node.js)

### **Passo a Passo**

1. **Clone o repositório:**
    ```bash
    git clone https://github.com/arthurvdeassis/taskmanager
    cd taskmanager
    ```

2. **Instale as dependências do backend:**
    ```bash
    cd backend
    npm install
    ```

3. **Inicie o servidor de backend:**
    ```bash
    npm run dev
    ```
    O backend será iniciado na porta `3000`.

4. **Instale as dependências do frontend:**
    ```bash
    cd frotend
    npm install
    ```

5. **Inicie o frontend:**
    ```bash
    npm run dev
    ```
    O frontend será iniciado na porta `5000`.

## 🧪 Testes e Cobertura de Código

O projeto utiliza **Jest** para testes de unidade e integração. Para rodar os testes localmente, siga os comandos abaixo:

1. **Rodar os testes:**
    ```bash
    cd backend
    npm test
    ```
    O console exibirá o resultado dos testes, mostrando quais passaram e quais falharam.

2. **Verificar a cobertura de código:**
    ```bash
    npm run test:cov
    ```
    Este comando rodará os testes e gerará um relatório detalhado de cobertura, mostrando a porcentagem de código que está sendo testada.

---

## ⚙️ CI/CD com GitHub Actions

Este projeto está configurado para usar o GitHub Actions para automatizar o processo de testes e cobertura de código.

O arquivo de fluxo de trabalho (`.github/workflows/ci.yml`) garante que:
- A cada `push` para a branch `main`, os testes são executados automaticamente.
- A cada `pull request` para a branch `main`, os testes são rodados, e um relatório de cobertura é enviado para o Codecov.
