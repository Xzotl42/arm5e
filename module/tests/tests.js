import { ARM5E } from "../config.js";
import { createRoll, stressDie } from "../dice.js";
import { StressDieInternal } from "../helpers/stressdie.js";
import { log, sleep } from "../tools.js";
import { nextDate } from "../tools/time.js";
import { registerAbilityScoresTesting } from "./abilityScoreTesting.js";
import { registerActorLinkTesting } from "./actorLinkTesting.js";
import { registerDEBUGTest } from "./DEBUGTest.js";
import { registerAdventuringTesting } from "./diaryAdventuringTest.js";
import { registerApprenticeshipTesting } from "./diaryCharCreationTest.js";
import { registerExposureTesting } from "./diaryExposureTest.js";
import { registerTeachingTesting } from "./diaryTeachingTest.js";
import { registerTrainingTesting } from "./diaryTrainingTest.js";
import { registerVisTesting } from "./diaryVis.js";
import { registerItemCreationTests } from "./itemCreationTests.js";
import { registerLabActivityTesting } from "./labActivityTest.js";
import { registerRecoveryTesting } from "./recoveryTests.js";
import { registerMagicRollTesting } from "./rollMagicTests.js";
import { registerOptionRollTesting } from "./rollOptionTests.js";
import { registerRollTesting } from "./rollsTest.js";
import { registerSheetDisplayTests } from "./sheetDisplayTests.js";
import { registerStressDieTesting } from "./stressDieTesting.js";
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
import { registerDiaryTesting } from "./testSchedule.js";

export function registerTestSuites(quench) {
  registerDEBUGTest(quench);
  // registerRecoveryTesting(quench);
  registerLabActivityTesting(quench);
  registerActorLinkTesting(quench);
  registerDiaryTesting(quench);
  registerStressDieTesting(quench);
  registerAbilityScoresTesting(quench);
  registerRollTesting(quench);
  registerOptionRollTesting(quench);
  registerMagicRollTesting(quench);
  registerSheetDisplayTests(quench);
  registerItemCreationTests(quench);
  registerAdventuringTesting(quench);
  registerApprenticeshipTesting(quench);
  registerTrainingTesting(quench);
  registerTeachingTesting(quench);
  registerExposureTesting(quench);
  registerVisTesting(quench);
}
