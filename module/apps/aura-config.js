import Aura from "../helpers/aura.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AuraConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(scene, options = {}) {
    super(options);
    this.object = scene;
  }

  static DEFAULT_OPTIONS = {
    id: "aura-config",
    classes: ["arm5e-dialog", "sheet", "aura-config", "dialog"],
    tag: "form",
    form: {
      handler: AuraConfig.#onSubmitHandler,
      submitOnChange: false,
      closeOnSubmit: true
    },
    window: {
      title: "arm5e.sheet.auraCfg",
      contentClasses: ["standard-form"]
    },
    position: {
      width: 320,
      height: 515
    }
  };

  static PARTS = {
    form: {
      template: "systems/arm5e/templates/generic/aura-config.html"
    }
  };

  static async #onSubmitHandler(event, form, formData) {
    await this.object.setFlag("arm5e", "aura", {
      values: {
        magic: formData.object.magic,
        faeric: formData.object.faeric,
        divine: formData.object.divine,
        infernal: formData.object.infernal
      },
      visible: formData.object.visible,
      nightModifier: {
        magic: formData.object.magicNightModifier,
        faeric: formData.object.faericNightModifier,
        divine: formData.object.divineNightModifier,
        infernal: formData.object.infernalNightModifier
      }
    });
  }

  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);

    // Some scenes may have null or empty objects for their aura, so merge with the default aura data structure
    context.aura = foundry.utils.mergeObject(
      this.object.getFlag("arm5e", "aura") || {},
      Aura.defaultAura,
      {
        overwrite: false
      }
    );

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.querySelectorAll("input").forEach((input) => {
      input.addEventListener("focusin", (ev) => ev.target.select());
    });
  }
}
