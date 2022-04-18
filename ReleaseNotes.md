## Release Notes

## 1.4.1

### Bug fixes

- Fixed formula computation resulting 0 when a die explode

### 1.4.0

### The Diedne war

A lot of knowledge was lost or hidden and forgotten, let's hope we can recover most of it....

### 1.3.2

Features

- active effects integration in the system (Ars Magica has its own class)
- advanced virtues/flaws with (limited) active effects
  - arts bonuses
  - arts affinities
  - abilities bonuses
  - abilities affinities
  - size
  - soak
  - characteristics
  - fatigue penalties
  - wound penalties
  - virtues and flaws having effects are in italic
  - readonly effects have a tooltip when hovering on their icon
- Rework of all dialogs design with new assets from @Sylph
- default config for active effect
- additionnal spell attributes (by Lanneval)
- updated French version (by Lanneval)
- penetration total computed during combat
- fun stress dice rolls options
- new abilities keys for the system to identify them.
- abilities options have all invalid characters removed automatically
- abilities modified by active effect have now a specific shadow
- added sub-tabs to the character sheets
- new sub-tabs for laboratory total (WIP)
- Add virtue/flaw types for laboratory and covenant virtues/flaws
  - Update item dropped filter to take the virtue/flaw type into account and only allow them to be dropped on the correct sheet type
  - Rename laboratory statistics to match the official names (with migration)
  - Split laboratory statistics into base value, bonus (calculated from active effects) and total
  - Add active effect type for laboratory statistics bonuses
  - Add calculation of laboratory derived statistics (occupied size, free virtues and base safety)
  - Create an active effect dynamically for the laboratory base safety

Bug fixes

- synthetic actors (unlinked scene tokens) are now also migrated.
- reduced font size of spells success/failure in chat
- soak modifiers/bonuses are not displayed in chat if zero
- disabled some input field to avoid artefacts on submit
- Puissant art wasn't taken into account for spontaneous magic
- Puissant art wasn't taken into account for magic resistance
- Casting totals are computed using the correct field for stamina
- Fixed undefined variable in case of dice rolls with callback
- Voice and gestures effects are no longer not found when an effect has no change at all.
- Fatigue levels again display the time to recover
- reduce english version of spell attributes so it doesn't bork the spell design sheet
- fixed a bug in migration where the lab owner value would be reset and break the link
- Fix a bug when computing magic resistance to spells with requisites
- remove the effect creation button for owned items (Foundry limitation, it gives an error anyway)
- prevent the edition of internal effects
- fixed a bug where it was impossible to edit an effect with voice or gestures as they were targetting the same key
- fixed very old display bug where the image footer was not exactly at the bottom of the dialog
- decrepitude and warping are no longer only computed by magi

### 1.3.1

Features

- Simplified installation and update through Foundry

Bug fixes

- Fixed problem with migration of equipment

### 1.3.0

Features

- V9 support (WIP, still backward compatible with V8)
- Reorganized Spells compendium with a folder per form (Recommended but optional module: Compendium Folders)
- Updated FAQ
- During migration, when guessing a spell attribute, it defaults to "other" instead of personal/moment/individual
- Rework of xp tracking for abilities (migration needed)
- Grogs compendium migrated
- Score field of abilities is now read only, but can be adjusted with buttons
- Number of items after filtering is now displayed in Codex
- Dropping an Item on an Actor will reset its "Actor's properties" if any. (eg: dragging a spell from a character to another will reset masteries, focuses )
- Lab texts dropped on Codex will convert into appropriate spell or enchantment.
- Spell lab texts dropped on characters will convert into spells.
- It is now possible to equip and unequip weapons and armors from the character sheet
- Reviewed weapons items with updated icons (by N0Br41nZ) and proper range
- Reduce the height of Codex title for more real estate
- Automatic soak and damage application during combat (by Ludo.Bermejo )
- Updated French translation (by Lanneval)
- New xp tracking for Arts
- Added log messages when changing the score of an ability or art (in case of misclick)
- New confidence management
- New botch managment
- Lot of localization in rolls
- Voice and gestures modifiers (by Ludo.Bermejo)
- Default characteristic for abilities (by Ludo.Bermejo)
- Drag and drop of items (spells/abitlites) in hotbar (by Ludo.Bermejo)

Bug fixes:

- Requisites dialog shows up properly.
- Fixed the use of deprecated getter in compendium migration.
- Harmonized Actors linking code
- Item properties linked to character (mastery, experience) are no longer displayed if not owned
- Fixed migration resetting magic skills selection.
- Spell levels are no longer computed if it is not migrated (prevent a bunch of errors in logs)
- Partly fix arrows of tab titles
- Codex enchantments are now properly filtered
- Localization of roll dialogs (botch check)
- Use a Foundry core method to detect if a version is newer that another instead of the existing shoddy one.

### 1.2.4 SP1

Features

- Spell compendium
- added an old portuguese version (by Ramon Alves)

### 1.2.4

Features

- multiple requisites support
- added Codex in Magi compendium filled with all base effects
- added abilities, virtues, flaws and equipment in compendiums (by jaircunhavianna and Dvergar)
- improved chat-messages
- new design for chat messages and rolls (by Sylph)
- improved design for pop-ups (removed the grey border, buttons matching background color)
- drop-down list to pick the original source material (by Nono)
- Dice rolls are now all aynchronous (ie: V9 ready)
- Improved migration (finally found out how to remove fields)
- casting total is now displayed in character sheets
- french translation update by Lanneval
- added a FAQ
- new system to handle drag and drop actors to other actors sheets (only to set covenants for the moment)
- all dialogs buttons are now properly localized (ie: translatable)
- Npc magi can have a house now
- added description field to covenant actors
- new way to open covenant members sheets
- covenants have labs/sanctums
- characters can have a lab
- labs, covenants and characters can be dropped on each other to assign their respective values
- new "Other" option for range, duration and target spell attributes
- spontaneous magic rolls makes the caster loose a fatigue level.
- dead characters are no longer able to roll
- unconscious characters are only able to roll characteristics rolls
- new "Rest" button to recover all fatigue levels
- PC and NPC now store soak and size at the same place (migration needed for NPCs)
- Soak field is now readonly and computed automatically based on stamina and equiped armor
- NPCs of type entity only have powers. Those only have a might cost and a form (for magical resistance)
- Vis sources and books now have their metadata available (sourcebook and page).
- Weapons items have now a range
- Integrated corebook grog templates (by N0Br41nZ)
- Reviewed armor items with updated icons (by N0Br41nZ)

- spells have now a "General" attribute used to compute the level.
- new filter options in Codex (>=, <=,...)
- Button to generate needed abilities for magic skills (renamed mnemonics for better tracking)

### Bug fixes

- fixed a bug where results of a stress die were always 0 on a 10 even if there was no botch
- fixed a bug in css for Codex where the title size was growing proportionally to the number of entries.
- combat rolls are now always a stress die as they should be.
- fixed a typo when guessing range causing error during migration
- removed some useless assets from previous design
- fixed the design of diary entries sheets
- fixed spell rolls with magical focus to multiply the correct art
- renamed "Possessions" list in covenant to "Properties and land"
- moved covenant Calendar to diary tab
- fixed magicaL focus casting total computation
- labels of covenant build points are properly displayed again.
- Fixed problem with Might type not saved for npc entities
- Fixed footer display problem in Codex
- Fixed remaing item sheets without image.

### 1.2.3

- fixed some errors during NPC migration because they don't have a familiar
- New base effects created in the Codex have the technique and form of the filters if set
- New enchantment item type (added to codex)
- It is now again possible to drop folders and from compendium on sheets
- lab texts are now of 3 types (Raw (free form), spell or enchantment) are sortable
- dropping a spell or enchantment on a covenant sheet will transform them into a lab text
- Design: added proper arrows to tab sheet where they were using the old design ones
- fixed a bug where "undefined" was displayed instead of the proper characteristic
- new setting to display and edit the source material and page if it applies
- It is again possible to drop Item in Codex
- Ritual rolls now include Artes Liberales and Philosophiae
- Ritual spells are now indicated as such in spells lists
- It is no longer possible to create enchantment based on rituals anymore.
- new arbitrary modifier field for rolls
- magical focus is applied to rolls
- Roll fields Aura, Modifier, Fatigue and Wounds are not displayed in chat-log roll entries if value is 0

### 1.2.2

- fixed magic rules enforcement setting for spells without base level
- button to create missing default skills
- changed release notes to be ante-chronological
- Arts Icons settings is now client based.
- Abilities, spells lists can be sorted

### 1.2.1

- Confidence for NPCs is back
- Ritual checkbox fixed.

### 1.2.0

- New design of all the actor sheets
- Support of Italian language.
- "Mights" have been properly translated to "Powers"
- NPCs don't have any confidence points anymore (as they should)
- Might of NPC has a realm now (magic, fae, divine, infernal)
- 2 styles of icons for arts sheet (symbols or gestures)

### 1.1.1

- Introduction of the Codex Hermetica

### 1.1.0

- Compatibility with Foundry VTT 0.8.x
- Overhaul of the data template

### 1.0.0

- Incredible overhaul from ialbiol! An update truly worth of a v 1, and now able to use official ArM5 core rulebook material by the kind permission of Atlas Games!

  0.2.1

- Fixed stress die explosions but can't get the characteristic or ability modifier to be auto-added to stress dice, so will display e.g. "4 \* (1d10 + 0)" if two ones are rolled in succession. Chat will show the correct multiplied roll, but it will not add the modifier to the roll. Stress dice rolls that do not explode DO correctly add the modifier, as do simple dice rolls, only exploding stress dice rolls are not working.

  0.2.0

- Implemented Stress Dice and Botch Mechanics when making Characteristic or Ability rolls from character sheet
- Removed non-Magus actor types until they can be properly implemented.

  0.1.7

- Re-did Virtues & Flaws as item entities.

  0.1.6

- Validated compatibility with FoundryVTT version 0.7.9
- Increased actor sheet profile image size to 256px
- Added support for Fatigue and Wounds. Will be improved in the near future, but functional.

  0.1.5

- Re-did Virtues & Flaws tab - still very much a work in-progress
- Updated header and tab font to Goudy Text MT Lombardic Capitals.

  0.1.4

- Corrected some description fields that weren't set as strings.

  0.1.3

- Fixed + buttons to add inventory/spells directly in character sheet.
- Modified header - moved Age (Apparent) up there and moved House down to a Magus-specific section in Description tab.
- Exposed remaining Magus-specific fields I had in DB but forgot to add to sheet (parens, primus, etc.)
- Added conditional logic to only display Magus fields on description as well as Arts tab on character sheet if actor type = magus.
- Renamed "Items" tab to "Inventory".
- Fixed warping, decrepitude, and reputation.
- Added book item type to support level, quality, type (summa/tractatus)

  0.1.2

- Corrected item template and spell template.

  0.1.1

- Corrected manifest. Added license.

  0.1.0

- Initial release.
