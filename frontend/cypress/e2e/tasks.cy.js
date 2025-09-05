describe("Gerenciador de Tarefas", () => {
  it("Fluxo principal: criar, alternar e excluir a tarefa correta", () => {
    cy.visit("/");

    // criar
    cy.get('[data-testid="task-input"]').type("Teste Cypress");
    cy.get('[data-testid="add-task-btn"]').click();
    cy.contains('[data-testid="task-item"]', "Teste Cypress").should("be.visible");

    // alternar (garante que age na tarefa inserida)
    cy.contains('[data-testid="task-item"]', "Teste Cypress").within(() => {
      cy.get('[data-testid="toggle-task-btn"]').click();
    });

    // excluir
    cy.contains('[data-testid="task-item"]', "Teste Cypress").within(() => {
      cy.get('[data-testid="delete-task-btn"]').click();
    });

    cy.contains('[data-testid="task-item"]', "Teste Cypress").should("not.exist");
  });
});
