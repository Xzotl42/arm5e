import { actorBase } from "./actorCommonSchema";
import { basicIntegerField } from "./commonSchemas";

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

const ExpenditureField = () =>
  new fields.SchemaField({
    expenditure: new fields.NumberField({
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
      season: SeasonField(season),
      foundationYear: new fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: year,
        step: 1
      }),
      levelsRegio: basicIntegerField(),
      aegisCovenant: basicIntegerField(),
      modifiersLife: new fields.SchemaField({
        magi: basicIntegerField(1),
        mundane: basicIntegerField()
      }),
      tribunal: basicTextField(),
      narrator: basicTextField(),
      saga: basicTextField(),
      sagaType: basicTextField(),
      governForm: basicTextField(),
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
      loyaltyPoints: new fields.SchemaField({
        base: basicIntegerField(),
        actuals: basicIntegerField(),
        prevailing: basicIntegerField()
      }),
      loyaltyModifiers: new fields.SchemaField({
        livingConditions: basicIntegerField(),
        equipment: basicIntegerField(),
        specialists: basicIntegerField(),
        money: basicIntegerField()
      }),
      yearlyExpenditure: new fields.SchemaField({
        buildings: ExpenditureField(),
        consumables: ExpenditureField(),
        laboratories: ExpenditureField(),
        provisions: ExpenditureField(),
        titles: ExpenditureField(),
        wages: ExpenditureField(),
        weapons: ExpenditureField(),
        writingMaterials: ExpenditureField(),
        inflation: ExpenditureField()
      })
    };
  }
  static migrateData(data) {
    super.migrateData(data);

    if (data.constructionPoints) {
      for (let [k, v] of Object.defineProperties(constructionPoints.data)) {
        data.buildPoints[k] = { value: v.initials, notes: v.notes };
      }
    }
    return data;
  }

  static migrate(data) {
    return {};
  }
}
