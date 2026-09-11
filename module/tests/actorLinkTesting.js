import { log, sleep } from "../tools/tools.js";
import { getCompanion, getMagus } from "./testData.js";
import { ArsLayer } from "../ui/ars-layer.js";
import { ARM5E } from "../config.js";
import { simpleDie, stressDie } from "../helpers/dice.js";
import Aura from "../helpers/aura.js";
import {
  verifyCharacterCovenantLink,
  verifyLabCovenantLink,
  verifyLabOwnerLink,
  verifyLinkCleared,
  verifyCovenantDoesNotHaveInhabitant,
  verifyCovenantDoesNotHaveLabCovenant,
  verifyCovenantHasInhabitant,
  verifyLabPlanningReset
} from "./testHelpers.js";

export function registerActorLinkTesting(quench) {
  quench.registerBatch(
    "Ars-ActorLink",
    (context) => {
      const { describe, it, assert, expect, should, before, after, afterEach } = context;

      // ─── CHARACTER ↔ COVENANT LINK TESTS ────────────────────────────────────────

      describe("Character ↔ Covenant Links", function () {
        this.timeout(300000);

        let character;
        let covenant;

        afterEach(async function () {
          if (character) await character.delete();
          if (covenant) await covenant.delete();
        });

        // Test 1a: Drag character → covenant sheet
        it("Character drag → covenant: establishes link and creates inhabitant", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          // Drag character onto covenant sheet
          await covenant.sheet._onDropActor(null, character);

          // Refresh actors to get latest data
          character = await Actor.get(character.id);
          covenant = await Actor.get(covenant.id);

          // Verify data model
          verifyCharacterCovenantLink(character, covenant, assert);

          // Render sheets and verify UI displays
          character.sheet.render(true);
          covenant.sheet.render(true);
          await sleep(100);
          await character.sheet.close();
          await covenant.sheet.close();
        });

        // Test 1b: Drag covenant → character sheet
        it("Covenant drag → character: establishes link and creates inhabitant", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "npc" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          // Drag covenant onto character sheet
          await character.sheet._onDropActor(null, covenant);

          // Refresh actors
          character = await Actor.get(character.id);
          covenant = await Actor.get(covenant.id);

          // Verify (same result as 1a, just reverse direction)
          verifyCharacterCovenantLink(character, covenant, assert);

          character.sheet.render(true);
          covenant.sheet.render(true);
          await sleep(100);
          await character.sheet.close();
          await covenant.sheet.close();
        });

        // Test 1c: Change character covenant (existing link → new covenant)
        it("Change character covenant: moves inhabitant from old to new covenant", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          let cov1 = await Actor.create({ name: "Covenant1", type: "covenant" });
          let cov2 = await Actor.create({ name: "Covenant2", type: "covenant" });

          // Link to covenant1
          await cov1.sheet._onDropActor(null, character);
          character = await Actor.get(character.id);
          verifyCharacterCovenantLink(character, cov1, assert);

          // Change to covenant2
          await character.sheet.linkToCovenant(cov2.name, cov2);
          character = await Actor.get(character.id);
          cov1 = await Actor.get(cov1.id);
          cov2 = await Actor.get(cov2.id);

          // Verify character now linked to cov2 (not cov1)
          verifyCharacterCovenantLink(character, cov2, assert);

          // Verify old covenant lost the inhabitant
          verifyCovenantDoesNotHaveInhabitant(cov1, character.id, assert);

          // Verify new covenant has the inhabitant
          verifyCovenantHasInhabitant(cov2, character.id, undefined, assert);

          // Cleanup extra covenant
          await cov1.delete();
          await cov2.delete();
        });

        // Test 1d: Multi-step covenant changes
        it("Multi-step covenant changes: inhabitant moves correctly each time", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          let cov1 = await Actor.create({ name: "Covenant1", type: "covenant" });
          let cov2 = await Actor.create({ name: "Covenant2", type: "covenant" });
          let cov3 = await Actor.create({ name: "Covenant3", type: "covenant" });

          // Link to cov1
          await cov1.sheet._onDropActor(null, character);
          character = await Actor.get(character.id);
          verifyCharacterCovenantLink(character, cov1, assert);

          // Change to cov2
          await character.sheet.linkToCovenant(cov2.name, cov2);
          character = await Actor.get(character.id);
          cov1 = await Actor.get(cov1.id);
          cov2 = await Actor.get(cov2.id);
          verifyCharacterCovenantLink(character, cov2, assert);
          verifyCovenantDoesNotHaveInhabitant(cov1, character.id, assert);

          // Change to cov3
          await character.sheet.linkToCovenant(cov3.name, cov3);
          character = await Actor.get(character.id);
          cov2 = await Actor.get(cov2.id);
          cov3 = await Actor.get(cov3.id);
          verifyCharacterCovenantLink(character, cov3, assert);
          verifyCovenantDoesNotHaveInhabitant(cov2, character.id, assert);

          // Cleanup
          await cov1.delete();
          await cov2.delete();
          await cov3.delete();
        });

        // Test 1e: Unlink character from covenant
        it("Unlink character from covenant: clears fields and removes inhabitant", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          // Link
          await covenant.sheet._onDropActor(null, character);
          character = await Actor.get(character.id);
          covenant = await Actor.get(covenant.id);
          verifyCharacterCovenantLink(character, covenant, assert);

          // Unlink by calling linkToCovenant with null
          await character.sheet.linkToCovenant("", null);
          character = await Actor.get(character.id);
          covenant = await Actor.get(covenant.id);

          // Verify link cleared
          verifyLinkCleared(character, "system.covenant", assert);

          // Verify inhabitant deleted
          verifyCovenantDoesNotHaveInhabitant(covenant, character.id, assert);
        });

        // Test 1f: Re-link character to same covenant should abort
        it("Character link to same covenant twice: aborts second link and keeps single inhabitant", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          const firstResult = await character.sheet.linkToCovenant(covenant.name, covenant);
          assert.equal(firstResult, true, "First link should succeed");

          let refreshedCharacter = await Actor.get(character.id);
          let refreshedCovenant = await Actor.get(covenant.id);
          verifyCharacterCovenantLink(refreshedCharacter, refreshedCovenant, assert);

          const secondResult = await refreshedCharacter.sheet.linkToCovenant(
            refreshedCovenant.name,
            refreshedCovenant
          );
          assert.equal(secondResult, false, "Second link to same covenant should abort");

          refreshedCharacter = await Actor.get(character.id);
          refreshedCovenant = await Actor.get(covenant.id);
          verifyCharacterCovenantLink(refreshedCharacter, refreshedCovenant, assert);

          const linkedInhabitants = refreshedCovenant.items.filter(
            (i) => i.type === "inhabitant" && i.system.actorId === refreshedCharacter.id
          );
          assert.equal(
            linkedInhabitants.length,
            1,
            "Covenant should keep a single inhabitant link"
          );
        });

        // Test 1g: Re-drop character to same covenant should abort
        it("Character drag twice to same covenant: second drop aborts and keeps single inhabitant", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          const firstResult = await covenant.sheet._onDropActor(null, character);
          assert.equal(firstResult, true, "First drop should succeed");

          let refreshedCharacter = await Actor.get(character.id);
          let refreshedCovenant = await Actor.get(covenant.id);
          verifyCharacterCovenantLink(refreshedCharacter, refreshedCovenant, assert);

          const secondResult = await refreshedCovenant.sheet._onDropActor(null, refreshedCharacter);
          assert.equal(secondResult, false, "Second drop to same covenant should abort");

          refreshedCharacter = await Actor.get(character.id);
          refreshedCovenant = await Actor.get(covenant.id);
          verifyCharacterCovenantLink(refreshedCharacter, refreshedCovenant, assert);

          const linkedInhabitants = refreshedCovenant.items.filter(
            (i) => i.type === "inhabitant" && i.system.actorId === refreshedCharacter.id
          );
          assert.equal(
            linkedInhabitants.length,
            1,
            "Covenant should keep a single inhabitant link"
          );
        });
      });

      // ─── LAB ↔ COVENANT LINK TESTS ──────────────────────────────────────────────

      describe("Laboratory ↔ Covenant Links", function () {
        this.timeout(300000);

        let laboratory;
        let covenant;

        afterEach(async function () {
          if (laboratory) await laboratory.delete();
          if (covenant) await covenant.delete();
        });

        // Test 2a: Drag lab → covenant sheet
        it("Lab drag → covenant: establishes link and creates labCovenant", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          // Drag lab onto covenant sheet
          await covenant.sheet._onDropActor(null, laboratory);

          // Refresh
          laboratory = await Actor.get(laboratory.id);
          covenant = await Actor.get(covenant.id);

          // Verify data model
          verifyLabCovenantLink(laboratory, covenant, assert);

          // Render sheets and verify UI
          laboratory.sheet.render(true);
          covenant.sheet.render(true);
          await sleep(100);
          await laboratory.sheet.close();
          await covenant.sheet.close();
        });

        // Test 2b: Drag covenant → lab sheet
        it("Covenant drag → lab: establishes link and creates labCovenant", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          // Drag covenant onto lab sheet
          await laboratory.sheet._onDropActor(null, covenant);

          // Refresh
          laboratory = await Actor.get(laboratory.id);
          covenant = await Actor.get(covenant.id);

          // Verify
          verifyLabCovenantLink(laboratory, covenant, assert);

          laboratory.sheet.render(true);
          covenant.sheet.render(true);
          await sleep(100);
          await laboratory.sheet.close();
          await covenant.sheet.close();
        });

        // Test 2c: Change lab covenant (cascade effects)
        it("Change lab covenant: unlinks owner and resets planning", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          await laboratory.sheet.render(true);
          await sleep(100);
          await laboratory.sheet.close();
          let cov1 = await Actor.create({ name: "Covenant1", type: "covenant" });
          let cov2 = await Actor.create({ name: "Covenant2", type: "covenant" });

          // Link lab to cov1
          await cov1.sheet._onDropActor(null, laboratory);
          laboratory = await Actor.get(laboratory.id);
          verifyLabCovenantLink(laboratory, cov1, assert);

          // Change to cov2
          await laboratory.sheet.linkToCovenant(cov2.name, cov2);
          laboratory = await Actor.get(laboratory.id);
          cov1 = await Actor.get(cov1.id);
          cov2 = await Actor.get(cov2.id);

          // Verify lab now linked to cov2
          verifyLabCovenantLink(laboratory, cov2, assert);

          // Verify old covenant lost the labCovenant
          verifyCovenantDoesNotHaveLabCovenant(cov1, laboratory.id, assert);

          // Verify new covenant has the labCovenant
          const labCov = cov2.items.find(
            (i) => i.type === "labCovenant" && i.system.sanctumId === laboratory.id
          );
          assert.isNotNull(labCov, "Covenant should have labCovenant for lab");

          // Verify planning reset (cascade)
          verifyLabPlanningReset(laboratory, assert);

          // Cleanup
          await cov1.delete();
          await cov2.delete();
        });

        // Test 2d: Unlink lab from covenant
        it("Unlink lab from covenant: clears fields and removes labCovenant", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          // Link
          await covenant.sheet._onDropActor(null, laboratory);
          laboratory = await Actor.get(laboratory.id);
          covenant = await Actor.get(covenant.id);
          verifyLabCovenantLink(laboratory, covenant, assert);

          // Unlink
          await laboratory.sheet.linkToCovenant("", null);
          laboratory = await Actor.get(laboratory.id);
          covenant = await Actor.get(covenant.id);

          // Verify link cleared
          verifyLinkCleared(laboratory, "system.covenant", assert);

          // Verify labCovenant deleted
          verifyCovenantDoesNotHaveLabCovenant(covenant, laboratory.id, assert);
        });

        // Test 2e: Re-link lab to same covenant should abort
        it("Lab link to same covenant twice: aborts second link and keeps single labCovenant", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          const firstResult = await laboratory.sheet.linkToCovenant(covenant.name, covenant);
          assert.equal(firstResult.length > 0, true, "First link should succeed");

          let refreshedLab = await Actor.get(laboratory.id);
          let refreshedCovenant = await Actor.get(covenant.id);
          verifyLabCovenantLink(refreshedLab, refreshedCovenant, assert);

          const secondResult = await refreshedLab.sheet.linkToCovenant(
            refreshedCovenant.name,
            refreshedCovenant
          );
          assert.equal(secondResult, false, "Second link to same covenant should abort");

          refreshedLab = await Actor.get(laboratory.id);
          refreshedCovenant = await Actor.get(covenant.id);
          verifyLabCovenantLink(refreshedLab, refreshedCovenant, assert);

          const linkedLabs = refreshedCovenant.items.filter(
            (i) => i.type === "labCovenant" && i.system.sanctumId === refreshedLab.id
          );
          assert.equal(linkedLabs.length, 1, "Covenant should keep a single labCovenant link");
        });

        // Test 2f: Re-drop lab to same covenant should abort
        it("Lab drag twice to same covenant: second drop aborts and keeps single labCovenant", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          const firstResult = await covenant.sheet._onDropActor(null, laboratory);
          assert.equal(firstResult, true, "First drop should succeed");

          let refreshedLab = await Actor.get(laboratory.id);
          let refreshedCovenant = await Actor.get(covenant.id);
          verifyLabCovenantLink(refreshedLab, refreshedCovenant, assert);

          const secondResult = await refreshedCovenant.sheet._onDropActor(null, refreshedLab);
          assert.equal(secondResult, false, "Second drop to same covenant should abort");

          refreshedLab = await Actor.get(laboratory.id);
          refreshedCovenant = await Actor.get(covenant.id);
          verifyLabCovenantLink(refreshedLab, refreshedCovenant, assert);

          const linkedLabs = refreshedCovenant.items.filter(
            (i) => i.type === "labCovenant" && i.system.sanctumId === refreshedLab.id
          );
          assert.equal(linkedLabs.length, 1, "Covenant should keep a single labCovenant link");
        });
      });

      // ─── LAB ↔ CHARACTER (OWNER) LINK TESTS ────────────────────────────────────

      describe("Laboratory ↔ Character (Owner) Links", function () {
        this.timeout(300000);

        let laboratory;
        let character;

        afterEach(async function () {
          if (laboratory) await laboratory.delete();
          if (character) await character.delete();
        });

        // Test 3a: Set lab owner via dropdown
        it("Set lab owner: establishes bidirectional link and resets planning", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          character = await Actor.create({ name: "TestCharacter", type: "player" });

          // Set lab owner via sheet method
          await laboratory.sheet.linkToOwner(character.name, character);
          laboratory = await Actor.get(laboratory.id);
          character = await Actor.get(character.id);

          // Verify bidirectional link
          verifyLabOwnerLink(laboratory, character, assert);

          // Verify planning reset
          verifyLabPlanningReset(laboratory, assert);

          // Render and verify UI
          laboratory.sheet.render(true);
          character.sheet.render(true);
          await sleep(100);
          await laboratory.sheet.close();
          await character.sheet.close();
        });

        // Test 3b: Change lab owner (existing → new owner)
        it("Change lab owner: unlinks old owner, links new owner", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          let char1 = await Actor.create({ name: "Character1", type: "player" });
          let char2 = await Actor.create({ name: "Character2", type: "player" });

          // Set owner to char1 via sheet method
          await laboratory.sheet.linkToOwner(char1.name, char1);
          laboratory = await Actor.get(laboratory.id);
          char1 = await Actor.get(char1.id);
          verifyLabOwnerLink(laboratory, char1, assert);

          // Change to char2 via sheet method
          await laboratory.sheet.linkToOwner(char2.name, char2);
          laboratory = await Actor.get(laboratory.id);
          char1 = await Actor.get(char1.id);
          char2 = await Actor.get(char2.id);

          // Verify lab now linked to char2 (not char1)
          verifyLabOwnerLink(laboratory, char2, assert);

          // Verify char1's sanctum cleared
          verifyLinkCleared(char1, "system.sanctum", assert);

          // Cleanup
          await char1.delete();
          await char2.delete();
        });

        // Test 3c: Unlink lab owner
        it("Unlink lab owner: clears bidirectional link and resets planning", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          character = await Actor.create({ name: "TestCharacter", type: "player" });

          // Set owner via sheet method
          await laboratory.sheet.linkToOwner(character.name, character);
          laboratory = await Actor.get(laboratory.id);
          character = await Actor.get(character.id);
          verifyLabOwnerLink(laboratory, character, assert);

          // Unlink via sheet method
          await laboratory.sheet.linkToOwner("", null);
          laboratory = await Actor.get(laboratory.id);
          character = await Actor.get(character.id);

          // Verify both sides cleared
          verifyLinkCleared(laboratory, "system.owner", assert);
          verifyLinkCleared(character, "system.sanctum", assert);
        });

        // Test 3d: Re-link lab owner to same character should abort
        it("Lab owner link to same character twice: aborts second link", async function () {
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          character = await Actor.create({ name: "TestCharacter", type: "player" });

          const firstResult = await laboratory.sheet.linkToOwner(character.name, character);
          assert.equal(firstResult, true, "First owner link should succeed");

          let refreshedLab = await Actor.get(laboratory.id);
          let refreshedCharacter = await Actor.get(character.id);
          verifyLabOwnerLink(refreshedLab, refreshedCharacter, assert);

          const secondResult = await refreshedLab.sheet.linkToOwner(
            refreshedCharacter.name,
            refreshedCharacter
          );
          assert.equal(secondResult, false, "Second owner link should abort");

          refreshedLab = await Actor.get(laboratory.id);
          refreshedCharacter = await Actor.get(character.id);
          verifyLabOwnerLink(refreshedLab, refreshedCharacter, assert);
        });
      });

      // ─── CASCADE VERIFICATION TESTS ─────────────────────────────────────────────

      describe("Link Cascades and Edge Cases", function () {
        this.timeout(300000);

        let character;
        let laboratory;
        let covenant;

        afterEach(async function () {
          if (character) await character.delete();
          if (laboratory) await laboratory.delete();
          if (covenant) await covenant.delete();
        });

        // Test 4a: Change character covenant → cascades unlink from lab
        it("Change character covenant: cascade unlinks from lab owner", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });
          const cov2 = await Actor.create({ name: "Covenant2", type: "covenant" });

          // Link character to covenant
          await covenant.sheet._onDropActor(null, character);
          character = await Actor.get(character.id);
          verifyCharacterCovenantLink(character, covenant, assert);

          // Link lab to character as owner via sheet method
          await laboratory.sheet.linkToOwner(character.name, character);
          laboratory = await Actor.get(laboratory.id);
          character = await Actor.get(character.id);
          verifyLabOwnerLink(laboratory, character, assert);

          // Change character covenant
          await character.sheet.linkToCovenant(cov2.name, cov2);
          character = await Actor.get(character.id);
          laboratory = await Actor.get(laboratory.id);
          const updatedCov2 = await Actor.get(cov2.id);

          // Verify character linked to new covenant
          verifyCharacterCovenantLink(character, updatedCov2, assert);

          // Verify lab owner link was cascade-cleared
          verifyLinkCleared(laboratory, "system.owner", assert);
          verifyLinkCleared(character, "system.sanctum", assert);

          // Cleanup
          await cov2.delete();
        });

        // Test 4b: Unlink character from covenant → cascade clears lab owner/sanctum
        it("Unlink character from covenant: clears sanctum link, lab remains at covenant", async function () {
          character = await Actor.create({ name: "TestCharacter", type: "player" });
          laboratory = await Actor.create({ name: "TestLab", type: "laboratory" });
          covenant = await Actor.create({ name: "TestCovenant", type: "covenant" });

          // Link character to covenant and lab (via sheet methods for bidirectional data)
          await covenant.sheet._onDropActor(null, character);
          await covenant.sheet._onDropActor(null, laboratory);
          await laboratory.sheet.linkToOwner(character.name, character);
          character = await Actor.get(character.id);
          laboratory = await Actor.get(laboratory.id);
          verifyCharacterCovenantLink(character, covenant, assert);
          verifyLabOwnerLink(laboratory, character, assert);
          verifyLabCovenantLink(laboratory, covenant, assert);

          // Unlink covenant only
          await character.sheet.linkToCovenant("", null);
          character = await Actor.get(character.id);
          laboratory = await Actor.get(laboratory.id);

          // Verify covenant link cleared
          verifyLinkCleared(character, "system.covenant", assert);

          // Verify sanctum/owner link was cascade-cleared
          verifyLinkCleared(character, "system.sanctum", assert);
          verifyLinkCleared(laboratory, "system.owner", assert);

          // Verify lab remains linked to its covenant
          assert.equal(laboratory.system.covenant.actorId, covenant.id);
          assert.equal(laboratory.system.covenant.linked, true);
          assert.equal(laboratory.system.covenant.value, covenant.name);
        });
      });

      // ─── PERFORMANCE TESTS (LARGE NUMBERS) ──────────────────────────────────────

      describe("Performance: Large Numbers of Links", function () {
        this.timeout(600000); // 10 minutes for large scale tests

        let covenant;
        let characters = [];
        let labs = [];

        afterEach(async function () {
          if (covenant) await covenant.delete();
          for (const char of characters) {
            if (char) await char.delete();
          }
          for (const lab of labs) {
            if (lab) await lab.delete();
          }
          characters = [];
          labs = [];
        });

        // Test 5a: Covenant with many inhabitant links
        it("Link 30 characters to covenant: all inhabitant items created", async function () {
          covenant = await Actor.create({ name: "LargeCovenant", type: "covenant" });

          // Create 20 players + 10 NPCs
          for (let i = 0; i < 20; i++) {
            characters.push(await Actor.create({ name: `Player${i}`, type: "player" }));
          }
          for (let i = 0; i < 10; i++) {
            characters.push(await Actor.create({ name: `NPC${i}`, type: "npc" }));
          }

          // Link all to covenant
          for (const char of characters) {
            await covenant.sheet._onDropActor(null, char);
          }

          // Refresh covenant and verify all inhabitants created
          covenant = await Actor.get(covenant.id);
          const inhabitants = covenant.items.filter((i) => i.type === "inhabitant");
          assert.equal(inhabitants.length, 30, "Covenant should have 30 inhabitant items");

          // Verify each character is in inhabitants
          for (const charRecord of characters) {
            const charRefreshed = await Actor.get(charRecord.id);
            verifyCharacterCovenantLink(charRefreshed, covenant, assert);
          }

          // Render covenant sheet with many inhabitants
          covenant.sheet.render(true);
          await sleep(200);
          await covenant.sheet.close();
        });

        // Test 5b: Covenant with many lab links
        it("Link 10 labs to covenant: all labCovenant items created", async function () {
          covenant = await Actor.create({ name: "LargeCovenant", type: "covenant" });

          // Create 10 labs
          for (let i = 0; i < 10; i++) {
            labs.push(await Actor.create({ name: `Lab${i}`, type: "laboratory" }));
          }

          // Link all to covenant
          for (const lab of labs) {
            await covenant.sheet._onDropActor(null, lab);
          }

          // Refresh and verify
          covenant = await Actor.get(covenant.id);
          const labCovenants = covenant.items.filter((i) => i.type === "labCovenant");
          assert.equal(labCovenants.length, 10, "Covenant should have 10 labCovenant items");

          // Verify each lab linked
          for (const labRecord of labs) {
            const labRefreshed = await Actor.get(labRecord.id);
            verifyLabCovenantLink(labRefreshed, covenant, assert);
          }

          // Render covenant sheet
          covenant.sheet.render(true);
          await sleep(200);
          await covenant.sheet.close();
        });
      });

      // ─── PLACEHOLDER: WIP FEATURES ──────────────────────────────────────────────

      describe("Work-In-Progress Features", function () {
        this.timeout(300000);

        // Test 6: Character↔Lab drag-drop (TODO in code)
        it.skip("Character↔Lab drag-drop: placeholder for future implementation", async function () {
          // TODO: This feature is marked as WIP in the codebase.
          // When implemented, test should verify:
          // - Character can be dragged onto lab sheet
          // - Lab owner field is populated with character
          // - Character sanctum field is populated with lab
          // - Constraints are respected (owner must be in same covenant as lab, if applicable)
          // - Old owner is unlinked when new owner is set
        });
      });
    },
    { displayName: "ARS : ActorLink testsuite" }
  );
}
