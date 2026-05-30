import { BaseEffectSchema, MagicalEffectSchema, SpellSchema } from "./magicSchemas.js";
import { AbilitySchema } from "./abilitySchema.js";
import { BookSchema } from "./bookSchema.js";
import { DiaryEntrySchema } from "./diarySchema.js";
import {
  ItemSchema,
  PersonalityTraitSchema,
  QualityInferioritySchema,
  ReputationSchema,
  SanctumSchema,
  VirtueFlawSchema
} from "./minorItemsSchemas.js";
import { LabSchema } from "./labSchema.js";
import { ArmorSchema, WeaponSchema } from "./weaponArmorSchema.js";
import { CodexSchema } from "./actorCommonSchema.js";
import { VisSchema, VisSourceSchema } from "./visSchema.js";
import { InhabitantSchema } from "./inhabitantSchema.js";
import { WoundSchema } from "./woundSchema.js";
import { EnchantmentEffectSchema } from "./enchantmentSchema.js";
import { CovenantSchema } from "./covenantSchema.js";
import { SupernaturalEffectSchema } from "./supernaturalEffectSchema.js";
import { PowerSchema } from "./powerSchemas.js";
import { BasicChatSchema } from "./basicChatSchema.js";
import { LabTextSchema } from "./labTextSchema.js";
import { RollChatSchema } from "./rollChatSchema.js";
import {
  CombatAttackChatSchema,
  CombatChatSchema,
  CombatDamageChatSchema,
  CombatDefenseChatSchema,
  CombatSoakChatSchema
} from "./combatChatSchema.js";
import { MagicChatSchema } from "./magicChatSchema.js";
import { DamageChatSchema } from "./damageChatSchema.js";

export const ITEM_DATAMODEL_REGISTRATIONS = {
  ability: AbilitySchema,
  virtue: VirtueFlawSchema,
  flaw: VirtueFlawSchema,
  quality: QualityInferioritySchema,
  inferiority: QualityInferioritySchema,
  item: ItemSchema,
  vis: VisSchema,
  visSourcesCovenant: VisSourceSchema,
  baseEffect: BaseEffectSchema,
  magicalEffect: MagicalEffectSchema,
  spell: SpellSchema,
  laboratoryText: LabTextSchema,
  personalityTrait: PersonalityTraitSchema,
  reputation: ReputationSchema,
  armor: ArmorSchema,
  weapon: WeaponSchema,
  inhabitant: InhabitantSchema,
  wound: WoundSchema,
  labCovenant: SanctumSchema,
  enchantment: EnchantmentEffectSchema,
  book: BookSchema,
  diaryEntry: DiaryEntrySchema,
  supernaturalEffect: SupernaturalEffectSchema,
  power: PowerSchema
};

export const ACTOR_DATAMODEL_REGISTRATIONS = {
  laboratory: LabSchema,
  magicCodex: CodexSchema,
  covenant: CovenantSchema
};

export const CHAT_DATAMODEL_REGISTRATIONS = {
  standard: BasicChatSchema,
  roll: RollChatSchema,
  init: CombatChatSchema,
  combat: CombatChatSchema,
  combatAttack: CombatAttackChatSchema,
  combatDefense: CombatDefenseChatSchema,
  combatDamage: CombatDamageChatSchema,
  combatSoak: CombatSoakChatSchema,
  magic: MagicChatSchema,
  damage: DamageChatSchema
};

export const DEPRECATED_ITEM_DATAMODEL_ALIASES = {
  visStockCovenant: VisSchema
};
