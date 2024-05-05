
The traditional troupe members of a Saga. The character sheets should be familiar to Ars Magica players as most fields are self explanatory and their sheets are very similar. They increase in complexity from grog to companion to magus. Please see below for a more in-depth explanation of each feature of the sheet.

Whenever you see a die icon - you got it - click it to roll. A pop up will open to confirm some details and actually roll.

For brevity, we will limit ourselves to describing only items that need some sort of explanation or that function differently than a simple "type your info here".


#### **Magi, Companions and Grogs**    

### Header

**Covenant field:** 
Set it to an existing covenant name in the world to link with the character. The character will also become a member in the covenant sheet. Click on the link symbol to open the covenant sheet. You can also drag and drop a covenant actor on the sheet for the same effect.

**Age**, **Season** and **Year** cannot be changed by hand - they're controlled elsewhere in the sheet.

**Characteristics:** 
Click on a characteristic label to open a roll dialog. Mousing over the score will also tell you the number of aging points in that characteristic - the more aging points, the larger a shadow will appear around the field. To edit the aging points, shift+click the label of the characteristic.
  
### Description

Some fields like **size**, **soak** and **encumbrance** are read only because they are computed and/or can only be changed through [[Active effects]]:

**Warping**: WIP, Twilight and its effects are not implemented yet

**Aging and decrepitude**: Click on the little hourglass icon to do an aging roll. (see [[Long term activities#Aging (special)|Aging]]);

**Personaliy traits:** Click on the dice icon to roll for a personality trait.

**Reputation**: Click on the dice icon to roll for reputation

### Vitals and Combat

**Fatigue**: Use the + and - signs to increase your fatigue or the rest button to reset it all. Spell casting will automatically add fatigue levels as well.

As you can see below, it is possible to increase or decrease your fatigue levels and the associated penalty using [[Active effects]]:

![](systems/arm5e/assets/userguide/Fatigue.webp)


**Wounds:** You can manually add wounds to a character here. Each wound is individually represented by an icon and fresh wounds have a red aura around them.

Clicking the wound icon opens a pop up where you can add more information about the wound, such as location, for instance. It will also allow you to delete the wound.

Clicking the bandaged hand opens the [[Sanatorium]] window. In this window not only can you roll for recovery, it will also keep a record of the rolls and effects. Please see the corresponding page for more details on how it works.

The penalties for wounds and fatigue are automatically taken into account for rolls.

**Combat section:** You can roll for initiative, attack, defence etc here (See [[Gameplay#Combat|Combat]] for more detail).

**Weapons and Armor**: A duplicate from the Inventory tab put here for convenience. Click on the check box to equip or unequip. Dragging and dropping items here will also work, of course.

### Abilities

This section lists all the abilities possessed by the character. As mentioned in the Introduction, you can add preconfigured abilities by dragging and dropping from the sidebar, a Compendium or even another character sheet.

![](systems/arm5e/assets/userguide/AbilitiesActor.webp)

You can also click the little + icon to add an ability that will be specific to this character only. Creating it here and then dragging and dropping it back into the Items tab will add that new ability to the Items available.

Simply click on the Ability label to roll for it. A pop up window will ask for the specific conditions to the roll.

The abilities are arranged alphabetically in different sections corresponding to their category in the Core book (General, Academic etc).

A category will appear only if the character has an ability in it, however. Clicking on a category will collapse or expand the corresponding list of abilities.

Active effects are represented by colors:

* Blue: Puissant
        
* Red: Affinity
        
* Violet: Puissant and affinity
        
* Dark grey blue: Deficiency
    

### Virtues and Flaws

As with abilities, you can drag and drop Virtues and Flaws, as well as create new ones here and drag them back to the Items tab. A label in _italic_ means it has an Active Effect. 

### Arts

This tab is only available to magic users.

![](systems/arm5e/assets/userguide/HermeticArts.webp)

Each of the Arts is represented in this section:

-   The Art symbol or its hand gesture (see [[Introduction#Settings|Settings]]);
    
-   Its name - click on it to roll for spontaneous magic and follow the prompts in the pop up window;
    
-   The amount of XP spent in it and the total needed for the next level. You can directly edit the amount of XP here;
    
-   The score, read only but adjustable with the plus and minus icons. Please note changing the score will also change the amount of XP in the previous box to the amount necessary for the level, ignoring whatever you added before. Changing it back will not remember the last number set there.
    
-   The forms have an additional number between braces: this is the magic resistance for this form (ie: 5x Parma Magica + score).
    
-   The same colored shadow codes as abilities are used to indicate an active effect:
    
    -   Blue: Puissant
        
    -   Red: Affinity
        
    -   Violet: Puissant and affinity
        
    -   Dark grey blue: Deficiency
        

### Voice and gestures

You can configure the default casting modifiers here. Whenever you cast a spell, whether formulaic or through a spontaneous casting effect, these settings will affect that roll.

### Magic totals

A list of totals used for magic computed with characteristics and abilities. None of these are directly editable, being derived numbers.

You can, however, directly roll fast-casting and targeting by clicking on the corresponding labels.

### Spells

Like for abilities, a list of the spells known by the magus. These can be created here, added through drag and drop from the Items tab, or created here and then dragged back to the Item tab.

Click on a spell to roll for casting. That will open a pop up window asking for more details. Remember the Voice and Gestures lists will affect this roll (and do show up under "Bonuses").

Clicking on the up-down arrow will display a special filter area:


![](systems/arm5e/assets/userguide/SpellsFilter.webp)

You can filter by technique, form and level and then close it. A red aura around the word "Filter" will indicate the list is filtered.

Please note the filter parameters are stored in the browser on a per user and character basis so two different users can have their own specific view of the same sheet at the same time. As long as you keep using the same tab they will be preserved.

Please see [[Creating new spells and effects]] for more details on how to do that exactly that.

### Spontaneous magical effects

Same as spell list, but for frequently used spontaneous effects.

### Casting totals

This table gives you a quick overview of the magical capabilities of a character. Fields are self explanatory. Setting the local aura here *will* affect all spell and magical effect rolls.

### Laboratory

**Dev notes:** This tab is still a work in progress and will evolve greatly as lab activities are put in place. For now, it can be used to store information as is.

-   **Sanctum**: You can link a laboratory to your character, its quality and Art specialities will be taken into account in the Lab total sub tab.
    
-   **Longevity modifier:** the modifier given by the character's longevity potion. (**Dev note:** It may change in the future when longevity potions crafting is implemented)
    
-   **Familiar cords:** they are used in a few places (bronze for soak and aging)
    

### Lab totals

Similar to casting totals, this table gives an overview of the lab capabilities of a character.

-   **Laboratory quality** is read only if the character has a sanctum linked
    
-   **Apprentice:** put here the important stats of the apprentice that affect the lab total
    

### Inventory

Self-explanatory. Note that Mundane and Magical books will be merged soon.
  
You can equip or unequip weapons and armor by clicking the checkbox.

### Diary

-   List all diary entries in ante-chronological order (see [[Long term activities]]).
    
-   Diary entries with an activity not yet applied will be in _italic._
    
-   **Pending XP:** This field will display the total XPs from activities which was not applied or distributed.
    

### Effects

![](systems/arm5e/assets/userguide/ActiveEffects.webp)

-   See [[Active effects]] for more details on each kind of effect available.
    
-   This tab is read only for players, hovering the mouse pointer on the icon will give a description of the effect
    
-   It will list the active effect on the character.
    
-   Clicking on the cross icon will temporarily disactivate it until the check march icon is clicked.
    
-   Some effects a read only even for a GM, this is because they are part of an Item owned by the character (eg: a Virtue). The **source** field will indicate from where the effect comes from.
    
-   **Dev note:** In Foundry core, the name for this feature is Active effects but they can be Active, Passive or inactive which can make things confusing.