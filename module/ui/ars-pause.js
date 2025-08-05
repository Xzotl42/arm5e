export class ArsGamePause extends foundry.applications.ui.GamePause {
  /** @override */
  async _prepareContext(_options) {
    return {
      cssClass: game.paused ? "paused" : "",
      icon: "systems/arm5e/assets/clockwork.svg",
      text: game.i18n.localize("GAME.Paused"),
      spin: true
    };
  }

  /* -------------------------------------------- */

  /** @override */
  async _renderHTML(context, options) {
    const img = document.createElement("img");
    img.src = context.icon;
    if (context.spin) {
      img.classList.add("fa-spin");
      img.classList.add("ars-pause");
    }
    const caption = document.createElement("figcaption");
    caption.innerText = context.text;
    return [img, caption];
  }
}
