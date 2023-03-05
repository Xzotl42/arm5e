## 2.0.4.8, Kentigern

### Features & changes

- New Natural resistance active effect
- Natural resistances and Form resistances can be selected in the Soak dialog if applicable.
- Books with multiple topics
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
