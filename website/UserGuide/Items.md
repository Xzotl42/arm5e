The following Items are available for creation.

**Reminder**: You can create folder of Items in the sidebar or in a Compendium to be then dragged and dropped on an Actor (eg: Magus package, Grog package). Easy way to add a bunch of abilities, virtues and flaws to a character at creation.

**Game metadata:** Since the description cannot be made available for copyright reasons, most Item types available in the system Compendium are provided with the name of the sourcebook they are coming from and the page they can be found (English edition). Their display is managed by a setting (see [[Introduction#Settings|Settings]])

A some of Item's types don't make sense for some Actor types (eg:Ability on a Covenant), they will be filtered and ignored.

## Abilities

Beside the name, speciality and description, the following fields are available. A \* indicates this field is only visible when it is owned.

**Name:** A note of the name: it can be whatever you want, in the language you want. The system doesn't care about it. (see Ability key below).

**Score**: it can either be adjusted using the plus and minus signs or by directly inputting the experience amount.

**Default characteristic:** This selects the characteristic used by default when you roll that ability

**Ability key:** This is an **important** information for the system. It allows it to know which ability it is independently of its name. This permits the system to do a lot of things:

- Check if a character has a specific ability and its score
- Automatically use an ability's score to implement some rules or compute some value (eg: Parma Magica, penetration).
- Know which ability to progress during a long term activity
- And more as the system evolves

**In short, if you don't configure it properly, some features won't work.**

**Ability option:** This field is greyed out most of the time, except for generic abilities. See below

**Active effects on abilities**

Abilities modified by an active effect have a coloured halo

![](systems/arm5e/assets/userguide/EffectsOnAbilities.webp)

Puissant ability

Affinity with ability

Affinity with ability and puissant ability

### Generic abilities

- Area lore, Organization lore, Languages (Dead or not), Craft, Profession, Mystery cult lore and supernatural power are generic abilities. They require an additional parameter to be recognized by the system, because there could be any number of them. Otherwise, it wouldn't be possible to differentiate them.
- Each generic ability with a different Ability option is totally independent of the others. It has its own speciality an default characteristic on rolls.
- Generic abilities in Compendia should already have their option set (eg: Dead language (Latin) has "Latin" in its ability option).
- The ability option is particularly useful when you want to add an affinity or puissant ability virtue. If you have multiple instance of an ability (eg: leatherwork and glassblowing, both craft abilities), using the option will allow to pick the correct one.
- **Important**: only alphanumeric characters are allowed for an ability option. The system will automatically remove other characters. Use CamelCase if you want to put multiple words.

## Virtues and Flaws

**Type**: Some Actors will only accept virtues and flaws of a certain type.

**Impact**: only used to keep track of how many points are used at character creation.

**Description:** Usually empty (see FAQ), but in some cases there are active effects (see below) that need "to be configured". Look for that text before adding it.

### Effects:

Virtues and flaws can have active effects which will be transmitted to their owner (see [[Active effects]]). Whenever possible, those are already configured in the system Compendia (eg: the Large virtue will give +1 size).

**Important:** Before V11, due to a Foundry core's limitation, it is not possible to edit active effects of an owned Item. You must edit it first in the sidebar. It is particularly relevant for effects that need configuration like Affinity, Puissant art, etc.

### Personality traits and reputations

You can add as many reputations and personality traits as you wish. They can progress as abilities.

## Base effects

The base effect is the root of any magical effect, spell or powers. They are intended to be used in the [[Actors#Codex Hermeticum (violet)|Codex]].

**Requisites**:

You can select additional arts as requisites by clicking on the hammer icon:

![](systems/arm5e/assets/userguide/Requisites.webp)

The **base level** is the level of a spell with this effect with minimal attributes (Range: self, Duration: Momentary, Target : individual). It is the same number found in the book for the spell guidelines.

## Magical effects

A magical effect is like a spell and is designed like it.  
The concept doesn't exist in the official rules, but it is used in the system to keep a collection of commonly used spontaneous effects for a character. Instead of designing it every time in play, it is ready to use.

See **Spells** below for more details about the fields

## Spells

**Level:** The level field is read only. It is computed from the base level and all the other attributes as per the rules.

**Spells attributes (Range, Duration, Target):** By default, the list of available attributes is limited to those of the core book. However, using the **sourcebook filter** setting, you can expand the list to those present in other books (note that most of them have restriction for their use). The number in parenthesis is the amount of magnitudes the spell level will increase.

**Apply magical focus (owned):** This is to indicate if the spell effect falls into the scope of any magical focus the character possesses. Casting total will be computed accordingly.

**Bonus and bonus description (owned):** These fields are here to cover any specific bonus not covered by the system (yet). Examples: specialities of abilities like Artes liberales for rituals, Talisman bonuses,…

**Mastery (owned):** Like abilities, you can change the score by using the plus and minus signs or directly put the total experience.

**Mastery abilities (owned)**: Just a free form text field for now, but expect it to change in the future…

**General:** If checked, it will display the field named **Level Adjustment**

**Level Adjustment:** this field allows to slightly adjust the level of a general spell so it is possible to have a value which is not a multiple of 5 (also useful for Aegis spell which doesn't follow the normal hermetic rules).

**Target size:** Give information on what an Individual target is for each form.

## Powers

**Form**: used for magic resistance

**Cost**: used to compute penetration based on the owner might score.

## Enchantments

Enchantments can be created from a magical effect or a spell using the [[Actors#Codex Hermeticum (violet)|Codex]].  
There is an additional tab with new attributes specific to enchanting.

**Dev notes**: Enchanting as an activity is not fully implemented in the system (only lesser enchantments)

## Diary entry

This item can be used as a standard diary for the character but also to create [[Long term activities]] during down time between game sessions.

**Dev notes**: the standard diary is still there for legacy reasons for people who used it as such in the past. I would recommend using a Foundry core JournalEntry for regular diaries as it is much easier to share between players or to do collaborative editing.

## Books

Table of contents: Once you have finished defining all the topics of your book, you can generate the table of contents automatically by clicking the icon below the title (it will not erase anything in the description but append to it).

There two versions that can be generated:

- a concise one with just one click (1st one in the image below)
- a verbose one by shift-click (2nd one in the image below)

  ![A book](systems/arm5e/assets/userguide/book1.webp)

- A book can have multiple topics of different types, you can browse them using the arrows, adding one more with the + icon, delete the current one with the Perdo hand gesture.
- The last icon will open a [[Canvas menu#The Scriptorium|Scriptorium]] with all the book fields preset. If the book is owned, it will also preset the reader.

  (For lab texts, the book needs to be in the inventory of the character or its sanctum

  ![](systems/arm5e/assets/userguide/book2.webp)

- Topic: You can select whether the book is about an Art, an ability, a spell mastery or a laboratory text

- See [[#Generic abilities]] for more explanations about the ability option field

## Physical items

A physical item is something that exists in game as opposed to a virtue Item for example
(books, weapons, armors, vis,...).
When you drag and drop a physical item from an actor sheet to another, it will transfer it instead of creating a copy. If there more than one exemplar (ie: quantity field), it will ask how many should be moved.
It is possible to copy instead by pressing the SHIFT key (DevNote: due to a Foundry VTT limitation planned to be fixed in V12, you will have to press SHIFT after starting to drag the item)

### Weapon

**Ability:** The ability to apply when using the weapon.

**Weapon expert:** Indicate the ability's specialty matches the weapon.

### Enchanted items

Some physical items are enchantable (items, weapons, armor,...), to access the enchantment attributes, click on the golden book in the sheet. Clicking again will destroy them, after confirmation.

## Others

There are more types of Items but they don't have any particular feature yet beside pure data.
