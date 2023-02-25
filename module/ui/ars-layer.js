import { log } from "../tools.js";
import { setAuraValueForAllTokensInScene, clearAuraFromActor } from "../helpers/aura.js";
import { Astrolab } from "../tools/astrolab.js";
import { ArM5eActiveEffectConfig } from "../helpers/active-effect-config.sheet.js";
import { Scriptorium } from "../tools/scriptorium.js";

export class ArsLayer extends InteractionLayer {
  async draw() {
    await super.draw();
    return this;
  }

  async _draw() {}

  static async selectAura() {
    const aura = game.scenes.viewed.getFlag("world", "aura_" + game.scenes.viewed._id);
    const type = game.scenes.viewed.getFlag("world", "aura_type_" + game.scenes.viewed._id);
    let currentAura = game.i18n.localize("arm5e.generic.none");
    if (aura !== undefined && !Number.isNaN(aura) && type !== undefined && !Number.isNaN(type)) {
      currentAura = `${game.i18n.localize("arm5e.generic.current")} : +${Number(
        aura
      )} ${game.i18n.localize(CONFIG.ARM5E.realms[CONFIG.ARM5E.lookupRealm[type]].label)}`;
    }

    let dialogData = {
      fieldName: "arm5e.sheet.aura",
      placeholder: "0",
      value: "",
      current: currentAura,
      realms: CONFIG.ARM5E.realms
    };
    const html = await renderTemplate("systems/arm5e/templates/generic/auraInput.html", dialogData);
    new Dialog(
      {
        title: game.i18n.localize("arm5e.sheet.aura"),
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.sheet.action.apply")
          }
        },
        default: "yes",
        close: async html => {
          let val = html.find('input[name="inputField"]');

          if (val.val() !== "") {
            const aura = val.val();
            const type = html.find(".aura-type")[0].value;
            await setAuraValueForAllTokensInScene(aura, type);
          }
        }
      },
      {
        jQuery: true,
        height: "140px",
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
  }

  static async openAstrolab() {
    let formData = {
      seasons: CONFIG.ARM5E.seasons,
      ...game.settings.get("arm5e", "currentDate")
    };
    // const html = await renderTemplate("systems/arm5e/templates/generic/astrolab.html", dialogData);

    const astrolab = new Astrolab(formData, {}); // data, options
    const res = await astrolab.render(true);
  }
  static async openScriptorium() {
    let formData = {
      seasons: CONFIG.ARM5E.seasons,
      abilityKeysList: CONFIG.ARM5E.LOCALIZED_ABILITIES,
      arts: CONFIG.ARM5E.magic.arts,
      techs: CONFIG.ARM5E.magic.techniques,
      forms: CONFIG.ARM5E.magic.forms,
      bookTopics: CONFIG.ARM5E.books.categories,
      bookTypes: CONFIG.ARM5E.books.types,
      ...game.settings.get("arm5e", "currentDate"),
      reading: {
        reader: { id: null },
        book: {
          id: null,
          title: game.i18n.localize("arm5e.activity.book.title"),
          language: game.i18n.localize("arm5e.skill.commonCases.latin"),
          author: game.i18n.localize("arm5e.generic.unknown"),
          topics: [
            {
              category: "ability",
              type: "Summa",
              author: game.i18n.localize("arm5e.generic.unknown"),
              quality: 1,
              level: 1,
              key: "",
              option: "",
              spellName: "",
              art: "",
              spellTech: "cr",
              spellForm: "an"
            }
          ],
          topicIndex: 0
        }
      }
    };
    // // const html = await renderTemplate("systems/arm5e/templates/generic/astrolab.html", dialogData);
    const scriptorium = new Scriptorium(formData, {}); // data, options
    const res = await scriptorium.render(true);
  }

  static async clearAura() {
    game.scenes.viewed.unsetFlag("world", "aura_" + game.scenes.viewed._id);
    game.scenes.viewed.unsetFlag("world", "aura_type_" + game.scenes.viewed._id);
    const tokens = canvas.tokens.placeables.filter(token => token.actor);
    for (const token of tokens) {
      clearAuraFromActor(token.actor);
    }
  }
}

export function addArsButtons(buttons) {
  buttons.push({
    name: "ArsMagica",
    title: "ArsMagica",
    layer: "arsmagica",
    icon: "icon-Tool_Ars",
    visible: true,
    tools: [
      {
        name: "aura",
        title: game.i18n.localize("arm5e.canvas.buttons.setAura"),
        icon: "icon-Tool_Auras",
        visible: game.user.isGM,
        button: true,
        onClick: () => ArsLayer.selectAura()
      },
      {
        name: "clearAura",
        title: game.i18n.localize("arm5e.canvas.buttons.clearAura"),
        icon: "icon-Tool_Delete_Perdo2",
        visible: game.user.isGM,
        button: true,
        onClick: () => ArsLayer.clearAura()
      },
      {
        name: "astrolab",
        title: "Astrolabium",
        icon: "icon-Tool_Astrolab",
        visible: game.user.isGM,
        button: true,
        onClick: () => ArsLayer.openAstrolab()
      },
      {
        name: "scriptorium",
        title: "Scriptorium",
        icon: "icon-Tool_Scriptorium",
        visible: true,
        button: true,
        onClick: () => ArsLayer.openScriptorium()
      }
    ],
    activeTool: "aura"
  });
}

export function onDropOnCanvas(canvas, data) {
  if (!canvas.scene.active) {
    return;
  }
  const aura = game.scenes.viewed.getFlag("world", "aura_" + game.scenes.viewed._id);
  const type = game.scenes.viewed.getFlag("world", "aura_type_" + game.scenes.viewed._id);
  const actor = game.actors.get(data.id);
  if (actor) {
    if (aura !== undefined && !Number.isNaN(aura) && type !== undefined && !Number.isNaN(type)) {
      addActiveEffectAuraToActor(actor, Number(aura), Number(type));
    } else {
      // no aura
      // => reset aura for actor, if it was in another scene.
      clearAuraFromActor(actor);
    }
  }
}
