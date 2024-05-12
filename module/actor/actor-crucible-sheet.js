import { ArM5eActorSheet } from "./actor-sheet.js";

import { log } from "../tools.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ArM5eActorSheet}
 */
export class ArM5eCrucibleSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-crucible-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "receptacle"
        }
      ]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    // no need to import everything
    context.config = {};
    context.config.magic = CONFIG.ARM5E.magic;
    context.config.lab = CONFIG.ARM5E.lab;
    context.config.seasons = CONFIG.ARM5E.seasons;
    // log(false, "Crucible-sheet getData");
    // log(false, context);

    if (context.system.receptacle == null) {
      context.system.state = 0; // empty
    } else {
      const receptacleData = context.system.receptacle.data;

      if (this.actor.system.enchantments.length) {
        const enchantData = this.actor.system.enchantments[0].data;
        if (receptacleData.system.maxLevel < enchantData.system.level) {
          context.system.labInfo = game.i18n.localize(
            "arm5e.notification.crucible.no.invest.possible"
          );
        } else {
          let neededLevel;
          if (receptacleData.system.charged === false) {
            neededLevel = enchantData.system.level * 2;
          } else {
            // for 1 charge, exceeding by one is enough
            if (receptacleData.system.charges === 1) {
              neededLevel = enchantData.system.level + 1;
            } else {
              neededLevel = enchantData.system.level + receptacleData.system.charges * 5;
            }
          }

          context.system.labInfo =
            game.i18n.localize("arm5e.notification.crucible.labTotal.needed") + ": " + neededLevel;
        }
        if (receptacleData.system.status === 0) {
          context.system.state = 2; // prepared
        } else {
          context.system.state = 3; // invested
        }
      } else {
        context.system.state = 1; // inert
      }
    }
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    // html.find('.item-create').click(this._onItemCreate.bind(this));

    html.find(".reset").click((ev) => {
      const ids = this.actor.items.keys();
      this.actor.deleteEmbeddedDocuments("Item", Array.from(ids), {
        render: false
      });
      // this below is supposed to be working without providing ids...
      // this.actor.deleteEmbeddedDocuments("Item", {}, {
      //     deleteAll: true
      // });
      this.actor.update({
        system: {
          magicItemName: ""
        }
      });
    });

    html.find(".invest").click((ev) => {
      const receptacleData = this.actor.system.receptacle.data;
      const enchantData = this.actor.system.enchantments[0].data;
      if (receptacleData.system.maxLevel < enchantData.system.level) {
        ui.notifications.warn(game.i18n.localize("arm5e.notification.crucible.no.invest.possible"));
      }
      // copy enchantment fields
      let updateData = [
        {
          _id: receptacleData._id,
          system: foundry.utils.deepClone(enchantData.data)
        }
      ];
      // patch some additional fields
      updateData[0].name = this.actor.system.magicItemName;
      updateData[0].system.enchantmentName = enchantData.name;
      updateData[0].system.status = 1;
      updateData[0].system.description = this.actor.system.description;
      this.actor.updateEmbeddedDocuments("Item", updateData, {});
      log(false, "Investing");
    });

    html.find(".update").click((ev) => {
      const receptacleData = this.actor.system.receptacle.data;
      const enchantData = this.actor.system.enchantments[0].data;
      if (receptacleData.system.maxLevel < enchantData.system.level) {
        ui.notifications.warn(game.i18n.localize("arm5e.notification.crucible.no.invest.possible"));
      }
      // copy enchantment fields
      let updateData = [
        {
          _id: receptacleData._id,
          system: foundry.utils.deepClone(enchantData.data)
        }
      ];
      // patch some additional fields
      updateData[0].name = this.actor.system.magicItemName;
      updateData[0].system.enchantmentName = enchantData.name;
      updateData[0].system.status = 1;
      updateData[0].system.description = this.actor.system.description;
      this.actor.updateEmbeddedDocuments("Item", updateData, {});
      log(false, "Update enchantment");
    });

    // html.find('.GMonly').click(this._restrict.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "enchantment":
      case "item":
        // case "weapon":
        // case "armor":
        // case "laboratoryText":
        return true;
      default:
        return false;
    }
  }

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */
  // TODO review for V10
  async _onDropItem(event, data) {
    let itemData = {};
    let type;
    if (data.pack) {
      const item = await Item.implementation.fromDropData(data);
      itemData = item.toObject();
      type = itemData.type;
    } else if (data.actorId === undefined) {
      const item = await Item.implementation.fromDropData(data);
      itemData = item.toObject();
      type = itemData.type;
    } else {
      type = data.data.type;
      itemData = data.data;
    }
    // transform item into magicItem
    let updateDesc = {};
    if (type == "item") {
      // TODO or weapon or armor
      log(false, "Valid drop");
      if (this.actor.system.receptacle != null) {
        let updateData = [
          {
            _id: this.actor.system.receptacle.id,
            name: itemData.name,
            type: "magicItem",
            img: itemData.img,
            system: foundry.utils.deepClone(itemData.data)
          }
        ];
        updateDesc["system.magicItemName"] = this.actor.system.receptacle.name;
        await this.actor.update(updateDesc, {
          render: false
        });

        return await this.actor.updateEmbeddedDocuments("Item", updateData, {});
      } else {
        updateDesc["system.magicItemName"] = itemData.name;
        await this.actor.update(updateDesc);
      }
    } else if (type == "enchantment") {
      // if there is no item yet, reject
      if (this.actor.system.receptacle === null) {
        return [];
      }
      if (this.actor.system.enchantments.length > 0) {
        // update status of item too
        let updateData = [
          {
            _id: this.actor.system.receptacle.id,
            system: {
              status: 0
            }
          },
          {
            _id: this.actor.system.enchantments[0].id,
            name: itemData.name,
            img: itemData.img,
            system: foundry.utils.deepClone(itemData.system)
          }
        ];
        updateDesc["system.description"] =
          "<p>" +
          this.actor.system.receptacle.system.description +
          "</p><p><b>Enchantment:</b></p><p>" +
          this.actor.system.enchantments[0].system.description +
          "</p>";
        await this.actor.update(updateDesc, {
          render: false
        });
        return await this.actor.updateEmbeddedDocuments("Item", updateData, {});
        // patch the receptable with information from enchantment
      } else {
        // update status of item
        let updateData = [
          {
            _id: this.actor.system.receptacle.id,
            system: {
              status: 0
            }
          }
        ];
        await this.actor.updateEmbeddedDocuments("Item", updateData, {
          render: false
        });
      }
    } else if (type == "magicItem") {
      // update an existing magic item
      // reset everything
      const ids = this.actor.items.keys();
      await this.actor.deleteEmbeddedDocuments("Item", Array.from(ids), {
        render: false
      });

      // create the document with the same Id
      // let enchantData = {
      //     name: itemData.name,
      //     type: "enchantment",
      //     system: {
      //         effectfrequency: itemData.system.effectfrequency,
      //         penetration: itemData.system.penetration,
      //         maintainConc: itemData.system.maintainConc,
      //         environmentalTrigger: itemData.system.environmentalTrigger,
      //         restrictedUse: itemData.system.restrictedUse,
      //         linkedTrigger: itemData.system.linkedTrigger
      //     }
      // };
      let enchantData = {
        name: itemData.system.enchantmentName,
        type: "enchantment",
        system: foundry.utils.deepClone(itemData.data)
      };
      // remove item specific fields:
      delete enchantData.system.enchantmentName;
      delete enchantData.system.charged;
      delete enchantData.system.charges;
      delete enchantData.system.materialBase;
      delete enchantData.system.sizeMultiplier;
      delete enchantData.system.material;
      delete enchantData.system.materialBonus;
      delete enchantData.system.shape;
      delete enchantData.system.shapeBonus;
      delete enchantData.system.expiry;
      itemData = [itemData];
      itemData.push(enchantData);
      await this.actor.createEmbeddedDocuments("Item", itemData, {
        keepId: true,
        render: false
      });
      let actorUpdate = {
        system: {
          magicItemName: itemData[0].name,
          description: itemData[0].system.description
        }
      };
      return await this.actor.update(actorUpdate);
    }

    // }
    const res = await super._onDropItem(event, data);
    return res;
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData     The item data requested for creation
   * @return {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];

    // change item, (TODO weapon, armor)
    if (itemData[0].type === "item") {
      itemData[0].type = "magicItem";
    }

    return super._onDropItemCreate(itemData);
  }
}
