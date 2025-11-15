let callCount = 0;

beforeEach(() => {
  callCount = 0;

  cy.intercept('GET', '/api/tasks', (req) => {
    callCount += 1;
    if (callCount === 1) {
      req.reply({
        statusCode: 200,
        body: [{ id: 42, title: 'Tarefa para teste', completed: false, subtasks: [] }]
      });
    } else {
      req.reply({
        statusCode: 200,
        body: []
      });
    }
  }).as('getTasks');

  cy.intercept('DELETE', '/api/tasks/42', { statusCode: 200 }).as('deleteTask');

  cy.visit('http://localhost:5173', {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'fake-jwt-token');
    }
  });
});

it('exclui uma tarefa de teste', () => {
  cy.wait('@getTasks');

  cy.contains('Tarefa para teste').should('exist');
  cy.get('.delete-task-btn').click();
  cy.contains('Sim').click();

  cy.wait('@deleteTask');
  cy.wait('@getTasks');

  cy.contains('Tarefa para teste').should('not.exist');
});
