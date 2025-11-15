describe('Edit Subtask', () => {
  let getTasksCallCount = 0;

  beforeEach(() => {
    getTasksCallCount = 0;

    cy.intercept('GET', '/api/tasks', (req) => {
      getTasksCallCount += 1;
      if (getTasksCallCount === 1) {
        req.reply({
          statusCode: 200,
          body: [{
            id: 1,
            title: 'Tarefa para teste',
            subtasks: [{ id: 101, title: 'Sub-tarefa para teste', completed: false }]
          }]
        });
      } else {
        req.reply({
          statusCode: 200,
          body: [{
            id: 1,
            title: 'Tarefa para teste',
            subtasks: [{ id: 101, title: 'Sub-tarefa para teste', completed: false }]
          }]
        });
      }
    }).as('getTasks');

    cy.visit('http://localhost:5173', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake-jwt-token');
      }
    });
  });

  it('edita subtarefa', () => {
    cy.wait('@getTasks');

    cy.contains('Tarefa para teste').should('exist');
    cy.get('.expand-btn').click();
    cy.get('.subtask-edit-btn').first().click();

    cy.get('#edit-subtask-title').clear().type('Sub-tarefa para teste');

    cy.intercept('PUT', '/api/tasks/subtasks/101', {
      statusCode: 200,
      body: { id: 101, title: 'Sub-tarefa para teste', completed: false }
    }).as('putSubtask');

    cy.get('.btn-save').click();

    cy.wait('@putSubtask');
    cy.wait('@getTasks');

    cy.contains('Sub-tarefa para teste').should('exist');
  });
});
