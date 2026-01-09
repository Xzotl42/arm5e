const fields = foundry.data.fields;
export class BasicChatSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      img: new fields.FilePathField({
        categories: ["IMAGE"],
        initial: null
      }),
      label: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      }),
      originalFlavor: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      })

      // style/mode : for announcement, OOC, NPC speech.
    };
  }

  static migrateData(data) {}

  static getDefault(itemData) {}

  static migrate(itemData) {
    const updateData = {};

    return updateData;
  }

  addListeners(html) {
    const details = html.querySelector(".clickable");
    if (details) {
      details.addEventListener("click", (ev) => {
        ev.currentTarget.nextElementSibling.classList.toggle("hide");
      });
    }
  }

  getFlavor() {
    return `<h2 class="ars-chat-title chat-icon">${this.label}</h2><div>${this.body}</div>`;
  }

  get body() {
    return this.originalFlavor;
  }

  // standard chat message doesn't have targets;
  formatTargets(html) {
    return "";
  }

  failedRoll() {
    return false;
  }
}
