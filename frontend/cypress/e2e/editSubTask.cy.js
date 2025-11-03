describe('Edit Subtask', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
    localStorage.setItem('token', 'fake-jwt-token');
    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: [{ id: 1, title: 'Tarefa para teste', subtasks: [{ id: 101, title: 'Sub X1', completed: false }] }]
    }).as('getTasksInitial');
  });

  it('edita subtarefa', () => {
    cy.contains('Tarefa para teste').should('exist');
    cy.get('.expand-btn').click();
    cy.get('.subtask-edit-btn').first().click();

    cy.get('#edit-subtask-title').clear().type('Sub-tarefa para teste');
    cy.intercept('PUT', '/api/tasks/subtasks/101', {
      statusCode: 200,
      body: { id: 101, title: 'Sub-tarefa para teste', completed: false }
    }).as('putSubtask');

    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: [{ id: 1, title: 'Tarefa para teste', subtasks: [{ id: 101, title: 'Sub-tarefa para teste', completed: false }] }]
    }).as('getTasksUpdated');

    cy.get('.btn-save').click();

    cy.wait('@getTasksUpdated');
    cy.contains('Sub-tarefa para teste').should('exist');
  });
});
