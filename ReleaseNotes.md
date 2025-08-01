## 2.4.0.9, Radislav am Polanach

### Compatibility change

- Foundry VTT V12+ only

### Features & changes

- [Technical] Switch to V12
  - Use of TypeDataModel instead of DataModel for Document types
  - Removed of V10 only code.
  - Removed V12 deprecation warnings
- [Technical] Code clean-up, factorization, encapsulation
  - Actor data preparation clean-up => prepareBaseData and prepareDerivedData in Datamodel
  - Item data preparation clean-up => prepareBaseData and prepareDerivedData in Datamodel
  - Most setters have been split in 2 parts for easy macro operations:
    - \_setProperty: list data fields to update or create.
    - async setProperty: calling the above and update the document accordingly
- [Technical] ChatMessage datamodel with sub-types for rolls, combat, spells
  - Easier update, allowing recreation from scratch.
  - Improved confidence spending
  - New magic roll chat messages
- [Technical] removal of some duplicate unused id attributes
- [Technical] V13 compatibility (WIP)
- Dropping a magical effect on a lab will switch the activity to spell invention.
- Dropping a book's lab text topic from an Actor library on to a lab will now work
- Gift type of magi inhabitants is set automatically if they have Gentle Gift or Blatant Gift.
- Arts and abilities active effects definitions are generated dynamically
- New active effects:
  - Reading about Art (Study bonus)
- [technical] Speed optimization all over the place - on going
- It is again possible to switch between spell invention and spell learning without resetting the spell's attributes.
- [technical] the Astrolabium is now a singleton (ie: only one window exists)
- It is possible to progress in alternate arts in seasonal activities (as abilities)
- Added physical condition modifier (@physicalCondition) to rollData, to be used in inline rolls
- Cosmetic changes:
  - bigger icons
  - better spacing
- Codex has been migrated to V10 datamodel.
- Codex now allows to browse and filter the content of ars-compendia base effects and spells without importing everything.
- Arcane experimentation dialog.

### Bug fixes

- Power form and cost change is now possible on unlinked token
- Empty ability option will be ignored and restored to original value instead of "OptionName".
- Fix error on botch when casting spells
- Adding boons and hooks opens the correct compendium
- Adding lab virtues and flaws opens the correct compendium
- Added back the possibility to create new virtues and flaws for some Actor types with an unfurnished compendium.
- Qualities and inferiorities were not displayed properly for entities
- Fix problem with ability rolls for actors without twilight
- Submit was not awaited for in some sheets (mostly lab sheet), this would cause a reset to previous value after edit on heavy loaded systems or higher latency games (Forge,...)
- [technical] With datamodel inheriting from TypeDataModel instead of DataModel, the type field was ignored at creation. Adding a toObject() fixes the problem. (eg: conversion of spell into labText)
- Failed casting message was not displayed properly for Mythic blood characters
- Fixed error with group schedule activity creation in the Astrolabium
- Clicking on the dice icon of a spell sheet no longer tries to cast it spontaneously
- Removed some noisy errors when closing some applications
- Fixed techniques filter
- Event and actions loyalty modifier can now go negative
- Mundane scholar profile is working again.
- Rolling a magic effect from its sheet no longer consider the effect a spell.
- [Dice so nice] The system will let the animation finish before anouncing a die explosion or asking the number of botch dice.
- Form is properly taken into account when resisting power and magic item effects
- Ability option clean-up leaves capitalization as is.
- Botching during vis study can now trigger a twilight episode.
- Filters based on a numerical value are working again.
- Enchantment capacities are computed properly.
- Drop an compendium item on the lab will work the first time.
- Generic abilities score is properly displayed in diary entries
- Fix button to create new Qualities and Inferiorities on the character sheet.
- Added a few missing sourcebooks and the "other" one
- Physical condition is taken into account when rolling initiative from combat tracker.
- Roll icon doesn't appear anymore for spells not owned by a character
- Chat rolls with stress die resulting in a botch are clearly indicated
- Health attribute of the lab is taken into account for aging rolls.

## 2.3.2.28, Quendalon, more than just sparows and bunnies

### Features & changes

- Arts and abilities active effects definitions are generated dynamically

### Bug fixes

- Negative values are again taken into account for covenant events loyaty.
- Longevity ritual cost is computed properly.
- Longevity ritual for another person is no longer generating an error.
- Characteristic boost applied 2 times no longer result in undefined value.
- Effect requisites are properly reset when switch from spell invention to longevity ritual or item investigation.

## 2.3.2.27, Quendalon, more than just flowers and bees

### Bug fixes

[technical] Added an await to some submit calls that were missing it.
[Dice so nice] The system will let the animation finish before anouncing a die explosion or asking the number of botch dice.
Legacy magic item migration will ensure that the enchantments parameters are valid before converting to an enchanted item.
NPCs now have a spell totals tab too.
Changing an ability key to a generic ability will fill the ability option with a placeholder.

## 2.3.2.17, Quendalon, back from the wood with weird eyes

### Features & changes

- Powers can change their cost or form on use
- Powers inherit the Form of the creature using them by default.

### Bug fixes

- Fix power migration error.
- Ability-option migration no longer remove dashes
- Generic abilities without an ability option get a new randomly generated one.

## 2.3.2.16, Quendalon, lost in the forest for a year

### Features & changes

- Added more detailed description for base individual of a Form (@scribes)
- Bonus to abilities and arts score are no longer taken into account for learning, teaching and writing.
- New active effects:
  - Intelligent (for beasts)
  - Override the number of warping points needed to trigger a twilight
  - No fatigue when short on casting total (Mythic blood)
  - No fatigue on ritual casting if successful (Mythic blood)
- Spell casting, powers and magic items use chat messages are now merged when possible (failure,magic contest)
- Twilight episode's management
-

### Bug fixes

- Fixed another bug with character sheet date
- Changing the realm of an entity will work all the time.
- Rituals consume a fatigue level, even if succeful.
- A wound is properly created in case of ritual major failure
- Artes liberales and philosophy labels are again displayed properly when casting rituals.
- Aura modifier of actor with Might no longer raises an error.
- Rolls that were supposed to not be impacted by physical condition (wounds, fatigue) sometime were
- Removed unused scrollbar that was causing flickering on mouse hover in some dialogs

### V10 datamodels migration (almost done)

- New data models activated
  - Powers

## 2.3.2.12, Quendalon, lost in the forest since half a year

### Features & changes

- Put biography higher in description tab.
- New Qualities and Inferiorities Item's types
- New Active Effects
  - Cunning bonus
  - Characteristic upgrade
  - Ability upgrade (limited list)
- Weapons keep the ability used, even when they change hands.
- Added initiative to powers
- [technical] Automatic slugification of indexKey

### Bug fixes

- Creation mode is now working for NPC and Beasts.
- Character '-' is now allowed in ability option key
- Artes liberales and phylosophya were not taken into account in the casting total of the character's list of spells
- Magic items use works again.
- Bonus XP is also possible for Heartbeast skill

## 2.3.2.10, Quendalon, lost in the forest the whole winter

### Features & changes

- New add button instead of create wherever appropriate in character sheet will open the corresponding compendium.
- New icons for the new DE abilities
- Theology has become a generic ability
- Abilities icons color lightened a bit to be seen on a black background.
- New flag to match option field of abilities items with the name.
- New longevity ritual activity
- New creation mode.
- Raised the minimum module version, you get a warning if you don't update it too.

### Bug fixes

- Setting a non-magus as the owner of a lab will no longer prevent its opening.
- Lab activity should not reset to a simple data object in some rare cases
- Ensure that the current date is set properly at start up or set it to spring 1220.

## 2.3.2.6, Quendalon, lost in the forest for a month

### Features & changes

- Tracking of resources (vis) among Actors
  - New activity : Resource tracking
  - New setting to enable the tracking
- New "Academic" category for reputations
- Added the whole system property to the rollData object ("raw").

### Bug fixes

- It is possible to use core Foundry active effects on tokens again.
- Fix weird bug for setting current date.
- [V11] Fix problem with unknown workspace for Die types
- Typos in some sourcebooks names

## 2.3.2.4, Quendalon, still lost in the forest

### Features & changes

- New alternate stress die roll (/r Xda , where X is the number of botch dice).
  - Configurable in the settings
- A few cosmetics changes left an right.

### Bug fixes

- It is now possible to roll for magic without any active scene
- Fix for the migration of tainted virtues and flaws.

## 2.3.2.3, Quendalon, still lost in the forest

### Bug fixes

- Fix critical bug with spell parameters filters

## 2.3.2.2, Quendalon, still lost in the forest

### Features & changes

- Added social status subcategories
- Removed tainted category of virtues and flaws.
- Added a new "Tainted" flag to Virtues and Flaws

### Bug fixes

- Fix sourcebooks filters duplicates
- Sourcebooks filters were not applied properly on new worlds

## 2.3.2.1, Quendalon, still lost in the forest

### Features & changes

- Improved metadata section
  - Better UI
  - Added metadata to actors and items which were missing it.

### Bug fixes

- [V12] Fixed problem where it was impossible to select Definitive Edition or Homebrew in the source

## 2.3.2.0, Quendalon, lost in the forest

### Features & changes

- Updated pt-BR version
- Preparation for the open license release
  - New field for Items to indicate review status
  - Review status added to the index of arm5e-compendia compendia for quick queries
  - New Open License logo
  - Updated readme file for legal aspects of the Open License
- New active effects
  - Enable new magic system.
- Hedge/holy magic system
  - alternate Arts
  - template for casting
- New checkbox design
- [technical] Moved abilities localization in "i18nInit" Hook
- Supernatural, arcane and mystery abilities can be accelerated.

### Bug fixes

- Comprendia reference dialog has been fixed

## 2.3.0.12, Quendalon, raised by the Fae BF4

### Compatibility

- Verified for V12.331

### Features & changes

- Updated French version
- Some cosmetic improvements for chat stress dice

### Bug fixes

- Fix requisites editing on roll
- Applied activities can no longer have their type changed.
- Fixed bug in sanatorium V12 when changing the data.
- Virtues and flaws are working again on beast sheet
- Vis source attributes are visible again
- Quick dialogs (Vitals, Combat, Magic) are now updating when the linked character changes (V12 only)
- [V12] Changed actor links mechanics since appId of a sheet is only defined on render (instead of constructor).
- Covenant laborers were wrongly considered servants
- Covenant teamsters were not considered workers.
- It is possible again to go to previous topic of a book in scriptorium
- Missing spell warning is now properly formated in scriptorium
- Multitopic book reading was not working after a change to the dialog data (reader, date, ...)
- There is no longer an error when you try to read an ability book you are too skilled for.
- Stress die in chat
  - Proper number of botch dice rolled
  - Exploding rolls are computed properly

## 2.3.0.10, Quendalon, raised by the Fae BF3

### Bug fixes

- Fixed critical bug where all diary activities created from outside the sheet where reset to standard diary.
- added new handling of the regio levels field when it is not a number during migration.

## 2.3.0.9, Quendalon, raised by the Fae BF2

### Bug fixes

- Proper migration fix for the aegisCovenant field

## 2.3.0.8, Quendalon, raised by the Fae BF1

### Bug fixes

- Servants needed were not computed properly
- Teamsters needed were not computed properly
- Savings from craftsmen was not computed properly
- Few cosmetic fixes
- added new handling of the aegis field when it is not a number.
- Rounded base loyalty
- user-cache was retrieved 2 times for covenants, overwritting configuration of filters.
- Magus inhabitant gift type can no longer be blank

## 2.3.0.7, Quendalon, raised by the Fae

### Compatibility

- V12 ready ( 12.330 verified )

### Features & changes

- Covenant data model migration
  - moved mnemonics to config
  - cosmetic improvements
  - build points computation
  - loyalty computation
  - Expenses and savings
- Active effects for Actors are now filtered
- Covenant's labs and inhabitants can have active effects
- New active effects for covenants
  - build points
  - habitantPoints
  - expenses
  - savings
  - magic item modifier on covenant stats
- Virtues, flaws, boons and hooks have now a new attribute "hidden" making them only visible by the GM
- Active effects have a new hidden flag
- Inhabitants lists are foldable
- Folded state of abilities and inhabitants lists is stored in the user-cache.

### Bug fixes

- Dropping a lab text in the "learn spell" workbench won't raise an error anymore
- Form bonus to soak mundane damage was incorrectly rounded down.
- Fix drop down menu in soak dialog for Form bonus.
- Added "apprentice" data structure to npc template.
- Fixed display problem with enchantments lab texts.
- Supernatural abilities sheet is no longer raising an error.
- Fixed typo in "craftmen" to "craftsmen"

## 2.3.0.3, Quendalon

### Compatibility

- V12 ready ( 12.327 verified )

### Features & changes

- Covenant data model migration (on going)
  - first draft (not active)
  - moved mnemonics to config

### Bug fixes

- Fix apprentice intelligence equals to null during migration
- Rolls on beast sheet are possible again
- Penetration bonuses are computed properly again
- Fix Cunning label on beast sheet

## 2.3.0.1, Quendalon

### Compatibility

- V12 ready ( 12.327 verified )

### Features & changes

### Bug fixes

- Fixed display bug of Scriptorium and Astrolabium
- Fixed migration error for reputation and personality traits

## 2.3.0.0, Quendalon

### Compatibility

- V12 ready

### Features & changes

- [technical] migration of select helper to selectOptions

### Bug fixes

- [technical] Rework and cleaning of active effect config dialog

## 2.2.4.24, Pralix, founder of a new House

### Dependencies updates

- arm5e-compendia module minimum version 0.3.3

### Features & changes

- New copying tab in the scriptorium.
  - Summa copy
  - Tracactus copy
  - Lab texts copying
- Practice base XP is now editable.
- Updated French version by @orneen
- New Brazilian Portuguese version by @Gabriel Mendes
- Updated French version by @orneen
- Casting stances are now available in the roll dialogs.
- It is now possible to "use" a magic item's power
- Physical items that are enchanted can now have active effects.
- it is now possible to do individual copies instead of putting everything in one book.
- Abilities specialties can be taken into account when writing or copying.
- Simplified rollData for easier inline rolls
- Most of the text editor fields are now enriched, allowing inline rolls, content-link, etc.

### Bug fixes

- Supernatural abilities cannot be learned from scratch with a book.
- Writing activities with long duration have their dates set properly.
- Players are able to drag and drop actors they own and books they have access to in the Scriptorium.
- Some cosmetics changes
- Encumbrance is now properly displayed in the description tab.
- Sourcebooks filter for "Ancient Magic" had a typo, it is now fixed.
- Non-interactive rolls (eg: recovery) with [Dice so nice] are rolling dice again
- Recovery logs are now displaying the correct bonus when rolling for botch.
- [technical] added foundry.utils namespace whenever appropriate (first pass)
- [technical] replace {{#select }} handlebars helper with {{selectOptions}} (134 remaining)
- [technical] relocated and renamed rollData to rollInfo.
- When drag and dropping book topics from an actor's library, the correct topic is dropped.

## 2.2.4.17, Pralix, founder of a new Order bis

### Bug fixes

- Fix missing migrate function for vis source

## 2.2.4.16, Pralix, founder of a new Order

### Dependencies updates

- arm5e-compendia module minimum version 0.3.1

### Features & changes

- New general generic ability : Lore
- NPCs now also have their library tab
- Books topic on an ability will now have a dedicated field for the ability's name.
- New active effects:
  - Aura modifier for lab.
  - Might score modifier
- [meta] new method for datamodel schemas : sanitize
- Improved management of hidden effects in magic items
- Item investigation activity
- New icon to harvest covenant vis sources

### Bug fixes

- Quality of writen tractati is computed properly
- Missing translations added
- Teamsters are again displayed in the covenant inhabitants.
- Lab size attribute is now computed properly.
- partial fix on pending xp
- Edition of the generic lab modifier is again possible in the labTotals tab
- Rolling for soak now helps against damage
- Expiry is again visible in enchantment sheet.
- Shape and material bonuses are properly reset now.

### V10 datamodels migration (on going)

- New data models activated
  - Vis source

## 2.2.4.11, Pralix, the Spider's bane

### Bug fixes

- Fix damage application error.

## 2.2.4.10, Pralix, filia Tytalus

### Features & changes

- Clicking on the icon of an active effect will display its sheet.
- Cosmetics changes and GUI improvements
  - Larger area to create new embedded documents
  - Possible to roll an ability, spell from their sheet.
- Additional requisites on roll for spell and magic effects.
- Rolling for damage
- Blank books
  - new section in library tab with a list of physical books
  - Default state of books created as enchantments
- [Warning] Compatibility with mono-topic books from V9 has been removed, migrate any old data before updating.
- It is now possible to write a new topic to an existing book.
- Possible to generate a draft laboratory text from enchantments and spells
- Translation of character's draft lab texts.
- New default icon for writing activity
- Improved actor profiles

### Bug fixes

- Removed dead links on Forms icons
- Not possible anymore to click the "Create activity" button without a writer.
- Covenant inhabitants
  - New turbula section to replace grogs
  - dependants are again displayed in the Inhabitants section
  - Points are readonly for now and based on the role.
- Confirmation of book topic deletion is taken into account again (ie: saying no will have an effect)
- Fixed the book topic filter
- Ability keys categories are again more distinguishable
- Dropping items on the lab sheet is working again
- Another round at fixing the lab owner setting, introducing the "None" activity category.
- Covenant inhabitants fixes

## 2.2.4.4, Pralix, filia Guorna the Fetid

### Features & changes

- Complete Scriptorium overhaul
  - New writing activities
- Added macros to open canvas menu dialogs (Scriptorium, Astrolabium, Aura management)
- Rework of Reading tab in Scriptorium
  - Possible to browse the topics of a book in the scriptorium.
  - Improved generic ability handling
- Items allowed to be created in the sidebar have been filtered to remove deprecated ones or the ones which make no sense to exist independently (a reputation, a wound, a covenant inhabitant)
- New container actor.
- Added quantity and price to all physical items (even if it is not visible for some)
- Books topics have their own authorship parameters (name, language, date)
- Books as magic items
- Actor links optimization and fixes
  - Reduction of the number of individual updates
  - Proper deletion of old link in 1:1 relationship

### Bug fixes

- Changing the topic of a virtual book in the Scriptorium no longer raise an error.
- Lab texts are no longer applicable in the scriptorium.
- Transfer of part of an physical item stack now properly updates the original stack
- Spell parameters are again properly filtered by the sourcebook setting in all sheets with effect
- Collaborating on the lab sheet is again possible.
- It is again possible to edit the lab aura when not part of a covenant with one.
- Fixed some problem with the laboratory totals tab when linked to a lab.
- Drop a new owner on a lab will reset the lab.

## 2.2.3.28, Ophilio, the Elder

### Bug fixes

- Transfer of part of an physical item stack now properly updates the original stack
- Spell parameters are again properly filtered by the sourcebook setting in all sheets with effect
- Collaborating on the lab sheet is again possible.
- It is again possible to edit the lab aura when not part of a covenant with one.

## 2.2.3.27, Ophilio, old

### Dependencies updates

- arm5e-compendia module minimum version 0.2.6

### Features & changes

- Retrieve generic abilities from ref compendia even with an unkown option

### Bug fixes

- Covenant UI flavor has the proper case
- Diary sheet fixes:
  - It is no longer impossible to add a skill in a diary entry if you have animal handling.
  - You can again add an ability progress item with a virtual teacher
  - Added some robustness, the + sign fro progress items will disappear if all possibilities are exhausted.
  - Generic abilities learned from a teacher are set properly.
  - Spells tab is no longer visible in teaching activities (until it is implemented)
  - bunch of small fixes

## 2.2.3.25, Ophilio, getting old

### Features & changes

- Put the "Apply/Rollback" button as visible in all tabs in diary sheet

### Bug fixes

- Partial fix of aging crisis roll
  - no errors on click
  - Medical assistance is properly removed from the roll instead of added.

## 2.2.3.24, Ophilio, prime years

### Features & changes

- Added notification warning if arm5e-compendia module version is below minimum

### Bug fixes

- Fixed name and description of diary entry causing errors on scheduling.

## 2.2.3.23, Ophilio, even less young

### Features & changes

- Cosmetic changes to enchanted item's sheet
- Lab texts sheet rework to match other magic effects sheets
- Dropping a lab text on an Actor's sheet no longer add it as an effect but add it in inventory.
- Drag and drop support of effects/enchantments/spells on the lab workbench
- Verditius magic taken into account for shapes and materials bonuses.
- Charged Items creation in lab.
- Shapes and materials browsing via the Codex

### Bug fixes

- Core status effects don't prevent the roll of dice anymore
- Aging rolls of 10 are again counting as 0.
- Crisis rolls are also taking into account the diary date instead of the current date.
- Documents dropped on the hotbar have the proper macro name "Display <documentName>"
- Removed dependency to arm5e-compendia at documents' initialization so higher latency servers don't raise an error.
- Migration no longer fails migrating effects of invalid actors
- It is again possible to add abilities during a teaching or training activity

## 2.2.3.19, Ophilio, less young

### Dependencies updates

- arm5e-compendia module minimum version 0.2.3

### Features & changes

- Updated userguide (markdown only)

### Bug fixes

- Fix on V10 for enchanted items.
- It is no longer needed to reopen or re-render an enchanted Item sheet for the enchantments section folding to work.
- Auras are working again properly.
- Fix migration of magic items and already migrated ones.

## 2.2.3.17, Ophilio, once young

### Dependencies updates

- arm5e-compendia module minimum version 0.2.2

### Features & changes

- [technical] Verified for V11.315
- [technical] better handling of inter-actor links, cleaner code, faster actor load.
- Simplified abilities and spell masteries xp display
- new design for input fields
- Items can now be enchanted
  - new Enchantment schema
  - Extension of the sheet for enchantable items.
  - Complete design of all enchantments types
  - Edition of enchantments in the magic item sheet.
  - Drag and drop of Spells and Magical effects on enchanted item sheet
  - Bigger area to drop
  - Dropping an enchantment on an enchantable Item will appraise it automatically.
  - Added authorship
  - Vis costs
  - Migration of legacy magic items
  - Pick the type of enchanted item
  - Filter shape and material options based on the Sourcebook filter setting
  - link an enchantment effect to a particular size and material (capacity)
- [technical] rework and factorization of the foldable sections code
- [technical] converted larger png assets into webp + userguide update of image links
- [technical] new framework for lab activities for factorization purposes
- Hotbar improvements
  - Actors and Items have the correct icon used.
  - Items in the sidebar are accepted.
- Added generic ability for academic, arcane and martial category.
- User based cache of the section folding state.
- It is now possible to edit the begin date of a long duration event (warning: all remaining seasons will be sequenced from that one)
- New lab activity: Minor enchantment
  - It is now possible to schedule lesser enchantments in the lab
- New limited sheet for covenants and laboratories
- New active effects
  - Optional bonus on rolls
- Free choice of abilities in long term activities (ie: character doesn't need to have it to progress)
- New total for spell masteries xp.
- Updated French version by Orneen
-

### Bug fixes

- Fixed important item migration bug
- Covenants can no longer equip weapons and armors
- Fix vis study activity
- Schedule and activity sheets no long pop out on date change.
- Clicking on an activity in the Troupe Schedule dialog won't create an additional diary entry.
- Fix Recovery rolls on V10
- Fixed error in macro creation
- Fixes on diary entries
  - Capped spell masteries based on teacher score
  - Fixed rollback of capped masteries.
  - Remove xp multiplier from progressed xp.
- Actor age is now changing properly when the date changes.
- It is no longer possible to roll for aging unless a year of birth is set (it defaults to 1200 at creation)
- Aging rolls are computing the age modifier based on the year of the diary entry instead of current year
- Penetration spell mastery is now properly added to the penetration score.

## 2.2.2.20, Nico

### Features & changes

- [Technical] Verified for versions: 11.313 and 10.312

### Fixes

- Compendia indexes are computed later as they were not ready in V10
- Active effects are again editable in V10
- Fixed background size in dialogs
- Fix dates reset of diary entries

## 2.2.2.18, Nico de Mu

### Features & changes

- New aura management
- Players can now toggle effects
- New French version (by Orneen)
- [technical] HTML and CSS refactoring and cosmetic improvements
- Multi-realms alignments with updated Active Effect
- [technical] Verified for Foundry V11.311
- Improved spell design dialog
- New active effects for "Flawless magic" virtue
- [technical] Added lot of test coverage to the diary entries, code factorization and simplification.
- Added apparent age in the limited actor sheet
- Added a new "Player's name" field on actor sheet
- [technical] Removed unused compendia of the system.
- Added new mandatory module dependency : arm5e-compendia
  - New setting to set your reference compendia module
  - Added indexKey to all Items and include them in the compendia index
- New GM actor profiles to quickly add abilities to an actor.

### Bug fixes

- Obsolete active effects are now properly deleted from synthetic actors (unlinked) - V11 only
- Duplicate V11 effects are now deleted properly
- Wounds of synthetic actors are now migrated properly
- Casting total is now rounded before checking for failure.
- Effects coming from the same duplicated Item (eg: dragged from Compendium) are now properly distinguished in Actor sheet.
- Changing the type of roll from characteristic to ability computes totals properly
- Fixed source and page of Virtues Items in the system compendium
- Changing ability in a teaching activity computes the teacher score properly
- Fixed typo in "writting" activity bonus in existing active effects
- Active effects on Items are now migrated properly
- Spells learned through seasonal activities are now cleared of their mastery level and bonuses.
- Fixed icon size problem in Codex
- Added missing Soak bonus, if any, in the combat tab.
- Affinities are taken into account when checking if the student will overcome the teacher
- Fixed the case of some assets that were not loading under Linux.

## 2.2.2.6, Nicodemus Ex Miscellanea

### Bug fixes

- Ritual magic now adds the proper number of fatigue levels
- Fixed bug with Dice So Nice integration where rolling for botch always seemed to result in one.
- Spontaneous casting without casting now displays its chat message respecting the roll mode instead of always private.
- Fixed migration bug in V11 where effects coming from Items were kept duplicated.
- Improved migration for unlinked tokens
- Effect tab displays all applicable effects
- Changing aging point no longer raises an error.
- It is not possible anymore to delete active effects belonging to Items on the actor sheet.

## 2.2.2.2, Nicodemus crippled by Twilight

### Features & changes

- Actors no longer have an individual date, only the world's date is the reference.
- As a GM it is now possible to edit the dates of an applied activity
- Age is now computed using the birth year (or default to 20)
- New active effect to change the effective age
- Added quantity of items in inventory tab.
- Edition of transferred active effect (eg: from a virtue or flaw) is now possible (V11 only)
- Vis extracted from aura is now dropped in the lab inventory
- Trusted players can now edit and create active effects
- new logo for Ars Magica system and worlds

### Bug fixes

- Aura manually entered for a casting is no longer ignored
- Fixed a typo to a \_getSourceName() call in V10 when displaying character sheet
- Checkbox to equip / take off weapons and armors from the character sheet is back
- It is again possible for players to drop teachers on a Teaching activity sheet
- Fixed typo in Good Teacher virtue active effect

## 2.2.1.0, Nicodemus

### Bug fixes

- Removed V11 database files
- Some migrations issues in book schemas and diary schemas were fixed

## 2.2.0.2, Nicodemus ex Jerbiton

### Bug fixes

- Fix typo for V10 compatibility
- Fix corrupted png files

## 2.2.0.0, Nicodemus the apprentice

### Features & changes

- V11 compatibility
  - localization strings
  - Active effect label and icon fields
  - Token delta instead of actorData
- Visual hint that a spell is mastered.

### Bug fixes

- Tractatus no longer have a level of 1 by default, preventing readers with a score to read them
- Changing a book from summae to tractatus reset the level to 0.

## 2.1.1.11, Mercere, the Legacy

### Features & changes

- Added missing effect for recovery rolls to appropriate virtues and flaws.

### Bug fixes

- Changed incapacitated penalty to -99 instead of 0 for consistency
- Date for next recovery is now computed properly

## 2.1.1.10, Mercere, the Legend

### Bug fixes

- Setting the world's date back in time when actors are already in the present doesn't currupt activities anymore.

## 2.1.1.9, Mercere, the Spymaster

### Features & changes

- New sanatorium dialog for wounds recovery (assets by @Sylph).
  - Wound are now items.
  - Recovery date is picked automaticaly as the oldest treatable wound which is not in the future
- Calendar scrollbar state is memorized between changes
- It is possible to edit the duration of some activities
- New medical history dialog
- It now possible to cummulate higher sympathic link bonuses for penetration

### Bug fixes

- Non-supernatural abilities that had a realm alignment are no longer impacted by aura.
- New French, Spanish and Italian versions by @Orneen, @Teotimus and @N0Br41nZ
- Fixed some schedule conflict issues
- It is now possible to enable magical focus when learning spells
- Empty aura field results in aura of 0
- Seasonal activities not created directly (eg: aging, recovery, lab work) are now hidden in diary sheet's activity type selection
- non applied activities get back their red aura in the schedule dialog.
- changing the activity type to a shorter duration remove the extra scheduled dates
- It is again possible to access the schedule of beast Actors
- Using <Enter> key after entering the number of botches will no longer raise an error and instead submit it properly.

## 2.1.0.18, Mercere, the Giftless

### Bug fixes

- The realm of the covenant aura is now properly taken into account for lab work and vis study.
- Fix major bug in xp computation of ability with affinity
- Characters incapacited can only roll for characteristics

## 2.1.0.17, Mercere, the Magus

### Features & changes

- Overhaul of the aura active effects
  - auras now impact rolls of supernatural abilities
- Spell invention activity is now temporary allowed to have duplicates in the same season
- It is now possible to delete a owned diary entry from its sheet.

### Bug fixes

- [technical] Removed a memory leak in astrolabium lifecycle
- Characteristic rolls are again impacted by wounds and fatigue penalties
- Dropping a new token on the canvas now properly apply an aura effect if any
- Gestures and voice spellcasting stances are now properly computed when under active effect.
- [technical] refactoring of activity conflict detection + enhanced non-regression tests.
- Fixed event filters

## 2.1.0.14, Mercere, the Founder

### Features & changes

- Related actors (character,covenant,sanctum) are notified when one is updated.
- Small cosmetic improvements left and right.

### Bug fixes

- Fixed overflow problem with prosemirror editors left and right
- Fixed case problem in the intrigue ability default icon
- It is again possible to edit auras
- Drag and dropping Items on Covenants, NPCs and Beasts sheet no longer raises an error.
- Drag and dropping Items with a non-default icon no longer reset them to the default one.

## 2.1.0.12, Mercere, first to join

### Features & changes

- Magic Codex migrated to V10 datamodel
- Magic Codex using filters based on the Foundry user data, not the Actor itself
- [Technical] Factorization and generalization of user-cache management for filters
- Reading books and study vis from actor sheet.
- Filters for book topics
- Cosmetic improvements left and right
- New setting to reset the user cache (sheet filters)
- Updated French version by orneen
- Filters for diary entries
- New custom icons for abilities, activities, vices and virtues (thanks to Nestua)
  - Updated compendiums accordingly
- Multi-seasons activities (spell invention)
  - Scheduling
- Select on focus for input fields
- New character schedule app
- Displaying a sheet will also set the focus on it and bring it to front if already rendered
- Covenant inhabitants migrated to V10 datamodel
- Season distractions in lab's work
- New setting to enforce schedule constraints
- New setting for starting the year in winter.
- Active effect to change the age a character starts aging (eg: strong faerie blood, curse, spell)
- New troup schedule dialog to see the activities of a group of characters during the year
  - With filters
- [Technical] hundreds of non-regression tests added for scheduling.
- Updated French version by Orneen
- Updated Portuguese (BR) version by Ramon Alves
- Impossible to apply activities ending in the future
- Changed the default behavior when dropping physical items from an actor to another:
  - item will be transfered after confirmation
  - If there is more than one item, ask for the quantity to be transferred
  - Previous default behavior is still available using shift.
- Aging and vis study rolls create instead a diary entry that need to be scheduled
- Activities with roll (eg: aging) are applied by rolling.
- Basic Simple-Calendar integration
- Better confirmation dialogs
- Armors, weapons, vis and items can now be created/dropped on the covenant sheet.
- visStockCovenant item type was deprecated and replaced by vis type.
- Warping added on aging roll if there is a longevity potion effect
- It is not possible anymore to change the date of an actor to the future.
- [technical] migration to ProseMirror editor
- New "rest everyone" button in Astrolabium
- Calendar is now notified if the world's date changes
- Quick item's description on right click
- Prevent activity's application if there one unapplied ending before it.
- Setting the world date in the past will put the actor's date back to that date if it is now in the future.
- Added Diedne house to the list of Hermetic Houses
- Delay rolling and checks for activities validity to when they are applied
- New active effect to add a flat bonus to xp to supernatural abilities (via Supernatural virtues)

### Bug fixes

- Unlinking the reader is working again in the scriptorium.
- Creating a book from a character sheet won't generate an error anymore.
- Fixed problem with exploding 10 rolls were counted as 0.
- It is possible again to roll dice in the chat using /r
- Powers are working again:
  - Omitting the roll type will properly use the correct one
  - Spellcasting stances are only for magi.
- Personality rolls add the personality score properly
- Fixed aging rollback bug, where characteristic was increased instead of decreased
- Fixed warping reset bug in some cases
- Changing the trainer/teacher score will update it in the other tabs
- Dropping a magus or companion on a covenant sheet will add them properly as members

### V10 migration (on going)

- Data models activated

  - Abilities
  - Books
  - Virtues & Flaws
  - Mundane items
  - Vis
  - Base effects
  - Spontaneous effets
  - Spells
  - Laboratory Texts
  - Magical effects
  - Diary entry
  - Laboratory
  - Magic Codex (new)
  - Reputation
  - Personality trait
  - Armor
  - Weapon
  - Covenant inhabitants (new)

## 2.0.5.21, Lexora, the maga

### Features & changes

- Warning if the character is wounded in the lab planning tab
- Drag and drop sorting for virtues, flaws, items, vis, armors, weapons, ...basically everything which isn't sorted yet.
- Armor and weapons added to combat tab of NPCs

### Bug fixes

- Fix computation of the number of pawns of vis extracted from aura
- Aura is no longer read only in the lab planning tab after unlinking the covenant
- Covenant Aura was not taken into account in some cases.
- It is again possible to set auras with the GUI
- Migration:

  - clean up of obsolete active effects takes into account Foundry core ones.
  - Prevent an error when attempting to clean up effects of an invalid character.

- [technical] Switched assets paths to relative paths

## 2.0.5.17, Lexora, the apprentice

### Features & changes

- New diary lab activity type (used in labs for tracking for now, but later for lab improvement activities)
- New Vis extraction lab activity
- Reputations are now Items with XPs
- Warping on botch with magic
- [technical] put increaseScore and decreaseScore methods in their respective schemas, cleaning up item.sheet
- Personality traits are now Items wit XPs
- Common law and Canon and Civic law have been merged into a new generic ability: Law
- New macros for quick access to combat and vitals stats of selected token
- New design for journal links
- Diary entries are now also sorted in inverted alphabetical order of date field before title.
- Changing a reader's Actor sheet will reflect in the scriptorium.
- Longevity ritual bonus moved next to decrepitude stats and now available to all type of characters
- Encumbrance is taken into account for spellcasting rolls.
- Lab sheet is now updated when its owner changes stats
- New vis study seasonal activity (started on the vis sheet in a magus inventory)
- New active effect for vis study bonus
- [technical] Use of customize Die class in stress rolls, inspired by leus proposal ( /r Xds )
- [technical] instrumentation of rolls for better test and diagnostic support
- [technical][test] bunch of code moved around to not rely on the roll dialog input.
- [macros](WIP) Simplification of the roll interface, giving more control to parameters (some were ignored in some cases).
- [macros] New method to add and remove a simple active effect (only one change).
- New setting to show rolls : (ALL,PLAYERS,OWNED)
- New setting to show rolls formula : (ALL,PLAYERS,OWNED)
- New Target level field in roll dialog for raw spontaneous magic
- New alternate action for spontaneous magic: No fatigue spent (divided by 5)
- Added a roman numeral for the topic number in the library tab
- More compact dialog for magic rolls
- [technical] Total overhaul of the voice and gestures spellcasting stances
- New Active effects to alter the modifier due to spellcasting stances (virtues Quiet magic and Subtle magic updated)
- New quick magic macro dialog
- Up to date French and Spanish version (by respectively orneen and Teotimus)

### Bug fixes

- Limited the width of spell attributes field to prevent layout problem in translations
- Added missing mnemonics for some hardcoded text in lab planning.
- Extended even more the room for abilities
- [technical] Cleaned up template.json and adjusted initial values of schema fields
- Fixed migration bug of reputations and personality traits for invalid actors
- "Equipped" is now properly spelled
- Fatigue overflow is now working properly
- Rework of DiaryEntry sheet:
  - Active effects bonus is not displayed twice
  - Added max level to each progress item to prevent overflow by active effect.
- Migration
  - Weapon.load not a number
- Default value of aura is now 0 in lab planning
- Suppress errors when running a macro item belonging to an Actor no longer in the world.
- Stress roll were still put to 0 even if there was no botch in some conditions.
- Fatigue levels are now updated after computing the casting total, and awaited for...
- Clicking on a portrait or items on the chat will no longer raise an error if it doesn't exist anymore in the world
- diary entries without date are migrated properly
- Aura management had a series of synchronization problems that have been resolved
- Checking if the character is dead is working again when attempting to roll.

### V10 migration (on going)

- Data models activated

  - Abilities
  - Books
  - Virtues & Flaws
  - Mundane items
  - Vis
  - Base effects
  - Spontaneous effets
  - Spells
  - Laboratory Texts
  - Magical effects
  - Diary entry
  - Laboratory
  - Reputation
  - Personality trait
  - Armor
  - Weapon

## 2.0.4.23, Kentigern, the Quaesitor

### Features & changes

- Updated French version (by Orneen)

### Bug fixes

- Migration fixes
  - DiaryEntry => teacher.score not null
  - DiaryEntry => progress items teacherScore undefined
  - Spells => Ritual flag not boolean
  - Virtues and flaws types

## 2.0.4.22, Kentigern, the magus

### Features & changes

- Improved planning tab in lab sheet
  - Editable fields are in a darker shade
  - Additional version
- New active effect to cap the aesthetics of a lab.
- Updated user guide for books and lab activities
- Updated lab virtues and flaws (by Orneen)

### Bug fixes

- Migration bugs (mostly from documents created in very old versions)
  - Spells with attributes from very old version are now migrated properly
  - Negative enhancingRequisite field is put back to 0 with a migration message for tracking
  - Virtues and flaws without a category are now migrated properly (default to "General")
  - Books with a lab text topic but no lab text are no longer raising an error.
  - Improved conversion of string to number
- Lab planning:
  - Year and season are again editable
  - Aura is editable if no covenant is linked
- Fix to the migration of mono-topic books to multitopics books

## 2.0.4.19, Kentigern, the apprentice

### Features & changes

- Possibility to study directly from spell lab texts or spell books if in the library of a character or an occupied lab.
- Preparation for lab diary entries to track their use (owned diary entries may raise an error and need a reload). Every entry can have a list of document ids to remove at rollback.
- Improved lab text layout
- Lab specialties are taken into account for the lab total.
- Activity in the lab will generate a log entry in it so occupation can be tracked.
- Rollbacking a lab activity will destroy it and its associated items (ie: lab log entry)
- New laboratory specialties as active effects
- [technical] new type of field: NullableDocumentIdField
- Natural weapons are now available on the beast sheet

### Bug fixes

- Link between Actors is now done at data preparation
- Fixed error when dropping a lab text on a dedicated book topic
- Only non zero modifiers are displayed in the lab total details
- Migration fix for Datamodel error in diaryEntries (system.progress.art.key undefined)

## 2.0.4.16, Kentigern, the novice

### Features & changes

- New planning tab in the lab sheet for spell invention and spell learning
- Books with multiple topics
- New Natural resistance active effect
- Natural resistances and Form resistances can be selected in the Soak dialog if applicable.
- Spell mastery topics now have the technique and form of the mastered spell
- Migration improvements:
  - invalid documents can now be recovered
  - Migration of V10 datamodel items (abilities, books) have been put in their respective model
  - workaround to retrieve data from removed/displaced fields
- New library sheet common to characters, covenants and labs
  - List of topics instead of books
- French and Spanish version updated (by Orneen and Teotimus)
- Spanish user guide (by Teotimus)
- New Actor specific labels for "virtues" and "flaws"
- Display of current aura in aura selection dialog
- Limited Item sheet
- Realm alignment for supernatural abilities (no effect yet)
- More translated hints (WIP)
- New icons by Sylph
- Lab texts in books
- Edit aging points of characteristics (SHIFT + Click)
- Size rolls
- Rework of Combat panel (+ added armor list below)
- Legacy magic items are listed in the inventory of characters
- Laboratory sheet reviewed and updated: (Personalities, Features, Rooms, Specialties are now text fields, the latter will be replaced by active effects)
- [technical] Actors migrated to the new datamodel can now use their embedded items for migration.
- Spell roll dialog improvements
- New Spell learning activity in diary sheet (used for both lab text and invention)
- [technical] Deprecated Item types will be removed at migration

### Bug fixes

- [en] Fatal wounds are no longer "dead" but "deadly"
- Powers are again editable once created.
- Removal of deprecation warnings in ars-scene
- Fix major bug, in scene migration, duplicating tokens
- Fix overflow of abilities if there are too many in a category
- rearranged some assets to be more consistent with naming
- Item code cleanup
- Fixed Item filtering being incremental instead of resetting at each of the filters change
- Aging roll of 10 now results in a zero on the dice.
- Lab owned Items are again migrated properly
- Starting date of a world is now the canonical year of 1220
- Fixed a bunch of bugs in the diary entries.
- Fixed drag and drop of Items on NPC and Codex sheet
- Fixed computation of the warping score and xp
- Simplified encumbrance computation
- Better management of roll generic fields
- Fix bug preventing sheet display when no user-cache is available in the browser.
- Migration polishing
- Diary entries are again displayed in Covenants and lab actors
- Spell mastery is now added to the casting total instead of just the penetration total
- Stress rolls are no longer reduced to 0 if there is no botch, only the die is.
- Setting for default Documents icons is not longer broken
- Fixed capitalization on some assets references
- Refactorization of spell management code to be used from outside the Item.
- Improved migration
- Allow browsing options for players in book sheet
- Abilities without key will default to awareness
- Actors in the new data model will migrate their Items again
- Size is back on beast sheet
- Magical focus is correctly applied for raw spontaneous magic

### Documentation

- Take note of the existence of a French version of the system compendia, including the user guide:
  https://raw.githubusercontent.com/orneen/ars-compendium-translation-fr/main/module.json

### V10 migration (on going)

- Data models activated

  - Abilities
  - Books
  - Virtues & Flaws
  - Mundane items
  - Vis
  - Base effects
  - Spontaneous effets
  - Spells
  - Laboratory Texts
  - Magical effects
  - Diary entry
  - Laboratory

## 2.0.3.13, Jerbiton the Founder

### Features & changes

- improve migration of invalid documents following V10 290 fixes
- new mnemonics for hints (WIP)
- updated French version (by Orneen)
- updated Spanish version (by Teotimus)
- Spanish user guide added to journal compendium (by Teotimus)

### Bug fixes

- Powers are again editable.
- updated generic abilities option field in Compendium
- added note about individual target size in Spell section
- Abilities are again displayed in beast sheets

## 2.0.3.12, Jerbiton the Magus

### Features & changes

- Gameplay section of the userguide finished
- Experimental stress die roll (/r Xds) without botches (thanks to Ieus)
- Initiative rolls in the combat tracker is using the new stress die above.
- [DEV] Some basic continuous integration tests using Quench module(WIP)
- [DEV] Updated deprecated Github actions for release process
- [DEV] It is possible to specify the number of botch dice in a stress roll (ie: no dialog)
- [DEV] Factorization of embedded documents creation for unit testing

### Bug fixes

- Removed documents types without a sheet yet.
- Retrieve the contents of the roll dialog earlier, in order to not pass html around for a roll.
- Fixed dialog display problem with abilities with very long names
- Fixed power cost being 0 when using it from the character sheet.
- Fixed magic contest error with entities in a scene with Aura.

## 2.0.3.11, Jerbiton's Gauntlet

### Features & changes

- French version update (by Orneen)

### Bug fixes

- Fixed major bug with ability Wilderness sense preventing the display of the sheet.
- Added some missing await for asynchronous call to some stress rolls cases
- Fixed wrong image link in user guide
- Fixed Soak and Damage chat messages error
- Removed a few V10 warnings

## 2.0.3.10, Jerbiton the apprentice

### Features & changes

- If you are GM or owner you can click on the chat icons to get a description of the character or item
- If you have limited permissions, you can open the limited sheet by clicking the chat icon.
- Added mnemonics for Actor and Item types
- Changed the icon for Items in the sidebar from a suitcase to a bag.
- Updated user guide.

### Bug fixes

- Fixed duplicate keys in the spanish translation
- Fixed ownership problem of character tokens rolls (roll details were not visible if rolled from the token)
- Fixed display bug for private rolls
- Removed some handlebars debug logs
- Active effect from aura indicates its source with the name of the scene.
- It is again possible to suspend active effects
- Small improvements and fixes for Item sheets for better resizing

## 2.0.3.8, Jerbiton's youth

### Features & changes

- Weapons list added in the combat tab
- Overhaul of the item sheets to be easier to resize (wip)
- New sourcebooks filtering setting
- New filtering of spell attributes based on sourcebooks setting.
- New look for the journal entries
- The user guide, a perpetual draft
- The Astrolab has been renamed Astrolabium (latin) to avoid a translation
- Support for boolean Active effects (ie: no value, it is there or not)
- Updated French and Spanish versions (respecively Orneen and Teotimus)
- New active effect for Art deficiency.
- Cosmetic changes left and right
- The effects tab is now available to the player in read only mode.
- General spells can now have their final level adjusted.
- "Special" value added to all spell attributes.
- Categorized and foldable abilities in character sheets
- Resources for fatigue and might points
- Characteristics "xps" counter
- Familiar bronze cord is added to soak.

### Bug fixes

- Opening a weapon not owned by anyone won't raise an error anymore.
- Fix stress rolls for Foundry VTT version 10.287
- Size and encumbrance are now read only (use active effect to change size)
- Option field is no longer editable if a book is linked in the Scriptorium
- Option field is again editable for generic abilities in the book sheet.
- Remaining xp is now consistent between abilities, spells masteries and Arts
- The year is properly filled for aging rolls with the one from the character sheet.
- Added a few mnemonics for translation
- Roll results are now rounded to the closest integer.
- Fixed stress dice to roll only the proper amount of times.
- Minimum xp spent in early childhood activity for main language has been lowered to 50 in order to take affinity into account.
- Fixed mnemonics in scriptorium and diary sheet.
- Rollback of reading activities is working again.
- Fixed a remaining V10 warning for players loading chat.
- Improved Codex readability.

## 2.0.2.8

### Features

- Better diary description for reading activities
- New eye icon for book sheet (by Sylph)
- updated French version by Orneen

### Bug fixes

- Diary entry sheets are again fully visible at low res
- Level of arts summa was not taken into account for art progression
- Affinities were not taken into account in diary entry with cap level
- Default xp is again set if you hadn't the advanced tab open
- Scriptorium level of book doesn't reset if you unlink the book
- It is no longer possible to select a reading or aging activity in a diary sheet

## 2.0.2.4

### Features

- New scriptorium dialog (beta+)
- Improved the look of casting and lab total tabs
- New compendium with all lab virtues and flaws by Orneen
- Updated French version by Orneen
- Removed migration support for 0.7 (mostly work but no waranty)
- Improved dropbox for picking ability keys
- Abilities keys are now sorted in the system language
- Total rework of the book item type
  - new sheet
  - mundane books merged into books
  - Custom sort in actor sheets (characters, covenants, labs)
- Added some items in FAQ
- New active effects
  - lab arts specialties
- Number of Xp assigned in an activity is now displayed
- DEV: Some factorization of diary entry code
- It is possible to drag and drop abilities in the Activities tab of a diary entry:
  - From the character, another character, the sidebar or a compendium
  - If the character already has the ability, it will use it instead.
  - Otherwise the dropped ability will be added to the character at a score of 0.
  - It doesn't work for training and teaching activities
- Some items sheets have been reworked to display more information in the main tab:
  - Vis sheet
  - Books

### Bug fixes

- The list of abilities to use a weapon is back
- There is no longer an (non-blocking) error at lab creation
- The icon of a document is no longer resetting to the default one when you make a copy.
- Chirurgy found back its missing r
- Books on spell mastery can no longer be summa
- removed a bunch of debug log in handlebar templates

### V10 migration (on going)

- Data models activated
  - Abilities
- Data models implemented
  - Books
  - Virtues
  - Flaws
  - Diary entries
  - Mundane Items
  - Vis

## 2.0.1.1

### Features

- Small redesign of UI in focused areas
- New long term activities for character creation
  - Childhood
  - Hermetic apprenticeship
  - Later years
- Exposure activity source quality is editable.
- New gameplay section in FAQ.

### Bug fixes

- Magi NPCs have their magic resistance properly computed
- Parma magica , penetration and teaching were not taking into account puissant virtue in some cases
- Fixed empty dropbox for Arts progression in adventuring and exposure.
- Entities with might no longer raise an error while computing penetration.
- Fixed source quality of teaching activity (+3 instead of +6)
- lots of small fixes

### V10 migration (on going)

- Html templates update
- Use of system instead of data.data in all javascript modules
- Replaced deprecated methods
- Migrated packs
- Data models activated
  - Abilities
- Data models implemented
  - Books
  - Mundane books
  - Virtues
  - Flaws
  - Diary entries
  - Mundane Items
  - Vis

## 1.4.7

### Features

- temporary removal of max XP per progress item in adventuring activities (until proper activity type is implemented (V10))

### Bug fixes

- Fixed source quality of teaching activity (+3 instead of +6)

## 1.4.6

### Bug fixes

- Magi NPCs have their magic resistance properly computed
- Parma magica, penetration and teaching were not taking into account active effects (eg Puissant) in some cases
- Fixed empty dropbox for Arts progression in adventuring and exposure activities.
- Entities with might no longer raise an error while computing penetration.

## 1.4.5

### Features

- Compacted GM private rolls to take less space in the chat
- Clicking on a non-rollable item put in the macro bar will open its sheet
- Generic seasonal activities (Adventuring, Exposure, Practice, Training, Teaching)
- Aging roll effects can be rollbacked
- New custom pause icon by @Sylph
- Update of French version (by Lanneval and Nono)
- Some redesign of the UI to have a more unified medieval flavor (by @Sylph)
- Rearranged languague mnemonics of common usage into a generic category (the older ones will be kept for a few versions to allow translators to catch up)
- New active effects for source quality modifiers of seasonal activities (reading and writing have no effect yet)
- Rolls from sheet are done in the current rolling mode setting (public, private, blind, ...)
- First version of the Astrolab, to set the world time and synchronize actors (design by Sylph).
- Unified the way actors are storing the current date (migration needed)
- Players are now able to drag and drop other actors they have "limited" permission with on a diary entry to act as trainer/teacher
- Diary entries are now sorted

### Bug fixes

- Fixed mnemonic for default characteristic in ability sheet
- Fixed a bug for migration of legacy auras.
- Fixed ability rolls taking the wrong ability and default characteristic in the roll dialog.
- Casting totals are now properly computed for brand new characters
- It is possible to drop items on the Codex again.

## 1.4.4

### Features

- Limited character sheet
- Requisites are displayed in spell/magical effects lists
- Realm aligned auras
- Spell will fail if your casting total is too low
- Fatigue levels will be lost if casting total is too low (rituals too)
- Aura impacts magic resistance of creatures with might
- Dropping an ability on an actor will open its sheet
- Dropping an already known ability on a character will raise a warning
- Redesign of NPC-entity sheet
- Added might pool in the datamodel.
- Some cosmetic improvements suggested by Sylph
- Players will only see the details of their own rolls
- Most roll chat messages are now in a foldable "details" link
- More compact footers for actor sheets (by Sylph)
- Penetration computation of spells and magical effects
- Magic effect casting will fail if the level is not reached
- Update of Spanish translation (by Teotimus)
- Aura now impact unlinked tokens
- Aura of a scene is applied to token on scene activation or if scene is active
- Powers integration in contests of magic
- Beast sheets now also have a limited version
- Dev: refactoring of the roll data (bunch of small bugs fixed)
- New active effects: Wound and fatigue total penalties
- New field in spell sheet to describe the bonus
- New sub-tab for casting totals
- New field for spell bonus description
- Combat section moved after wounds and fatigue
- Entities now have a associated form
- New client setting to ask for confirmation when deleting an owned item

### Bug fixes

- Fixed wrong label in defense roll
- Changed misleading die icon of damage and soak actions into proper ones
- Fixed broken foldable active effects bonuses
- Extended lower limit of aging roll tables to negative values
- Only spells strictly greater than level 50 become rituals (instead of greater or equal)
- Fixed the combat automation
- Fixed error message when changing aura value.
- Tech debt: Cleaned up the Contest of magic feature code using ability key
- Combat automation was not working with weapons in the macro bar (defaults to attack now)
- Clarified Soak chat message details.
- Aura modifier field won't appear in roll window if you already have an aura effect on going
- Fatigue and wounds penalties only appear in roll dialog if they are non zero
- Modifier for spell casting is again taken into account
- Spells, Magical effects and powers dropped on the hot bar should work (again?)
- When dropping an Actor on a scene without Aura, any existing Aura effect is removed
- Parma magica speciality is now taken into account in magic contests
- Free form spontaneous magic takes the correct arts score if you change them in the roll dialog
- Characteristic rolls don't select the first ability with 0 score instead of "None".
- NPC rolls results are only visible for the GM

## 1.4.3

### Features

- Combat exertion
- Overhaul of spell mastery to align with xp based attributes (ie: abilities, needed for long term activities)
- Started adding realm alignment effect to some virtues when appropriate
- Filter box for covenant lab texts
- Filter box attributes are now saved at session level and are distinct for each player
- Update of Spanish translation (by Teotimus)
- System asks for confirmation before deleting a diary entry
- New fancy chat messages with icons and foldable details
- Dev: new event listener for confirmation before deletion of items
- Removal of magic rules enforcement setting (it will always be enforced)
- New button to clear auras
- New icons by Sylph

### Bug fixes

- Mastery is now taken into account for the casting total display
- Fixed long standing annoying ui bug in the tab selector
- Filter box is no longer "draggable"
- Added weapon initialtive bonus and overweigtht to init rolls (still simple roll)
- It is possible again to drop powers on NPCs
- Fatigue penalties were not computed properly.
- Xps for spell mastery were not removed when dropping a spell on an actor
- Removing a linked token from a scene will remove the aura effect from the actor too
- Put Aq and Au forms in the correct alphabetical order
- Fixed a display bug in lab sheet size where a number was not properly parsed as an integer.
- Casting a spell whom focus applies will tick the check-box in the roll dialog.
- Confidence is no longer available for grogs.
- Chat messages from deleted actors no longer generate errors

## 1.4.2

### Features

- new beast actor with custom sheet
- Aging rolls
- First ui integration
- Item sheets are flavored to the kind of Actor owner (assets by @Sylph)
- Dice so nice integration: roll botch dice displayed.
- Fatigue management rework
- New filter boxes for spells and magical effects
- basic Aura management
- New active effects
  - New active effect to add fatigue levels
  - New active effect to modify aging rolls
  - New active effect to set realm alignment
- Macro to roll stress die
- Hints for rollable labels on the combat tab
- Dev: possibility to define active effects with a limited number of possible values using a drop box
- Dev: new button to migrate one specific actor

### Bug fixes

- Abilities compendium didn't have keys set properly.
- fixed a bug where effects with generic abilities were impossible to delete.
- Fixed some cosmetic problems in beast sheet
- Ability is set to "None" by default if rolling a characteristic
- migrating doesn't reset your longevity potion bonus and lab total anymore.
- Spontaneous rolls from arts are no longer able have simple die option
- Fixed Spanish and French language problem
- Fatigue penalties are capped at 0 (ie: no bonus)
- Characteristics rolls have now the correct characteristic selected.
- NPCs can age and have warping
- Fix "Show penetration and defense" feature
- Fixed wrong mnemonics and tab problem for books

## 1.4.1

### Bug fixes

- Fixed formula computation resulting 0 when a die explode

## 1.4.0

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
- Soak field is now readonly and computed automatically based on stamina and equipped armor
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
