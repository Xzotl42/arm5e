import { convertToNumber } from "../tools.js";
import { actorBase } from "./actorCommonSchema.js";
import {
  actorLink,
  basicIntegerField,
  basicTextField,
  newComputedField,
  SeasonField
} from "./commonSchemas.js";

const fields = foundry.data.fields;

const BuildPointsField = () =>
  new fields.SchemaField({
    value: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    notes: basicTextField()
  });

const ExpenseField = () =>
  new fields.SchemaField({
    amount: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    notes: basicTextField()
  });

const SavingField = () =>
  new fields.SchemaField({
    quantity: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    amount: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    notes: basicTextField()
  });

export class CovenantSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...actorBase(),
      aegisCovenant: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      aegisPenetration: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      season: SeasonField("spring"),
      foundationYear: new fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1200,
        step: 1
      }),
      levelsRegio: basicIntegerField(),
      aegisCovenant: basicIntegerField(),
      modifiersLife: new fields.SchemaField({
        magi: basicIntegerField(1),
        mundane: basicIntegerField(0, -10)
      }),
      scene: new fields.SchemaField({
        value: new fields.StringField({ required: false, blank: true, initial: "" }),
        id: new fields.StringField({
          nullable: true,
          required: false,
          blank: true,
          initial: null
        }),
        linked: new fields.BooleanField({ required: false, initial: false })
      }),
      tribunal: basicTextField(),
      narrator: basicTextField(),
      saga: basicTextField(),
      sagaType: basicTextField(),
      governForm: basicTextField(),
      // DEPRECATED
      constructionPoints: new fields.ObjectField({
        nullable: true,
        required: false,
        initial: null
      }),
      buildPoints: new fields.SchemaField(
        {
          library: BuildPointsField(),
          laboratoryTexts: BuildPointsField(),
          vis: BuildPointsField(),
          magicItems: BuildPointsField(),
          specialists: BuildPointsField(),
          laboratories: BuildPointsField(),
          money: BuildPointsField()
        },
        {
          initial: {
            library: { value: 0, notes: "" },
            laboratoryTexts: { value: 0, notes: "" },
            vis: { value: 0, notes: "" },
            magicItems: { value: 0, notes: "" },
            specialists: { value: 0, notes: "" },
            laboratories: { value: 0, notes: "" },
            money: { value: 0, notes: "" }
          }
        }
      ),
      // DEPRECATED
      habitants: new fields.ObjectField({
        nullable: true,
        required: false,
        initial: null
      }),
      npcInhabitants: basicIntegerField(),
      loyalty: new fields.SchemaField({
        points: new fields.SchemaField({
          modifier: basicIntegerField(),
          prevailing: basicIntegerField()
        }),
        modifiers: new fields.SchemaField({
          equipment: new fields.StringField({ required: false, blank: false, initial: "standard" }),
          wages: new fields.StringField({ required: false, blank: false, initial: "normal" }),
          familiarity: basicIntegerField(),
          events: basicIntegerField(0)
        })
      }),
      // DEPRECATED
      loyaltyPoints: new fields.ObjectField({
        nullable: true,
        required: false,
        initial: null
      }),
      // DEPRECATED
      loyaltyModifiers: new fields.ObjectField({
        nullable: true,
        required: false,
        initial: null
      }),
      yearlyExpenses: new fields.SchemaField({
        buildings: ExpenseField(),
        consumables: ExpenseField(),
        laboratories: ExpenseField(),
        provisions: ExpenseField(),
        wages: ExpenseField(),
        weapons: ExpenseField(),
        writingMaterials: ExpenseField(),
        tithes: ExpenseField(),
        inflation: ExpenseField(),
        sundry: ExpenseField()
      }),
      // DEPRECATED
      yearExpenditure: new fields.ObjectField({
        nullable: true,
        required: false,
        initial: null
      }),
      yearlySavings: new fields.SchemaField({
        laborers: SavingField(),
        craftsmen: SavingField(),
        specialists: SavingField(),
        magicItems: SavingField()
      }),
      // DEPRECATED
      costsSavings: new fields.ObjectField({
        nullable: true,
        required: false,
        initial: null
      }),
      finances: new fields.SchemaField({
        wealth: basicIntegerField(),
        totalIncome: basicIntegerField(),
        baseExpenditure: basicIntegerField(),
        costSavings: basicIntegerField(),
        totalExpenditure: basicIntegerField(),
        inhabitantsPoints: basicIntegerField(),
        laboratoriesPoints: basicIntegerField(),
        weaponsPoints: basicIntegerField(),
        averageEquipMaintenance: basicIntegerField(5)
      }),
      // DEPRECATED
      wealth: new fields.ObjectField({
        nullable: true,
        required: false,
        initial: null
      })
    };
  }
  static migrateData(data) {
    return data;
  }

  static migrate(data) {
    let update = {};

    if (data.system.habitants) {
      if (data.system.habitants.npcgrogs) {
        update["system.npcInhabitants"] = data.system.habitants.npcgrogs;
        // update["system.habitants.-=npcgrogs"] = null;
      }
    }

    let descriptionUpdate = "";

    if (typeof data.system.aegisCovenant != "number" || isNaN(data.system.aegisCovenant)) {
      const newValue = convertToNumber(data.system.aegisCovenant, 0);
      descriptionUpdate += `<li>Covenant aegis is now stricly a number, previous value (${data.system.aegisCovenant}) => new value (${newValue})</li>`;
      update["system.aegisCovenant"] = newValue;
    }

    if (data.system.constructionPoints) {
      for (let [k, v] of Object.entries(data.system.constructionPoints.data)) {
        update[`system.buildPoints.${k}`] = { value: v.initials ?? 0, notes: v.notes ?? "" };

        if (v.actuals) {
          descriptionUpdate += newComputedField(`Build points current ${k}`, v.actuals);
        }
      }
      update["system.constructionPoints"] = null;
    }

    if (data.system.yearExpenditure) {
      for (let [k, v] of Object.entries(data.system.yearExpenditure)) {
        if (k === "titles") {
          // fix titles => tithes
          update[`system.yearlyExpenses.tithes.notes`] = v.notes ?? "";
        } else {
          update[`system.yearlyExpenses.${k}.notes`] = v.notes ?? "";
        }

        if (v.expenditure) {
          descriptionUpdate += newComputedField(`Expenditure ${k}`, v.expenditure);
        }
      }
      update["system.yearExpenditure"] = null;
    }

    if (data.system.costsSavings) {
      for (let [k, v] of Object.entries(data.system.costsSavings)) {
        update[`system.yearlySavings.${k}.notes`] = v.notes ?? "";

        if (v.saving) {
          descriptionUpdate += newComputedField(`Cost savings ${k}`, v.saving);
        }
      }
      update["system.costsSavings"] = null;
    }

    if (data.system.loyaltyPoints) {
      update[`system.loyalty.points.base`] = data.system.loyaltyPoints.base ?? 0;
      update[`system.loyalty.points.prevailing`] = data.system.loyaltyPoints.predominant ?? 0;
      if (data.system.loyaltyPoints.base) {
        descriptionUpdate += newComputedField(
          `Loyalty points base`,
          data.system.loyaltyPoints.base
        );
      }
      if (data.system.loyaltyPoints.actuals) {
        descriptionUpdate += newComputedField(
          `Loyalty points actuals`,
          data.system.loyaltyPoints.actuals
        );
      }
      if (data.system.loyaltyPoints.prevailing) {
        descriptionUpdate += newComputedField(
          `Loyalty points prevailing `,
          data.system.loyaltyPoints.prevailing
        );
      }

      update["system.loyaltyPoints"] = null;
    }

    if (data.system.loyaltyModifiers) {
      update[`system.loyalty.modifiers.livingConditions`] =
        data.system.loyaltyModifiers.livingConditions;
      update[`system.loyalty.modifiers.equipment`] = data.system.loyaltyModifiers.equipment ?? 0;
      update[`system.loyalty.modifiers.money`] = data.system.loyaltyModifiers.money ?? 0;
      update[`system.loyalty.modifiers.specialists`] =
        data.system.loyaltyModifiers.specialists ?? 0;
      if (data.system.loyaltyModifiers.livingConditions) {
        descriptionUpdate += newComputedField(
          `Loyalty modifiers livingConditions`,
          data.system.loyaltyModifiers.livingConditions
        );
      }
      if (data.system.loyaltyModifiers.equipment) {
        descriptionUpdate += newComputedField(
          `Loyalty modifiers equipment`,
          data.system.loyaltyModifiers.equipment
        );
      }
      if (data.system.loyaltyModifiers.money) {
        descriptionUpdate += newComputedField(
          `Loyalty modifiers money`,
          data.system.loyaltyModifiers.money
        );
      }
      if (data.system.loyaltyModifiers.specialists) {
        descriptionUpdate += newComputedField(
          `Loyalty modifiers specialists`,
          data.system.loyaltyModifiers.specialists
        );
      }

      update["system.loyaltyModifiers"] = null;
    }

    if (data.system.wealth) {
      update["system.finances.totalIncome"] = data.system.wealth.totalIncome ?? 0;
      descriptionUpdate += newComputedField(`Wealth totalIncome`, data.system.wealth.totalIncome);

      update["system.finances.baseExpenditure"] = data.system.wealth.baseExpenditure ?? 0;
      descriptionUpdate += newComputedField(
        `Wealth baseExpenditure`,
        data.system.wealth.baseExpenditure
      );

      update["system.finances.costSavings"] = data.system.wealth.costSavings ?? 0;
      descriptionUpdate += newComputedField(`Wealth costSavings`, data.system.wealth.costSavings);

      update["system.finances.totalExpenditure"] = data.system.wealth.totalExpenditure ?? 0;
      descriptionUpdate += newComputedField(
        `Wealth totalExpenditure`,
        data.system.wealth.totalExpenditure
      );

      update["system.finances.inhabitantsPoints"] = data.system.wealth.inhabitantsPoints ?? 0;
      descriptionUpdate += newComputedField(
        `Wealth inhabitantsPoints`,
        data.system.wealth.inhabitantsPoints
      );

      update["system.finances.laboratoriesPoints"] = data.system.wealth.laboratoriesPoints ?? 0;
      descriptionUpdate += newComputedField(
        `Wealth laboratoriesPoints`,
        data.system.wealth.laboratoriesPoints
      );

      update["system.finances.weaponsPoints"] = data.system.wealth.weaponsPoints ?? 0;
      descriptionUpdate += newComputedField(
        `Wealth weaponsPoints`,
        data.system.wealth.weaponsPoints
      );

      update["system.wealth"] = null;
    }

    if (descriptionUpdate !== "") {
      descriptionUpdate =
        "<h2>Migration comments</h2> The following fields are now computed and readonly. The original value is listed below" +
        "<ol>" +
        descriptionUpdate +
        "</ol>";
      update["system.description"] = data.system.description + "<br/>" + descriptionUpdate;
    }

    return update;
  }
}
