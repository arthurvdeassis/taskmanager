describe('Add Task', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    localStorage.setItem('token', 'fake-jwt-token');
    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: []
    }).as('getTasksInitial');
  });

  it('adiciona uma nova tarefa', () => {
    cy.get('#task-title').type('Tarefa para teste');
    cy.get('#task-priority').select('Alta');
    cy.get('#task-due-date').type('2099-12-31');
    
    cy.intercept('POST', '/api/tasks', {
      statusCode: 200,
      body: { id: 1, title: 'Tarefa para teste', priority: 'Alta', due_date: '2099-12-31', completed: false, subtasks: [] }
    }).as('addTask');

    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: [{ id: 1, title: 'Tarefa para teste', priority: 'Alta', due_date: '2099-12-31', completed: false, subtasks: [] }]
    }).as('getTasksAfterAdd');

    cy.get('.add-task-btn').click();
    cy.wait('@getTasksAfterAdd');

    cy.contains('Tarefa para teste').should('exist');
  });
});
