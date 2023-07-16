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
