/**
 * A Tour subclass for finding the user guide
 */
export class UserguideTour extends foundry.nue.Tour {
  /** @override */
  async start() {
    game.togglePause(false);
    await super.start();
  }

  /* -------------------------------------------- */

  /** @override */
  async _preStep() {
    await super._preStep();

    // Configure specific steps
    if (this.id === "sidebar") {
      await this._updateSidebarTab();
    }
  }

  /* -------------------------------------------- */

  async _updateSidebarTab() {
    if (this.currentStep.sidebarTab) {
      ui.sidebar.activateTab(this.currentStep.sidebarTab);
    }
  }
}
