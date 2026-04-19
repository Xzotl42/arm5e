export function getTopicDescription(topic) {
  let desc;
  switch (topic.category) {
    case "ability":
      if (topic.name) {
        desc = topic.name;
      } else {
        const ab = CONFIG.ARM5E.ALL_ABILITIES[topic.key];
        if (ab) {
          desc = game.i18n.format(ab.mnemonic, { option: topic.option });
        } else {
          desc = `"${game.i18n.localize("arm5e.generic.unknown")} ${game.i18n.localize(
            "arm5e.sheet.bookTopic"
          )}"`;
        }
      }

      break;
    case "art":
      desc = game.i18n.format("arm5e.scriptorium.msg.diaryTopic.art", {
        art: CONFIG.ARM5E.magic.arts[topic.art].label
      });
      break;
    case "mastery":
      desc = game.i18n.format("arm5e.scriptorium.msg.diaryTopic.spell", {
        spell: topic.spellName
      });
      break;
    case "labText":
      if (topic.labtextTitle === "") {
        return game.i18.localize("arm5e.generic.nothing");
      } else {
        switch (topic.labtext.type) {
          case "spell":
            desc = game.i18n.format("arm5e.book.labText.spell", {
              spell: topic.labtextTitle
            });
            break;
          case "enchantment":
            desc = game.i18n.format("arm5e.book.labText.enchantment", {
              enchantment: topic.labtextTitle
            });
            break;
          case "raw":
            desc = topic.labtextTitle;
            break;
        }
      }
      break;
  }
  return desc;
}
