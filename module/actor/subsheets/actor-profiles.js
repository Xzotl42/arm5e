import { ARM5E } from "../../config.js";
import { getDataset, log } from "../../tools.js";
import { getAbilityFromCompendium, getItemFromCompendium } from "../../tools/compendia.js";

export class ArM5eActorProfiles {
  constructor(actor) {
    this.actor = actor;
  }
  async getData(context) {
    return context;
  }

  async addProfile(event) {
    const dataset = getDataset(event);
    const config = ARM5E.ActorProfiles[dataset.key];

    let itemsCreate = [];
    let itemsUpdate = [];
    if (config.abilities) {
      for (let ab of config.abilities) {
        let ability = this.actor.getAbility(ab.key, ab.option);
        if (ability) {
          if (ab.inc && event.shiftKey) {
            itemsUpdate.push({ _id: ability._id, "system.xp": ability.system.xp + ab.inc });
          }
        } else {
          ability = await getAbilityFromCompendium(ab.key, ab.option);
          if (ability == null) {
            console.error("Wrong actor config");
            return;
          }
          if (ab.xp) {
            ability.system.xp = ab.xp;
          }
          itemsCreate.push(ability);
        }
      }
    }
    if (config.virtues) {
      for (let v of config.virtues) {
        if (this.actor.hasVirtue(v.index)) {
          continue;
        }
        let virtue = await getItemFromCompendium("virtues", v.index);
        if (virtue == null) {
          console.error("Wrong actor config");
          return;
        }
        itemsCreate.push(virtue.toObject());
      }
    }

    if (config.flaws) {
      for (let f of config.flaws) {
        if (this.actor.hasFlaw(f.index)) {
          continue;
        }
        let flaw = await getItemFromCompendium("flaws", f.index);
        if (flaw == null) {
          console.error("Wrong actor config");
          return;
        }
        itemsCreate.push(flaw.toObject());
      }
    }
    let actorUpdate = {};
    if (config.arts) {
      for (let a of config.arts) {
        if (!this.actor.isMagus()) {
          continue;
        }
        if (a.inc) {
          if (Object.keys(ARM5E.magic.techniques).includes(a.key)) {
            actorUpdate[`system.arts.techniques.${a.key}.xp`] =
              this.actor.system.arts.techniques[a.key].xp + a.inc;
          } else if (Object.keys(ARM5E.magic.forms).includes(a.key)) {
            actorUpdate[`system.arts.forms.${a.key}.xp`] =
              this.actor.system.arts.forms[a.key].xp + a.inc;
          }
        }
      }
    }
    // TODO: one update
    await this.actor.createEmbeddedDocuments("Item", itemsCreate); //, { temporary: true });
    await this.actor.updateEmbeddedDocuments("Item", itemsUpdate, {});
    await this.actor.update(actorUpdate);
  }
}
