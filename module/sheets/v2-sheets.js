import { ArM5ePCActorSheetV2 } from "./actor/actor-pc-sheet-v2.js";
import { ArM5eBeastActorSheetV2 } from "./actor/actor-beast-sheet-v2.js";
import { ArM5eNPCActorSheetV2 } from "./actor/actor-npc-sheet-v2.js";
import { Arm5eCharacterActorSheetV2 } from "./actor/actor-character-sheet.js";
import { ArM5eLaboratoryActorSheetV2 } from "./actor/actor-laboratory-sheet-v2.js";
import { ArM5eCovenantActorSheetV2 } from "./actor/actor-covenant-sheet-v2.js";
import { ArM5eMagicCodexSheetV2 } from "./actor/actor-magic-codex-sheet-v2.js";

import { ArM5eReputationItemSheetV2 } from "./item/item-reputation-sheet-v2.js";
import { ArM5eIncomeSourceItemSheetV2 } from "./item/item-incomeSource-sheet-v2.js";
import { ArM5ePersonalityTraitItemSheetV2 } from "./item/item-personalityTrait-sheet-v2.js";
import { ArM5ePossessionsCovenantItemSheetV2 } from "./item/item-possessionsCovenant-sheet-v2.js";
import { ArM5eVirtueItemSheetV2 } from "./item/item-virtue-sheet-v2.js";
import { ArM5eFlawItemSheetV2 } from "./item/item-flaw-sheet-v2.js";
import { ArM5eQualityItemSheetV2 } from "./item/item-quality-sheet-v2.js";
import { ArM5eInferiorityItemSheetV2 } from "./item/item-inferiority-sheet-v2.js";
import { ArM5eArtItemSheetV2 } from "./item/item-art-sheet-v2.js";
import { ArM5eAbilityItemSheetV2 } from "./item/item-ability-sheet-v2.js";
import { ArM5eVisSourcesCovenantItemSheetV2 } from "./item/item-visSourcesCovenant-sheet-v2.js";
import { ArM5eWeaponItemSheetV2 } from "./item/item-weapon-sheet-v2.js";
import { ArM5eArmorItemSheetV2 } from "./item/item-armor-sheet-v2.js";
import { ArM5eGenericItemSheetV2 } from "./item/item-generic-item-sheet-v2.js";
import { ArM5eVisItemSheetV2 } from "./item/item-vis-sheet-v2.js";
import { ArM5eWoundItemSheetV2 } from "./item/item-wound-sheet-v2.js";
import { ArM5eInhabitantItemSheetV2 } from "./item/item-inhabitant-sheet-v2.js";
import { ArM5eLaboratoryTextItemSheetV2 } from "./item/item-laboratoryText-sheet-v2.js";
import { ArM5eSpellItemSheetV2 } from "./item/item-spell-sheet-v2.js";
import { ArM5eMagicalEffectItemSheetV2 } from "./item/item-magicalEffect-sheet-v2.js";
import { ArM5eBaseEffectItemSheetV2 } from "./item/item-baseEffect-sheet-v2.js";
import { ArM5ePowerItemSheetV2 } from "./item/item-power-sheet-v2.js";
import { ArM5eEnchantmentItemSheetV2 } from "./item/item-enchantment-sheet-v2.js";
import { ArM5eSupernaturalEffectItemSheetV2 } from "./item/item-supernaturalEffect-sheet-v2.js";
import { ArM5eBookItemSheetV2 } from "./item/item-book-sheet-v2.js";
import { ArM5eDiaryEntryItemSheetV2 } from "./item/item-diaryEntry-sheet-v2.js";
import { ArM5eCalendarCovenantItemSheetV2 } from "./item/item-calendarCovenant-sheet-v2.js";
import { ArM5eLabCovenantItemSheetV2 } from "./item/item-labCovenant-sheet-v2.js";
import { ArM5eAbilityFamiliarItemSheetV2 } from "./item/item-abilityFamiliar-sheet-v2.js";
import { ArM5ePowerFamiliarItemSheetV2 } from "./item/item-powerFamiliar-sheet-v2.js";

export {
  ArM5ePCActorSheetV2,
  ArM5eBeastActorSheetV2,
  ArM5eNPCActorSheetV2,
  Arm5eCharacterActorSheetV2,
  ArM5eLaboratoryActorSheetV2,
  ArM5eCovenantActorSheetV2,
  ArM5eMagicCodexSheetV2,
  ArM5eReputationItemSheetV2,
  ArM5eIncomeSourceItemSheetV2,
  ArM5ePersonalityTraitItemSheetV2,
  ArM5ePossessionsCovenantItemSheetV2,
  ArM5eVirtueItemSheetV2,
  ArM5eFlawItemSheetV2,
  ArM5eQualityItemSheetV2,
  ArM5eInferiorityItemSheetV2,
  ArM5eArtItemSheetV2,
  ArM5eAbilityItemSheetV2,
  ArM5eVisSourcesCovenantItemSheetV2,
  ArM5eWeaponItemSheetV2,
  ArM5eArmorItemSheetV2,
  ArM5eGenericItemSheetV2,
  ArM5eVisItemSheetV2,
  ArM5eWoundItemSheetV2,
  ArM5eInhabitantItemSheetV2,
  ArM5eLaboratoryTextItemSheetV2,
  ArM5eSpellItemSheetV2,
  ArM5eMagicalEffectItemSheetV2,
  ArM5eBaseEffectItemSheetV2,
  ArM5ePowerItemSheetV2,
  ArM5eEnchantmentItemSheetV2,
  ArM5eSupernaturalEffectItemSheetV2,
  ArM5eBookItemSheetV2,
  ArM5eDiaryEntryItemSheetV2,
  ArM5eCalendarCovenantItemSheetV2,
  ArM5eLabCovenantItemSheetV2,
  ArM5eAbilityFamiliarItemSheetV2,
  ArM5ePowerFamiliarItemSheetV2
};

export const ACTOR_SHEET_REGISTRATIONS_V2 = [
  {
    id: "arm5ePC",
    sheetClass: ArM5ePCActorSheetV2,
    options: { types: ["player"], makeDefault: true, label: "arm5e.sheet.player" }
  },
  {
    id: "arm5eNPC",
    sheetClass: ArM5eNPCActorSheetV2,
    options: { types: ["npc"], makeDefault: true, label: "arm5e.sheet.npc" }
  },
  {
    id: "arm5eBeast",
    sheetClass: ArM5eBeastActorSheetV2,
    options: { types: ["beast"], makeDefault: true, label: "arm5e.sheet.beast" }
  },
  {
    id: "arm5eCharacter",
    sheetClass: Arm5eCharacterActorSheetV2,
    options: { types: ["character"], makeDefault: true, label: "arm5e.sheet.character" }
  },
  {
    id: "arm5eLaboratory",
    sheetClass: ArM5eLaboratoryActorSheetV2,
    options: { types: ["laboratory"], makeDefault: true, label: "arm5e.sheet.laboratory" }
  },
  {
    id: "arm5eCovenant",
    sheetClass: ArM5eCovenantActorSheetV2,
    options: { types: ["covenant"], makeDefault: true, label: "arm5e.sheet.covenant" }
  },
  {
    id: "arm5eMagicCodex",
    sheetClass: ArM5eMagicCodexSheetV2,
    options: { types: ["magicCodex"], makeDefault: true, label: "arm5e.sheet.magic-codex" }
  }
];

export const ITEM_SHEET_REGISTRATIONS_V2 = [
  { sheetClass: ArM5eWoundItemSheetV2, options: { types: ["wound"], makeDefault: true } },
  {
    sheetClass: ArM5eAbilityFamiliarItemSheetV2,
    options: { types: ["abilityFamiliar"], makeDefault: true }
  },
  {
    sheetClass: ArM5ePowerFamiliarItemSheetV2,
    options: { types: ["powerFamiliar"], makeDefault: true }
  },
  {
    sheetClass: ArM5eCalendarCovenantItemSheetV2,
    options: { types: ["calendarCovenant"], makeDefault: true }
  },
  {
    sheetClass: ArM5eLabCovenantItemSheetV2,
    options: { types: ["labCovenant"], makeDefault: true }
  },
  { sheetClass: ArM5eReputationItemSheetV2, options: { types: ["reputation"], makeDefault: true } },
  {
    sheetClass: ArM5eIncomeSourceItemSheetV2,
    options: { types: ["incomingSource"], makeDefault: true }
  },
  {
    sheetClass: ArM5ePersonalityTraitItemSheetV2,
    options: { types: ["personalityTrait"], makeDefault: true }
  },
  {
    sheetClass: ArM5ePossessionsCovenantItemSheetV2,
    options: { types: ["possessionsCovenant"], makeDefault: true }
  },
  { sheetClass: ArM5eVirtueItemSheetV2, options: { types: ["virtue"], makeDefault: true } },
  { sheetClass: ArM5eFlawItemSheetV2, options: { types: ["flaw"], makeDefault: true } },
  { sheetClass: ArM5eQualityItemSheetV2, options: { types: ["quality"], makeDefault: true } },
  {
    sheetClass: ArM5eInferiorityItemSheetV2,
    options: { types: ["inferiority"], makeDefault: true }
  },
  { sheetClass: ArM5eArtItemSheetV2, options: { types: ["art"], makeDefault: true } },
  { sheetClass: ArM5eAbilityItemSheetV2, options: { types: ["ability"], makeDefault: true } },
  {
    sheetClass: ArM5eVisSourcesCovenantItemSheetV2,
    options: { types: ["visSourcesCovenant"], makeDefault: true }
  },
  { sheetClass: ArM5eWeaponItemSheetV2, options: { types: ["weapon"], makeDefault: true } },
  { sheetClass: ArM5eArmorItemSheetV2, options: { types: ["armor"], makeDefault: true } },
  { sheetClass: ArM5eGenericItemSheetV2, options: { types: ["item"], makeDefault: true } },
  { sheetClass: ArM5eVisItemSheetV2, options: { types: ["vis"], makeDefault: true } },
  { sheetClass: ArM5eBookItemSheetV2, options: { types: ["book"], makeDefault: true } },
  { sheetClass: ArM5eDiaryEntryItemSheetV2, options: { types: ["diaryEntry"], makeDefault: true } },
  { sheetClass: ArM5eInhabitantItemSheetV2, options: { types: ["inhabitant"], makeDefault: true } },
  {
    sheetClass: ArM5eLaboratoryTextItemSheetV2,
    options: { types: ["laboratoryText"], makeDefault: true }
  },
  { sheetClass: ArM5eSpellItemSheetV2, options: { types: ["spell"], makeDefault: true } },
  {
    sheetClass: ArM5eMagicalEffectItemSheetV2,
    options: { types: ["magicalEffect"], makeDefault: true }
  },
  { sheetClass: ArM5eBaseEffectItemSheetV2, options: { types: ["baseEffect"], makeDefault: true } },
  { sheetClass: ArM5ePowerItemSheetV2, options: { types: ["power"], makeDefault: true } },
  {
    sheetClass: ArM5eEnchantmentItemSheetV2,
    options: { types: ["enchantment"], makeDefault: true }
  },
  {
    sheetClass: ArM5eSupernaturalEffectItemSheetV2,
    options: { types: ["supernaturalEffect"], makeDefault: true }
  }
];
