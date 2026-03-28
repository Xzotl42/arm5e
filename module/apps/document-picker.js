const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * A reusable dialog to select one or more documents from a WorldCollection or a Map<id, Document>.
 *
 * @example
 * // Multi-select from a world collection
 * const selected = await DocumentPicker.pick(game.actors, {
 *   title: "Choose a Magus",
 *   filters: [{ label: "Magi only", fn: a => a.type === "magus" }],
 *   flavor: "PC"
 * });
 *
 * @example
 * // Single-select with extra columns
 * const [actor] = await DocumentPicker.pick(game.actors, {
 *   singleSelect: true,
 *   fields: [{ key: "system.age.value", label: "Age" }]
 * });
 */
export class DocumentPicker extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {Set<string>} Currently selected document IDs */
  _selectedIds = new Set();

  /** @type {number} Index of the active filter in options.filters */
  _activeFilterIndex = 0;

  /** @type {Function|null} Promise resolve callback */
  _resolve = null;

  /** @type {boolean} Whether the promise has already been resolved */
  _settled = false;

  constructor(options = {}) {
    super(options);
  }

  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: "document-picker",
    tag: "div",
    classes: ["arm5e", "document-picker"],
    window: {
      resizable: false
    },
    position: {
      width: 440,
      height: "auto"
    },
    actions: {
      confirm: DocumentPicker.#onConfirm,
      cancel: DocumentPicker.#onCancel,
      toggleItem: DocumentPicker.#onToggleItem
    }
  };

  /* -------------------------------------------- */

  get title() {
    return this.options.title ?? game.i18n.localize("arm5e.dialog.pickDocuments");
  }

  /* -------------------------------------------- */

  static PARTS = {
    header: {
      template: "systems/arm5e/templates/generic/parts/document-picker-header.hbs"
    },
    body: {
      template: "systems/arm5e/templates/generic/document-picker-body.hbs",
      scrollable: [".doc-picker-list"]
    },
    footer: {
      template: "systems/arm5e/templates/generic/parts/document-picker-footer.hbs"
    },
    buttons: {
      template: "systems/arm5e/templates/roll/parts/roll-buttons.hbs"
    }
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options = {}) {
    const context = await super._prepareContext(options);
    const {
      source,
      filters = [],
      fields = [],
      singleSelect = false,
      flavor = "Neutral"
    } = this.options;

    // Determine the active filter function
    const filterFn = filters.length > 0 ? filters[this._activeFilterIndex]?.fn ?? null : null;

    // Build the item list
    const items = [];
    for (const doc of source.values()) {
      if (filterFn && !filterFn(doc)) continue;
      items.push({
        id: doc.id,
        img: doc.img ?? "icons/svg/mystery-man.svg",
        name: doc.name,
        selected: this._selectedIds.has(doc.id),
        extraFields: fields.map((f) => ({
          label: f.label,
          value:
            (typeof f.fn === "function" ? f.fn(doc) : foundry.utils.getProperty(doc, f.key)) ?? ""
        }))
      });
    }

    // Build filter select options
    const filterOptions = filters.map((f, i) => ({
      label: f.label,
      value: i,
      active: i === this._activeFilterIndex
    }));

    context.items = items;
    context.fields = fields;
    context.singleSelect = singleSelect;
    context.filters = filterOptions;
    context.hasFilters = filters.length > 1;
    context.flavor = flavor;

    // Build buttons array (same format as roll-buttons.hbs expects)
    const buttons = [];
    if (!singleSelect) {
      buttons.push({
        label: "arm5e.generic.confirm",
        action: "confirm",
        icon: "fas fa-check",
        cssClass: "dialog-button"
      });
    }
    buttons.push({
      label: "arm5e.dialog.button.cancel",
      action: "cancel",
      icon: "fas fa-ban",
      cssClass: "dialog-button"
    });
    context.buttons = buttons;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  _onRender(context, options) {
    // Apply the tiled background to window-content so it aligns seamlessly
    // behind the header and footer image parts
    const flavor = this.options.flavor ?? "Neutral";
    const windowContent = this.element.querySelector(".window-content");
    if (windowContent) {
      windowContent.style.backgroundImage = `url('systems/arm5e/assets/item/Thin/${flavor}_background.webp')`;
      windowContent.style.backgroundRepeat = "repeat-y";
      windowContent.style.backgroundSize = "100%";
    }

    // Wire the filter <select> change event manually because ApplicationV2
    // actions are click-based, not change-based
    const filterSelect = this.element.querySelector(".doc-picker-filter-select");
    filterSelect?.addEventListener("change", (ev) => {
      this._activeFilterIndex = Number(ev.currentTarget.value);
      this.render();
    });
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  /**
   * Toggle a document's selection state.
   * In single-select mode, immediately confirms the selection.
   * @private
   */
  static async #onToggleItem(event, target) {
    const id = target.dataset.id;
    const { singleSelect = false } = this.options;

    if (singleSelect) {
      this._selectedIds = new Set([id]);
      this.#confirmAndClose();
    } else {
      if (this._selectedIds.has(id)) {
        this._selectedIds.delete(id);
      } else {
        this._selectedIds.add(id);
      }
      this.render();
    }
  }

  /** @private Confirm the current selection and close. */
  static async #onConfirm(event, target) {
    this.#confirmAndClose();
  }

  /** @private Cancel: resolve with an empty array and close. */
  static async #onCancel(event, target) {
    if (!this._settled) {
      this._settled = true;
      if (this._resolve) this._resolve([]);
    }
    this.close();
  }

  /* -------------------------------------------- */

  /**
   * Resolve the promise with the currently selected documents and close.
   * @private
   */
  #confirmAndClose() {
    if (this._settled) return;
    const { source } = this.options;
    const selected = [];
    for (const doc of source.values()) {
      if (this._selectedIds.has(doc.id)) selected.push(doc);
    }
    this._settled = true;
    if (this._resolve) this._resolve(selected);
    this.close();
  }

  /* -------------------------------------------- */

  /** @override Resolve with [] if the window is closed without confirming. */
  async _onClose(options = {}) {
    if (!this._settled) {
      this._settled = true;
      if (this._resolve) this._resolve([]);
    }
    return super._onClose(options);
  }

  // Utility function to open a DocumentPicker for owned characters, used in multiple places in the Scriptorium app
  static async selectOwnedCharacter(title) {
    const filters = [
      {
        label: "ownedChars",
        fn: (e) => {
          return e.isOwner && e.isCharacter();
        }
      }
    ];
    const singleSelect = true;
    const flavor = CONFIG.ARM5E.FLAVORS.Laboratory;
    return await DocumentPicker.pick(game.actors, {
      title: game.i18n.localize(title),
      filters,
      singleSelect,
      flavor
    });
  }

  /* -------------------------------------------- */
  /*  Static Factory                              */
  /* -------------------------------------------- */

  /**
   * Open a DocumentPicker dialog and return a Promise that resolves with the
   * selected documents when the user confirms, or an empty array on cancel/close.
   *
   * @param {WorldCollection|Map<string, Document>} source  The collection or map to pick from
   * @param {object}  [options]
   * @param {Array<{label: string, fn: Function}>} [options.filters=[]]
   *   Named filter functions. Each is shown as an option in a <select>.
   * @param {string}  [options.title]                  Dialog window title
   * @param {Array<{key: string, label: string}|{fn: Function, label: string}>} [options.fields=[]]
   *   Extra document fields to display as additional columns.
   *   Each entry needs a `label` and either a dot-notation `key` or an anonymous `fn(doc)` function.
   * @param {boolean} [options.singleSelect=false]
   *   When true, uses radio buttons and auto-confirms on selection.
   * @param {"Neutral"|"PC"|"NPC"|"Lab"|"covenant"|"codex"} [options.flavor="Neutral"]
   *   Selects which Thin asset set to use for the dialog chrome.
   * @returns {Promise<Document[]>}
   */
  static async pick(source, options = {}) {
    return new Promise((resolve) => {
      const picker = new DocumentPicker({ source, ...options });
      picker._resolve = resolve;
      picker.render({ force: true });
    });
  }
}
