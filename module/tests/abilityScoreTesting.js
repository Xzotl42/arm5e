const MAX_SCORE = 10;
export function registerAbilityScoresTesting(quench) {
  quench.registerBatch(
    "Ars-AbilityScore",
    (context) => {
      const { describe, it, assert, after, before } = context;

      describe(`Normal ability`, function () {
        let actor;
        let item;
        before(async function () {
          actor = await Actor.create({ name: `Bob`, type: "player" });
          item = (
            await actor.sheet._itemCreate({
              name: "myAbility",
              type: "ability",
              key: "dowsing"
            })
          )[0];
        });
        describe("Add xps", function () {
          for (const score of Array(MAX_SCORE).keys()) {
            let inc = (score + 1) * 5;
            it(`Adding ${inc} to actor`, async function () {
              await item.update({ "system.xp": item.system.xp + inc }, { parent: actor.id });
              assert.equal(item.system.finalScore, score + 1, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 2), "xpNextLevel");
              assert.equal(item.system.remainingXp, 0, "remainingXp");
            });
          }
          after(async function () {
            if (item) {
              await item.update({ "system.xp": 0 }, { parent: actor.id });
            }
          });
        });

        describe("Add xp+1", function () {
          for (const score of Array(MAX_SCORE).keys()) {
            let inc = (score + 1) * 5;

            it(`Adding ${inc + 1} to actor`, async function () {
              await item.update(
                { "system.xp": (5 * (score + 1) * (score + 2)) / 2 + 1 },
                { parent: actor.id }
              );
              assert.equal(item.system.finalScore, score + 1, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 2), "xpNextLevel");
              assert.equal(item.system.remainingXp, 1, "remainingXp");
            });
          }
          after(async function () {
            if (item) {
              await item.update({ "system.xp": 0 }, { parent: actor.id });
            }
          });
        });
        describe("Add xp-1", function () {
          for (const score of Array(MAX_SCORE).keys()) {
            let inc = (score + 1) * 5;

            it(`Adding ${inc - 1} to actor`, async function () {
              await item.update(
                { "system.xp": (5 * (score + 1) * (score + 2)) / 2 - 1 },
                { parent: actor.id }
              );
              assert.equal(item.system.finalScore, score, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 1), "xpNextLevel");
              assert.equal(item.system.remainingXp, 5 * (score + 1) - 1, "remainingXp");
            });
          }
          after(async function () {
            if (item) {
              await item.update({ "system.xp": 0 }, { parent: actor.id });
            }
          });
        });

        describe("Increase score", function () {
          for (const score of Array(MAX_SCORE).keys()) {
            it(`Increase score to ${score + 1}`, async function () {
              await item.system._increaseScore();
              assert.equal(item.system.finalScore, score + 1, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (score + 2), "xpNextLevel");
              assert.equal(item.system.remainingXp, 0, "remainingXp");
            });
          }
        });

        describe("Decrease score", function () {
          for (const score of Array(MAX_SCORE).keys()) {
            it(`Decrease score to ${MAX_SCORE - score}`, async function () {
              await item.system._decreaseScore();
              assert.equal(item.system.finalScore, MAX_SCORE - 1 - score, "Final score");
              assert.equal(item.system.xpNextLevel, 5 * (MAX_SCORE - score), "xpNextLevel");
              assert.equal(item.system.remainingXp, 0, "remainingXp");
            });
          }
        });
        after(async function () {
          if (actor) {
            await actor.delete();
          }
        });
      });
      describe(`Affinity to ability`, function () {
        let actor;
        let item;
        before(async function () {
          actor = await Actor.create({ name: `Bob`, type: "player" });
          item = await actor.sheet._itemCreate({
            name: "myAbility",
            type: "ability",
            key: "dowsing"
          });

          item = item[0];
          await actor.addActiveEffect(
            "Affinity dowsing",
            "affinitySupernaturalAbility",
            "dowsing",
            1.5,
            null
          );
          // await magus.addActiveEffect("Puissant Muto", "art", "mu", 3, null);
        });

        describe("Increase score", function () {
          for (const score of Array(MAX_SCORE).keys()) {
            it(`Increase score to ${score + 1}`, async function () {
              await item.system._increaseScore();
              assert.equal(item.system.finalScore, score + 1, "Final score");
              assert.equal(
                Math.round(item.system.xp * actor.system.bonuses.skills.dowsing.xpCoeff),
                (5 * (score + 1) * (score + 2)) / 2,
                "xpTotal"
              );
            });
          }
        });

        describe("Decrease score", function () {
          for (const score of Array(MAX_SCORE).keys()) {
            it(`Decrease score to ${MAX_SCORE - score}`, async function () {
              await item.system._decreaseScore();
              assert.equal(item.system.finalScore, MAX_SCORE - 1 - score, "Final score");
              assert.equal(
                Math.round(item.system.xp * 1.5),
                (5 * (MAX_SCORE - score - 1) * (MAX_SCORE - score)) / 2,
                "xpTotal"
              );
            });
          }
        });
        after(async function () {
          if (actor) {
            await actor.delete();
          }
        });
      });
    },
    { displayName: "ARS : Ability score computation" }
  );
}
