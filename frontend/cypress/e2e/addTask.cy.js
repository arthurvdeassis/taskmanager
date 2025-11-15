describe('Add Task', () => {
  let getTasksCallCount = 0;

  beforeEach(() => {
    getTasksCallCount = 0;
    cy.intercept('GET', '/api/tasks', (req) => {
      getTasksCallCount += 1;
      if (getTasksCallCount === 1) {
        req.reply({ statusCode: 200, body: [] });
      } else {
        req.reply({ statusCode: 200, body: [
          { id: 1, title: 'Tarefa para teste', priority: 'Alta', due_date: '2099-12-31', completed: false, subtasks: [] }
        ] });
      }
    }).as('getTasks');

    cy.intercept('POST', '/api/tasks', {
      statusCode: 200,
      body: { id: 1, title: 'Tarefa para teste', priority: 'Alta', due_date: '2099-12-31', completed: false, subtasks: [] }
    }).as('addTask');

    cy.visit('http://localhost:5173', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake-jwt-token');
      }
    });
  });

  it('adiciona uma nova tarefa', () => {
    cy.wait('@getTasks');

    cy.get('#task-title').type('Tarefa para teste');
    cy.get('#task-priority').select('Alta');
    cy.get('#task-due-date').type('2099-12-31');
    cy.get('.add-task-btn').click();

    cy.wait('@addTask');
    cy.wait('@getTasks');

    cy.contains('Tarefa para teste').should('exist');
  });
});
