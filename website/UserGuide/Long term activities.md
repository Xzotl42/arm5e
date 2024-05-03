Long term activities are created through diary entries (Character-> Diary tab)

Create a new diary entry and select the activity type:

![](systems/arm5e/assets/userguide/ActivitiesList.webp)

-   A diary is, as its name implies, a classical text describing events from the character perspective.
    
-   Adventuring, exposure, practice, training and teaching are the same activities described in the long term events of the corebook.
    
-   Apprenticeship, Early childhood, Later life and Year after apprenticeship are for more structured character creation.
    

The advanced tab will look something like this:

![](systems/arm5e/assets/userguide/Adventuring.webp)

-   A source quality that may be editable or not depending on the type of activity
    
-   Subtabs for Abilities, Arts, Spell masteries and Spell learning also called progress items.
    
-   By clicking the + sign it will automatically add an existing ability/spell of the character to the list. You can then allocate the experience between all progress items until the sum match the source quality.
    
-   Once done click on the Apply button to add the XP to the selected progress items. A small technical blurb will be appended to the diary description detailing the effects and most fields will become read only.
    
-   An unapplied activity will appear in italic in the list. Its source quality will be added to the field Pending Experience.
    
-   **Important**: You must possess the ability in order to progress in it. Alternatively, you can drag and drop an ability on the subtab to add it to your character at the same time.
    
-   Some activity types may have some restrictions that may prevent you to click on the Apply button. A message in red next to the Apply button will explain what the problem is.
    
-   Some activities types may have bonus options with specific restrictions
    
-   There are active effects for most types of activities to modify the source quality (see [[Active effects]])
    
-   Once an activity is applied, it is possible to rollback the effects using the Rollback button. **Disclaimer**: This feature is intended to fix typos and errors, if too many changes happened after applying you may encounter problems:  
    - A progress item was deleted  
    - The level of the progress item became too high and it will be impossible to reapply (eg: level of a book or skill of a teacher)
    
-   If you have to rollback a set of activities , it is better to do it in the inverse order to avoid any problem.
    
-   Some activities introduce the concept of a teacher/trainer where the source quality will depend on the third party skills. It can either be a free form input or a real Actor by dropping it on the teacher tab.
    
-   The experience gain from a trainer or teacher cannot go beyond the teacher skill. You will be warned and any excess will be discarded.
    
-   For spell learning, you can drop any spell or lab text from the sidebar. This feature is not available outside character creation and advanced creation rules (See [[Laboratories]] for learning spells during play)
    

Find below the list of current activities and their specificities

### Adventuring

-   Editable source quality: yes
    
-   Progress items available: Abilities, Arts, Spell masteries
    
-   Options: no
    
-   Teacher: no
    

### Exposure

-   Editable source quality: yes
    
-   Progress items available: Abilities, Arts, Spell masteries
    
-   Options: no
    
-   Teacher: no
    

### Practice

-   Editable source quality: no
    
-   Progress items available: Abilities, Spell masteries
    
-   Options: yes: Languages, Area exploration, Spell mastery, Forced practice
    
-   Teacher: no
    

### Training

-   Editable source quality: no
    
-   Progress items available: Abilities, Spell masteries
    
-   Options: no
    
-   Teacher: yes
    

### Teaching

-   Editable source quality: no
    
-   Progress items available: Abilities, Arts, Spell masteries
    
-   Options: yes. Number of students
    
-   Teacher: yes
    
### Vis Study

This activity is created by clicking on a special icon present in the vis sheet if it is in the inventory of a Magus. After confirmation, the Vis needed will be removed from the inventory.

-   Editable source quality: no
    
-   Progress items available: Arts
    
-   Options: no
    
-   Teacher: no

### Reading (special)

This activity is not created the usual way but rather through a book or the Scriptorium dialog (see [[Canvas menu#The Scriptorium|Scriptorium]])

### Aging (special)

You can roll for aging by clicking the hourglass icon in Description tab.

-   The age of the character, its covenant's living conditions and the bonus of a longevity potion are automatically taken into account
    
-   The results are automatically applied to the character (age, apparent age, aging points, decrepitude) and a diary entry created.
    
-   If you are unlucky or very old, you can trigger an aging crisis. The character will be unable to roll for anything but characteristics until the crisis is resolved.
    
-   To resolve a crisis, click on the skull icon that appeared next to the character name.
    
-   It is possible to rollback the effects of an aging roll but it is advised to do it right away and in the inverse order or the system may not be able to do it properly.
    

**Dev note:** This two steps process is to allow another character to step in and roll for medicine or cast a Creo Corpus spell.

### Spell learning and spell invention

Those activities are not available directly, you must schedule them from a laboratory. See [[Laboratories]]

-   Editable source quality: no
    
-   Progress items available: Spells
    
-   Options: no
    
-   Teacher: no (not yet for spell learning)
    

### Enchanting

As spell invention, this activity is not available directly and is created from a laboratory See [[Laboratories]] Applying will create the designed magic item and remove any vis cost.

-   Editable source quality: no
    
-   Progress items available: none
    
-   Options: no
    
-   Teacher: no (not yet for spell learning)

### Others

Apprenticeship, Early childhood, Later life and Year after apprenticeship

-   Editable source quality: yes

-   Editable duration: yes
    
-   Progress items available: Abilities, Arts, Spell masteries
    
-   Options: no
    
-   Teacher: no

### Placeholders

Some activities are reserved for laboratories and are not editable. It is to track whether the lab is in use or not (for yearly cost, shared lab,...)