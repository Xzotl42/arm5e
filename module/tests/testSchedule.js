import {
  athleticsSkill,
  companionData,
  languageSkill,
  magicTheorySkill,
  magusData,
  penetrationSkill,
  readingSkill,
  spellData1
} from "./testData.js";
import { ARM5E } from "../config.js";
import { log, sleep } from "../tools.js";
import { nextDate } from "../tools/time.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
const results = {
  none: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: false,
    training: false,
    teaching: false,
    hermeticApp: false,
    childhood: false,
    laterLife: false,
    laterLifeMagi: false,
    reading: false,
    writing: false,
    learnSpell: false,
    inventSpell: false,
    visExtraction: false,
    lab: false,
    aging: false,
    visStudy: false,
    recovery: false,
    longevityRitual: false,
    minorEnchantment: false,
    chargedItem: false,
    investigateItem: false
  },
  adventuring: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: false,
    training: false,
    teaching: false,
    hermeticApp: false,
    childhood: false,
    laterLife: false,
    laterLifeMagi: false,
    reading: false,
    writing: false,
    learnSpell: false,
    inventSpell: false,
    visExtraction: false,
    lab: false,
    aging: false,
    visStudy: false,
    recovery: false,
    longevityRitual: false,
    minorEnchantment: false,
    chargedItem: false,
    investigateItem: false
  },
  exposure: {
    none: false,
    adventuring: false,
    exposure: true,
    practice: false,
    training: false,
    teaching: false,
    hermeticApp: false,
    childhood: false,
    laterLife: false,
    laterLifeMagi: false,
    reading: false,
    writing: false,
    learnSpell: false,
    inventSpell: false,
    visExtraction: false,
    lab: false,
    aging: false,
    visStudy: false,
    recovery: false,
    longevityRitual: false,
    minorEnchantment: false,
    chargedItem: false,
    investigateItem: false
  },
  practice: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  training: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  teaching: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  hermeticApp: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  childhood: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  laterLife: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  laterLifeMagi: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  reading: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  writing: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  learnSpell: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  inventSpell: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: false,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  visExtraction: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  lab: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  aging: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: false,
    training: false,
    teaching: false,
    hermeticApp: false,
    childhood: false,
    laterLife: false,
    laterLifeMagi: false,
    reading: false,
    writing: false,
    learnSpell: false,
    inventSpell: false,
    visExtraction: false,
    lab: false,
    aging: false,
    visStudy: false,
    recovery: false,
    longevityRitual: false,
    minorEnchantment: false,
    chargedItem: false,
    investigateItem: false
  },
  visStudy: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  recovery: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: false,
    training: false,
    teaching: false,
    hermeticApp: false,
    childhood: false,
    laterLife: false,
    laterLifeMagi: false,
    reading: false,
    writing: false,
    learnSpell: false,
    inventSpell: false,
    visExtraction: false,
    lab: false,
    aging: false,
    visStudy: false,
    recovery: false,
    longevityRitual: false,
    minorEnchantment: false,
    chargedItem: false,
    investigateItem: false
  },
  longevityRitual: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  minorEnchantment: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  chargedItem: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  },
  investigateItem: {
    none: false,
    adventuring: false,
    exposure: false,
    practice: true,
    training: true,
    teaching: true,
    hermeticApp: true,
    childhood: true,
    laterLife: true,
    laterLifeMagi: true,
    reading: true,
    writing: true,
    learnSpell: true,
    inventSpell: true,
    visExtraction: true,
    lab: true,
    aging: false,
    visStudy: true,
    recovery: false,
    longevityRitual: true,
    minorEnchantment: true,
    chargedItem: true,
    investigateItem: true
  }
};
export function registerDiaryTesting(quench) {
  quench.registerBatch(
    "Ars-Diary",
    (context) => {
      let magus;
      let Sp1;
      const { describe, it, assert, after, before } = context;
      describe(`Diary entries tests`, function () {
        before(async function () {
          magus = await Actor.create({
            name: `JasquierTheChronicler`,
            type: "player",
            system: magusData
          });
          await magus.sheet._itemCreate({
            name: "Penetration",
            type: "ability",
            ...penetrationSkill
          });
          await magus.sheet._itemCreate({
            name: "Artes liberales",
            type: "ability",
            ...readingSkill
          });

          await magus.sheet._itemCreate({
            name: "Athletics",
            type: "ability",
            ...athleticsSkill
          });
          await magus.sheet._itemCreate({
            name: "Magic Theory",
            type: "ability",
            ...magicTheorySkill
          });
          await magus.sheet._itemCreate({ name: "Gaelic", type: "ability", ...languageSkill });
          Sp1 = (
            await magus.sheet._itemCreate({
              name: "Standard spell",
              type: "spell",
              ...spellData1
            })
          )[0];
        });
        describe("Conflict test", function () {
          it(`Legacy diary`, async function () {
            const entryData = [
              {
                name: `Legacy diary`,
                type: "diaryEntry",
                system: {
                  done: false,
                  cappedGain: false,
                  dates: [{ year: 1220, season: "winter", date: "The Date", applied: true }],
                  sourceQuality: 42,
                  activity: "none",
                  progress: {
                    abilities: [],
                    arts: [],
                    spells: [],
                    newSpells: []
                  },
                  optionKey: "standard",
                  duration: 1,
                  description: `Some label for it`,
                  externalIds: []
                }
              },
              {
                name: `Legacy diary 2`,
                type: "diaryEntry",
                system: {
                  done: false,
                  cappedGain: false,
                  dates: [{ year: 1220, season: "winter", date: "The Date", applied: true }],
                  sourceQuality: 42,
                  activity: "none",
                  progress: {
                    abilities: [],
                    arts: [],
                    spells: [],
                    newSpells: []
                  },
                  optionKey: "standard",
                  duration: 1,
                  description: `Some label for it`,
                  externalIds: []
                }
              }
            ];
            let entry = await magus.createEmbeddedDocuments("Item", entryData, {});
            assert.equal(entry.length, 2, "Item created");
            assert.equal(
              entry[0].system.hasScheduleConflict(magus),
              false,
              "There should be no conflict"
            );
          });

          after(async function () {
            let diariesIds = magus.items.filter((e) => e.type === "diaryEntry").map((e) => e._id);
            await magus.deleteEmbeddedDocuments("Item", diariesIds);
          });
        });
        describe("Conflicts test", function () {
          let tmpDate = { year: 1200, season: "spring" };
          for (const [key1, act1] of Object.entries(ARM5E.activities.generic)) {
            // magus.sheet.render(true);

            log(false, `date : ${JSON.stringify(tmpDate)}`);

            for (const [key2, act2] of Object.entries(ARM5E.activities.generic)) {
              tmpDate = { year: tmpDate.year, season: tmpDate.season };
              it(`${game.i18n.localize(act1.label)} vs ${game.i18n.localize(
                act2.label
              )}`, async function () {
                const entryData = [
                  {
                    name: `${game.i18n.localize(act1.label)}'s sheet`,
                    type: "diaryEntry",
                    system: {
                      done: false,
                      cappedGain: false,
                      dates: [
                        {
                          year: tmpDate.year,
                          season: tmpDate.season,
                          date: "The Date",
                          applied: false
                        }
                      ],
                      sourceQuality: 42,
                      activity: key1,
                      progress: {
                        abilities: [],
                        arts: [],
                        spells: [],
                        newSpells: []
                      },
                      optionKey: "standard",
                      duration: act1.duration ? act1.duration : 1,
                      description: `Some label for ${game.i18n.localize(act1.label)}`,
                      externalIds: []
                    }
                  },
                  {
                    name: `${game.i18n.localize(act2.label)}'s sheet`,
                    type: "diaryEntry",
                    system: {
                      done: false,
                      cappedGain: false,
                      dates: [
                        {
                          year: tmpDate.year,
                          season: tmpDate.season,
                          date: "The Date",
                          applied: false
                        }
                      ],
                      sourceQuality: 42,
                      activity: key2,
                      progress: {
                        abilities: [],
                        arts: [],
                        spells: [],
                        newSpells: []
                      },
                      optionKey: "standard",
                      duration: act2.duration ? act2.duration : 1,
                      description: `Some label for ${game.i18n.localize(act2.label)}`,
                      externalIds: []
                    }
                  }
                ];
                let entries = await magus.createEmbeddedDocuments("Item", entryData, {});
                assert.equal(entries.length, 2, "Item created");
                let hasConflict = true;
                if (key1 === key2) {
                  hasConflict = !CONFIG.ARM5E.activities.duplicateAllowed.includes(key2);
                } else {
                  hasConflict = !(
                    CONFIG.ARM5E.activities.conflictExclusion.includes(key1) ||
                    CONFIG.ARM5E.activities.conflictExclusion.includes(key2)
                  );
                }
                assert.equal(
                  entries[0].system.hasScheduleConflict(magus),
                  results[key1][key2],
                  results[key1][key2] ? "There should be a conflict" : "There should be no conflict"
                );
                const actorSchedule = magus.getSchedule(tmpDate.year, tmpDate.year, [], []);
                assert.equal(
                  DiaryEntrySchema.hasConflict(actorSchedule[0].seasons[tmpDate.season]),
                  results[key1][key2],
                  results[key1][key2] ? "There should be a conflict" : "There should be no conflict"
                );
                tmpDate = nextDate(tmpDate.season, tmpDate.year);
                await magus.deleteEmbeddedDocuments(
                  "Item",
                  entries.map((e) => e._id)
                );
              });
            }
          }
          after(async function () {
            let diariesIds = magus.items.filter((e) => e.type === "diaryEntry").map((e) => e._id);
            await magus.deleteEmbeddedDocuments("Item", diariesIds);
          });
          // magus.sheet.close();
        });
        describe("Display sheet test", function () {
          let tmpDate = { year: 1220, season: "spring" };
          for (const [key, act] of Object.entries(ARM5E.activities.generic)) {
            tmpDate = { year: tmpDate.year, season: tmpDate.season };

            log(false, `date : ${JSON.stringify(tmpDate)}`);
            it(`${game.i18n.localize(act.label)}'s sheet`, async function () {
              const entryData = [
                {
                  name: `${game.i18n.localize(act.label)}'s sheet`,
                  type: "diaryEntry",
                  system: {
                    done: false,
                    cappedGain: false,
                    dates: [
                      {
                        year: tmpDate.year,
                        season: tmpDate.season,
                        date: "The Date",
                        applied: false
                      }
                    ],
                    sourceQuality: 42,
                    activity: key,
                    progress: {
                      abilities: [],
                      arts: [],
                      spells: [],
                      newSpells: []
                    },
                    optionKey: "standard",
                    duration: 1,
                    description: `Some label for ${game.i18n.localize(act.label)}`,
                    externalIds: []
                  }
                }
              ];
              let entry = await magus.createEmbeddedDocuments("Item", entryData, {});
              assert.equal(entry.length, 1, "Item created");
              entry[0].sheet.render(true);
              await sleep(100);
              assert.equal(
                entry[0].system.hasScheduleConflict(magus),
                false,
                "There should be no conflict"
              );
              await entry[0].sheet._onProgressApply({}, false);
              await sleep(100);
              await entry[0].sheet.close();
              tmpDate = nextDate(tmpDate.season, tmpDate.year);
            });
          }
          after(async function () {
            let diariesIds = magus.items.filter((e) => e.type === "diaryEntry").map((e) => e._id);
            await magus.deleteEmbeddedDocuments("Item", diariesIds);
          });
        });

        after(async function () {
          if (magus) {
            await magus.delete();
          }
        });
      });
    },
    { displayName: "ARS : Diary and activity sheets" }
  );
}
