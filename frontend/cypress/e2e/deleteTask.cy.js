describe('Delete Task', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    localStorage.setItem('token', 'fake-jwt-token');
    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: [{ id: 2, title: 'Tarefa para teste', subtasks: [] }]
    }).as('getTasksInitial');
    
    cy.intercept('DELETE', '/api/tasks/2', { statusCode: 200 }).as('deleteTask');
    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: []
    }).as('getTasksAfterDelete');
  });

  it('exclui uma tarefa', () => {
    cy.contains('Tarefa para teste').should('exist');
    cy.get('.delete-task-btn').click();
    cy.contains('Sim').click();

    cy.wait('@deleteTask');
    cy.wait('@getTasksAfterDelete');

    cy.contains('Tarefa para teste').should('not.exist');
  });
});
