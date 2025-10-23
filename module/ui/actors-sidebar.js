import { log } from "../tools.js";

export class ArsActorDirectory extends DocumentDirectory {
  constructor(...args) {
    super(...args);
    // this._dragDrop[0].permissions.dragstart = () => game.user.can("TOKEN_CREATE");
    this._dragDrop[0].permissions.drop = () => game.user.can("ACTOR_CREATE");
  }

  /* -------------------------------------------- */

  /** @override */
  static documentName = "Actor";

  /* -------------------------------------------- */

  /** @override */
  _canDragStart(selector) {
    log(false, "Checking drag start permission for actor directory");
    return this.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED);
    // return game.user.can("TOKEN_CREATE");
  }

  /* -------------------------------------------- */

  /** @override */
  _onDragStart(event) {
    log(false, "Actor directory drag start");
    const li = event.currentTarget.closest(".directory-item");
    let actor = null;
    if (li.dataset.documentId) {
      actor = game.actors.get(li.dataset.documentId);
      if (!actor || !actor.visible) return false;
    }

    // Parent directory drag start handling
    super._onDragStart(event);

    // Create the drag preview for the Token
    if (actor && canvas.ready) {
      const img = li.querySelector("img");
      const pt = actor.prototypeToken;
      const w =
        pt.width * canvas.dimensions.size * Math.abs(pt.texture.scaleX) * canvas.stage.scale.x;
      const h =
        pt.height * canvas.dimensions.size * Math.abs(pt.texture.scaleY) * canvas.stage.scale.y;
      const preview = DragDrop.createDragImage(img, w, h);
      event.dataTransfer.setDragImage(preview, w / 2, h / 2);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _canDragDrop(selector) {
    return game.user.can("ACTOR_CREATE");
  }

  /* -------------------------------------------- */

  /** @override */
  _getEntryContextOptions() {
    const options = super._getEntryContextOptions();
    return [
      {
        name: "SIDEBAR.CharArt",
        icon: '<i class="fas fa-image"></i>',
        condition: (li) => {
          const actor = game.actors.get(li.data("documentId"));
          return actor.img !== CONST.DEFAULT_TOKEN;
        },
        callback: (li) => {
          const actor = game.actors.get(li.data("documentId"));
          new ImagePopout(actor.img, {
            title: actor.name,
            uuid: actor.uuid
          }).render(true);
        }
      },
      {
        name: "SIDEBAR.TokenArt",
        icon: '<i class="fas fa-image"></i>',
        condition: (li) => {
          const actor = game.actors.get(li.data("documentId"));
          if (actor.prototypeToken.randomImg) return false;
          return ![null, undefined, CONST.DEFAULT_TOKEN].includes(actor.prototypeToken.texture.src);
        },
        callback: (li) => {
          const actor = game.actors.get(li.data("documentId"));
          new ImagePopout(actor.prototypeToken.texture.src, {
            title: actor.name,
            uuid: actor.uuid
          }).render(true);
        }
      }
    ].concat(options);
  }
}
