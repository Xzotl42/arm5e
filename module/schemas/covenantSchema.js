import ArM5eActiveEffect from "../helpers/active-effects.js";
import { canBeEnchanted } from "../helpers/magic.js";
import { compareLabTexts, compareTopics, convertToNumber, slugify } from "../tools.js";
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

export class CovenantSchema extends foundry.abstract.TypeDataModel {
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
      levelsRegio: basicIntegerField(), // DEPRECATED
      // aegisCovenant: basicIntegerField(),
      modifiersLife: new fields.SchemaField({
        magi: basicIntegerField(1),
        mundane: basicIntegerField(0)
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
      npcInhabitants: basicIntegerField(0, 0),
      loyalty: new fields.SchemaField({
        points: new fields.SchemaField({
          modifier: basicIntegerField(),
          prevailing: basicIntegerField()
        }),
        modifiers: new fields.SchemaField({
          equipment: new fields.StringField({ required: false, blank: false, initial: "standard" }),
          wages: new fields.StringField({ required: false, blank: false, initial: "normal" }),
          familiarity: basicIntegerField(0),
          events: basicIntegerField(0, -9999)
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
        totalIncome: basicIntegerField(0, 0),
        baseExpenditure: basicIntegerField(0, 0),
        costSavings: basicIntegerField(0, 0),
        totalExpenditure: basicIntegerField(0, 0),
        inhabitantsPoints: basicIntegerField(0, 0),
        laboratoriesPoints: basicIntegerField(0, 0),
        weaponsPoints: basicIntegerField(0, 0),
        averageEquipMaintenance: basicIntegerField(5, 0)
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

    if (typeof data.system.levelsRegio != "number" || isNaN(data.system.levelsRegio)) {
      const newValue = convertToNumber(data.system.levelsRegio, 0);
      descriptionUpdate += `<li>Covenant regio levels is now stricly a number, previous value (${data.system.levelsRegio}) => new value (${newValue})</li>`;
      update["system.levelsRegio"] = newValue;
    }

    if (data.system.constructionPoints) {
      for (let [k, v] of Object.entries(data.system.constructionPoints.data)) {
        update[`system.buildPoints.${k}`] = { value: v.initials ?? 0, notes: v.notes ?? "" };

        if (v.actuals) {
          descriptionUpdate += newComputedField(`Build points current ${k}`, v.actuals);
        }
      }
      update["system.-constructionPoints"] = null;
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
      update["system.-yearExpenditure"] = null;
    }

    if (data.system.costsSavings) {
      for (let [k, v] of Object.entries(data.system.costsSavings)) {
        update[`system.yearlySavings.${k}.notes`] = v.notes ?? "";

        if (v.saving) {
          descriptionUpdate += newComputedField(`Cost savings ${k}`, v.saving);
        }
      }
      update["system.-costsSavings"] = null;
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

      update["system.-loyaltyPoints"] = null;
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

      update["system.-loyaltyModifiers"] = null;
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

      update["system.-wealth"] = null;
    }

    if (data.buildPoints?.labText) {
      update["system.buildPoints.-labText"] = null;
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

  // DATA PREPARATION

  prepareBaseData() {
    this.buildPoints.laboratoryTexts.computed = 0;
    this.buildPoints.library.computed = 0;
    this.buildPoints.vis.computed = 0;
    this.buildPoints.magicItems.computed = 0;
    this.buildPoints.laboratories.computed = 0;
    this.buildPoints.money.computed = 0;
    this.buildPoints.specialists.computed = 0;

    this.yearlyExpenses.buildings.magicMod = 0;
    this.yearlyExpenses.consumables.magicMod = 0;
    this.yearlyExpenses.laboratories.magicMod = 0;
    this.yearlyExpenses.provisions.magicMod = 0;
    this.yearlyExpenses.wages.magicMod = 0;
    this.yearlyExpenses.weapons.magicMod = 0;
    this.yearlyExpenses.writingMaterials.magicMod = 0;

    this.yearlyExpenses.buildings.mod = 0;
    this.yearlyExpenses.consumables.mod = 0;
    this.yearlyExpenses.laboratories.mod = 0;
    this.yearlyExpenses.provisions.mod = 0;
    this.yearlyExpenses.wages.mod = 0;
    this.yearlyExpenses.weapons.mod = 0;
    this.yearlyExpenses.writingMaterials.mod = 0;

    this.yearlyExpenses.buildings.amount = 0;
    this.yearlyExpenses.consumables.amount = 0;
    this.yearlyExpenses.laboratories.amount = 0;
    this.yearlyExpenses.provisions.amount = 0;
    this.yearlyExpenses.wages.amount = 0;
    this.yearlyExpenses.weapons.amount = 0;
    this.yearlyExpenses.writingMaterials.amount = 0;
    this.yearlyExpenses.buildings.craftSavings = 0;
    this.yearlyExpenses.consumables.craftSavings = 0;
    this.yearlyExpenses.laboratories.craftSavings = 0;
    this.yearlyExpenses.provisions.craftSavings = 0;
    this.yearlyExpenses.wages.craftSavings = 0;
    this.yearlyExpenses.weapons.craftSavings = 0;
    this.yearlyExpenses.writingMaterials.craftSavings = 0;

    this.finances.inhabitantsPoints = 0;
    this.finances.laboratoriesPoints = 0;
    this.finances.weaponsPoints = 0;

    this.census = {
      magi: 0,
      companions: 0,
      specialists: 0,
      craftsmen: 0,
      turbula: 0,
      laborers: 0,
      teamsters: 0,
      servants: 0,
      dependants: 0,
      horses: 0,
      livestock: 0,
      servantsNeeded: 0,
      teamstersNeeded: 0
    };
  }

  prepareDerivedData() {
    this.armor = [];
    this.artsTopics = [];
    this.virtues = [];
    this.calendar = [];
    this.diaryEntries = [];
    this.flaws = [];
    this.incomingSources = [];
    this.items = [];
    this.laboratoryTexts = [];
    this.labs = [];
    this.masteryTopics = [];
    this.mundaneTopics = [];
    this.physicalBooks = [];
    this.possessions = [];
    this.reputations = [];
    this.vis = [];
    this.visSources = [];
    this.weapons = [];

    this.inhabitants = {};
    this.inhabitants.magi = [];
    this.inhabitants.companion = [];
    this.inhabitants.specialists = [];
    this.inhabitants.turbula = [];
    this.inhabitants.habitants = [];
    this.inhabitants.horses = [];
    this.inhabitants.livestock = [];
    this.inhabitants.npcgrogs = this.npcInhabitants;

    this.totalVirtues = 0;
    this.totalFlaws = 0;

    this.scene.document = game.scenes.get(this.scene.id);

    this.finances.totalIncome = 0;

    let libraryPts = 0;
    let labTextPts = 0;
    let visPts = 0;
    let visStock = 0;
    let enchantmentPts = 0;
    let specialistPts = 0;
    let labPts = 0;
    let workersPts = 0;
    let servantPts = 0;
    for (let [key, item] of this.parent.items.entries()) {
      switch (item.type) {
        case "armor":
          this.finances.weaponsPoints += item.system.maintenance;
          this.armor.push(item);
          break;
        case "book":
          let idx = 0;
          for (let topic of item.system.topics) {
            topic.img = item.img;
            topic.id = item.id;
            topic.index = idx++;
            topic.book = item.name;
            switch (topic.category) {
              case "ability":
                libraryPts += item.system.buildPoints(topic);
                this.mundaneTopics.push(topic);
                break;
              case "art":
                libraryPts += item.system.buildPoints(topic);
                this.artsTopics.push(topic);
                break;
              case "mastery":
                libraryPts += item.system.buildPoints(topic);
                this.masteryTopics.push(topic);
                break;
              case "labText":
                if (topic.labtext == null) {
                  topic.system = { type: "" };
                } else {
                  topic.system = topic.labtext;
                  labTextPts += item.system.buildPoints(topic);
                }

                if (topic.labtext != null) {
                  topic.name = `${topic.book}: ${topic.labtextTitle}`;
                }
                this.laboratoryTexts.push(topic);
                break;
              default:
                error(false, `Unknown topic category${topic.category}`);
            }
          }
          this.physicalBooks.push(item);
          break;
        case "calendarCovenant":
          this.calendar.push(item);
          break;
        case "diaryEntry":
          this.diaryEntries.push(item);
          break;
        case "flaw":
          if (CONFIG.ARM5E.impacts[item.system.impact.value]) {
            this.totalFlaws += CONFIG.ARM5E.impacts[item.system.impact.value].cost;
          }
          this.flaws.push(item);
          break;
        case "incomingSource":
          this.finances.totalIncome += item.system.incoming;
          this.incomingSources.push(item);
          break;
        case "inhabitant":
          item.system.points = item.system.livingCost(this.modifiersLife) * item.system.number;
          this.finances.inhabitantsPoints += item.system.points;
          switch (item.system.category) {
            case "magi":
              this.inhabitants.magi.push(item);
              this.census.magi++;
              break;
            case "companions":
              this.inhabitants.companion.push(item);
              this.census.companions++;
              break;
            case "specialists":
              this.census.specialists++;
              specialistPts += item.system.buildPoints;
              this.inhabitants.specialists.push(item);
              break;
            case "craftsmen":
              this.census.craftsmen++;
              this.inhabitants.specialists.push(item);
              break;
            case "turbula":
              this.census.turbula += item.system.number;
              this.inhabitants.turbula.push(item);
              break;
            case "laborers":
              this.census.laborers += item.system.number;
              this.inhabitants.habitants.push(item);
              workersPts += item.system.points;
              break;
            case "servants":
              this.census.servants += item.system.number;
              this.inhabitants.habitants.push(item);
              servantPts += item.system.points;
              workersPts += item.system.points;
              break;
            case "teamsters":
              this.census.teamsters += item.system.number;
              this.inhabitants.habitants.push(item);
              workersPts += item.system.points;
              break;
            case "dependants":
              this.census.dependants += item.system.number;
              this.inhabitants.habitants.push(item);
              break;
            case "horses":
              this.census.horses += item.system.number;
              this.inhabitants.horses.push(item);
              break;
            case "livestock":
              this.census.livestock += item.system.number;
              this.inhabitants.livestock.push(item);
              break;
          }
          break;
        case "item":
          this.items.push(item);
          break;
        case "labCovenant":
          this.finances.laboratoriesPoints += item.system.upkeepCost;
          labPts += item.system.buildPoints;
          this.labs.push(item);
          break;
        case "laboratoryText":
          let topic = {
            id: item.id,
            img: item.img,
            index: 0,
            book: "",
            category: "labText",
            name: item.name,
            system: item.system
          };
          labTextPts += item.system.buildPoints;
          this.laboratoryTexts.push(topic);
          break;
        case "possessionsCovenant":
          this.possessions.push(item);
          break;
        case "reputation":
          this.reputations.push(item);
          break;
        case "virtue":
          if (CONFIG.ARM5E.impacts[item.system.impact.value]) {
            this.totalVirtues += CONFIG.ARM5E.impacts[item.system.impact.value].cost;
          }
          this.virtues.push(item);
          break;
        case "visSourcesCovenant":
          visPts += CONFIG.ARM5E.covenant.vis.sourceCost * item.system.pawns;
          this.visSources.push(item);
          break;
        case "vis":
        case "visStockCovenant": // still needed?
          visStock += item.system.quantity;
          this.vis.push(item);
          break;
        case "weapon":
          this.finances.weaponsPoints += item.system.maintenance;
          this.weapons.push(item);
          break;
        default:
          console.error(
            `Unknown Item type : "${item.type}"  (${item.name} "${item.uuid}"), skipping...`
          );
          continue;
      }
      if (canBeEnchanted(item)) {
        if (item.system.state === "enchanted") {
          enchantmentPts += item.system.enchantments.buildPoints * item.system.quantity;
        }
      }
    }

    // SORTING

    this.armor.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.artsTopics.sort(compareTopics);

    this.flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.incomingSources.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.inhabitants.magi.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.inhabitants.companion.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.inhabitants.specialists.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.inhabitants.turbula.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.inhabitants.habitants.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.inhabitants.horses.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.inhabitants.livestock.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.laboratoryTexts.sort(compareLabTexts);
    this.labs.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.masteryTopics.sort(compareTopics);
    this.mundaneTopics.sort(compareTopics);
    this.physicalBooks.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.possessions.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.reputations.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.vis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.visSources.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    this.weapons.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // BUILD POINTS

    this.buildPoints.laboratoryTexts.computed += labTextPts;
    this.buildPoints.library.computed += libraryPts;
    this.buildPoints.vis.computed +=
      Math.ceil(visStock / CONFIG.ARM5E.covenant.vis.stockCost) + visPts;
    this.buildPoints.magicItems.computed += enchantmentPts;
    this.buildPoints.laboratories.computed += labPts;
    this.buildPoints.money.computed += Math.ceil(this.finances.wealth / 10);
    this.buildPoints.specialists.computed += specialistPts;

    this.yearlyExpenses.buildings.amount += Math.ceil(this.finances.inhabitantsPoints / 10);
    this.yearlyExpenses.consumables.amount += Math.ceil((2 * this.finances.inhabitantsPoints) / 10);
    this.yearlyExpenses.laboratories.amount += Math.ceil(this.finances.laboratoriesPoints / 10);
    this.yearlyExpenses.provisions.amount += Math.ceil((5 * this.finances.inhabitantsPoints) / 10);
    this.yearlyExpenses.wages.amount += Math.ceil((2 * this.finances.inhabitantsPoints) / 10);
    this.yearlyExpenses.wages.factor =
      CONFIG.ARM5E.covenant.loyalty.wages[this.loyalty.modifiers.wages].factor;
    this.yearlyExpenses.wages.amount *= this.yearlyExpenses.wages.factor;
    this.finances.weaponsPoints += this.finances.averageEquipMaintenance * this.census.turbula;
    this.yearlyExpenses.weapons.amount += Math.ceil(this.finances.weaponsPoints / 320);

    // Const bookSpecCnt = this.inhabitants.specialists.reduce((bookSpecialistCnt,current) => { if (current.this.category) })

    this.yearlyExpenses.writingMaterials.amount +=
      this.census.magi +
      this.inhabitants.specialists.filter((e) => {
        return e.system.category === "specialists" && e.system.specialistType === "books";
      }).length;

    // INHABITANTS

    this.census.workers = this.census.laborers + this.census.teamsters + this.census.servants;

    this.census.inhabitants = this.census.workers + this.census.dependants;

    this.census.total =
      this.census.magi +
      this.census.companions +
      this.census.specialists +
      this.census.craftsmen +
      this.census.turbula +
      this.census.inhabitants +
      this.census.horses +
      this.census.livestock +
      this.npcInhabitants;

    // adjust the inhabitant points by removing the workers'
    let tempTotal = this.finances.inhabitantsPoints - workersPts;
    this.census.servantsNeeded += 2 * Math.round(tempTotal / 10);
    // Add the points for these servants to the total
    tempTotal += servantPts;
    this.census.teamstersNeeded = Math.round((tempTotal - 2 * this.census.laborers) / 10);

    // SAVINGS :

    const craftSavings = {
      buildings: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.buildings)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.buildings.maxSaving *
          this.yearlyExpenses.buildings.amount
      },
      consumables: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.consumables)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.consumables.maxSaving *
          this.yearlyExpenses.consumables.amount
      },
      laboratories: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.laboratories)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.laboratories.maxSaving *
          this.yearlyExpenses.laboratories.amount
      },
      provisions: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.provisions)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.provisions.maxSaving *
          this.yearlyExpenses.provisions.amount
      },
      weapons: {
        details: `<h4>${game.i18n.localize(CONFIG.ARM5E.covenant.fieldOfWork.weapons)}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.weapons.maxSaving *
          this.yearlyExpenses.weapons.amount
      },
      writingMaterials: {
        details: `<h4>${game.i18n.localize(
          CONFIG.ARM5E.covenant.fieldOfWork.writingMaterials
        )}<h4/>`,
        crafts: {},
        total: 0,
        max:
          CONFIG.ARM5E.covenant.yearlyExpenses.writingMaterials.maxSaving *
          this.yearlyExpenses.writingMaterials.amount
      }
    };

    this.yearlySavings.laborers.amount = Math.min(
      this.census.laborers,
      this.yearlyExpenses.provisions.amount *
        CONFIG.ARM5E.covenant.yearlyExpenses.provisions.maxSaving
    );

    for (let spe of this.inhabitants.specialists) {
      if (spe.system.category === "specialists") {
        if (spe.system.specialistType == "other" && spe.system.fieldOfWork != "none") {
          let craft = slugify(spe.system.job, false);
          let saves = spe.system.craftSavings;
          if (!craftSavings[spe.system.fieldOfWork].crafts[craft]) {
            craftSavings[spe.system.fieldOfWork].crafts[craft] = { val: saves, type: "spec" };
          } else {
            craftSavings[spe.system.fieldOfWork].crafts[craft].val += saves;
          }
          craftSavings[spe.system.fieldOfWork].total += saves;
        }
      } else if (spe.system.category === "craftsmen" && spe.system.fieldOfWork != "none") {
        let craft = slugify(spe.system.job, false);
        let saves = spe.system.craftSavings;
        if (!craftSavings[spe.system.fieldOfWork].crafts[craft]) {
          craftSavings[spe.system.fieldOfWork].crafts[craft] = { val: saves, type: "craft" };
        } else {
          craftSavings[spe.system.fieldOfWork].crafts[craft].val += saves;
        }
        craftSavings[spe.system.fieldOfWork].total += saves;
      }
    }

    const activeEffects = this.parent.appliedEffects;
    this.yearlySavings.magicItems.quantity = ArM5eActiveEffect.findAllActiveEffectsWithTypeFiltered(
      activeEffects,
      "covenantCostSavingMagic"
    ).length;
    // Savings from magic
    const magicLocalized = slugify(game.i18n.localize("arm5e.sheet.magicLabel"));
    // Savings from mundane effects
    const otherLocalized = slugify(game.i18n.localize("arm5e.generic.other"));
    // Savings from laborers
    // get slugify version of localized "laborer"
    const laborerLocalized = slugify(game.i18n.localize("arm5e.sheet.laborers"));
    craftSavings.provisions.crafts[laborerLocalized] = {
      val: this.census.laborers,
      max: this.yearlyExpenses.provisions.amount / 2
    };

    this.yearlySavings.specialists.amount = 0;
    this.yearlySavings.craftsmen.amount = 0;

    for (let [category, v] of Object.entries(craftSavings)) {
      this.yearlyExpenses[category].savingsDetails = `${craftSavings[category].details}<ul>`;
      if (this.yearlyExpenses[category].magicMod) {
        craftSavings[category].crafts[magicLocalized] = {
          val: this.yearlyExpenses[category].magicMod,
          max: this.yearlyExpenses[category].amount / 2
        };
      }

      if (this.yearlyExpenses[category].mod) {
        craftSavings[category].crafts[otherLocalized] = {
          val: this.yearlyExpenses[category].mod,
          max: this.yearlyExpenses[category].amount / 2
        };
      }

      for (let [craft, save] of Object.entries(craftSavings[category].crafts)) {
        const increment = Math.min(save.val, save.max ? save.max : craftSavings[category].max);
        this.yearlyExpenses[category].craftSavings += increment;
        if (save.type == "spec") {
          this.yearlySavings.specialists.amount += increment;
        } else if (save.type === "craft") {
          this.yearlySavings.craftsmen.amount += increment;
        }
        if (craft == magicLocalized) {
          this.yearlySavings.magicItems.amount += increment;
        }
        this.yearlyExpenses[category].savingsDetails += `<li class='label-light'>${
          craft.charAt(0).toUpperCase() + craft.slice(1)
        } : ${save.val.toFixed(1)} (max ${
          save.max ? save.max.toFixed(1) : craftSavings[category].max.toFixed(1)
        })</li>`;
      }
      this.yearlyExpenses[category].savingsDetails += "</ul>";
      this.yearlyExpenses[category].craftSavings = Math.round(
        Math.min(this.yearlyExpenses[category].amount, this.yearlyExpenses[category].craftSavings)
      );
    }

    this.yearlySavings.specialists.amount = Math.round(this.yearlySavings.specialists.amount);
    this.yearlySavings.craftsmen.amount = Math.round(this.yearlySavings.craftsmen.amount);
    this.yearlySavings.specialists.amount = Math.round(this.yearlySavings.specialists.amount);
    this.yearlySavings.magicItems.amount = Math.round(this.yearlySavings.magicItems.amount);

    this.yearlySavings.laborers.quantity = this.census.laborers;
    this.yearlySavings.craftsmen.quantity = this.census.craftsmen;
    this.yearlySavings.specialists.quantity = this.census.specialists;
    // SUMMARY
    this.finances.costSavings =
      this.yearlyExpenses.buildings.craftSavings +
      this.yearlyExpenses.consumables.craftSavings +
      this.yearlyExpenses.laboratories.craftSavings +
      this.yearlyExpenses.provisions.craftSavings +
      this.yearlyExpenses.wages.craftSavings +
      this.yearlyExpenses.weapons.craftSavings +
      this.yearlyExpenses.writingMaterials.craftSavings;

    this.finances.baseExpenditure =
      this.yearlyExpenses.buildings.amount +
      this.yearlyExpenses.consumables.amount +
      this.yearlyExpenses.laboratories.amount +
      this.yearlyExpenses.provisions.amount +
      this.yearlyExpenses.wages.amount +
      this.yearlyExpenses.weapons.amount +
      this.yearlyExpenses.writingMaterials.amount +
      this.yearlyExpenses.tithes.amount +
      this.yearlyExpenses.sundry.amount +
      this.yearlyExpenses.inflation.amount;

    this.finances.totalExpenditure = this.finances.baseExpenditure - this.finances.costSavings;
  }
}
