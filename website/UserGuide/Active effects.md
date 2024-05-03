-   Active Effects are modifying a document data from the state it is stored in the system.
    
-   They can be added to Items or Actor directly. The effect of an Item can also configured to be transmitted to the owner of it.
    
-   In Ars Magica, this mechanism is used for virtues and flaws. For example, the virtue "Large" once owned by a character will give it +1 size. Most virtues and flaws in the compendia have an Active Effect preconfigured when applicable.
    
-   Active effects can be disabled temporarily in the Effects tab (GM only).
    
-   **Dev note**: In the future, active effects will be used to simulate the effects of spells too.
    
-   **Important** : Before V11, active effects in an owned Item can not be edited (Foundry current limitation). You will have to pull it in your sidebar to edit it properly.
    

The **Details** tab is only used for display in the Actor's or Item's Effects tab

The **Effects tab** as its name implies is where active effects are configured

![](systems/arm5e/assets/userguide/ActiveEffectConfig.webp)

-   Click the plus sign to add an effect to the list
    
-   Click the Perdo hand gesture to destroy an effect
    

**Type**: The list of available types is described below

**Attribute**: What is changed

**Change Mode**: An effect can either:

-   **Add** the value to the attribute (set a negative value to subtract)
    
-   **Multiply** the attribute by a factor (set a value lower than 1 to divide)
    
-   **Override** the existing attribute (eg: Realm alignment)
    
-   **Be there,** if the effect exists, it will apply (eg: deficient Art)
    

**Effect value:** some effect types may not have a value or only have a set of choices.

-   Some effects may need additional information, click on the cog to add it (eg: generic abilities).
    

## Effects types

The following active effects are available so far:

### Null effect

The null effect is a placeholder until a proper one is chosen. It has no effect.

### Spellcasting

- Aura: bonus due to Aura (See [[Canvas menu#Aura management (GM only) |Aura-management]]) used internally by the system.
- Spellcasting stances
This is to overrides the modifier applied to casting total for spellcasting stances (voice and gestures).

Dev note: since it is an override effect, having multiple of the same type will simply take into account the last one processed. For example, taking "Quiet magic" virtue twice would not work as expected as the effects are not cummulative. In this case, I have created the virtue "Silent magic" to do the same.

### Realm alignment

This set the character to a particular realm alignment. A character with that effect will be impacted by auras when using its magic or powers.

-   All Magi are aligned to the Magic realm by default.
    
-   Some virtues set the alignment by default (eg: the Gift)
    

### Seasonal activities

This effect will impact the corresponding long term activities source quality:

-   **Practice**
    
-   **Training**
    
-   **Teaching**: As per the rules denomination, but in fact, it is _being taught something_
    
-   **Teacher**: Bonus given to a student being taught
    
-   **Reading**: book quality bonus
    
-   **Writing**: book quality bonus (not implemented yet)
    

### Arts

Flat bonus to a given hermetic Art (eg: Puissant Art virtue)

### Art affinity

Multiplier to the total number of experience points in an Art.

-   **Dev note:** For the sake of simplicity, the multiplier is applied to the total amount of XP not starting from the time the effect was applied (eg: an affinity gained during Twilight will have a much higher boost. )  
    

### Art deficiency

As per the rules, halve casting and lab totals.

-   Deficiencies for a Technique and a Form are cumulative (ie: totals divided by 4)
    
-   Deficiencies on multiple Forms or Techniques are not cumulative (effects with requisites)


### Spell mastery

Xp multiplier or Xp bonus to all spell masteries' score

### Vitals

Flat modifier to the following:

- **Size** (eg: Large, Small frame)
- **Soak:** (eg Tough)
- **Aging**: for aging rolls (eg: Fae blood or longevity rituals)
- Aging offset: when a character starts aging compared to the standard 35 years old.
    

### Characteristics

Flat modifier to a characteristic

-   **Dev note:** Unless you suspend or remove the effect, you won't be able to edit the impacted characteristic while it is active.
    

### Fatigue

Flat modifier to the following:

-   **Fatigue penalties total**
    
-   **Specific fatigue level penalty**
    
-   **Number of a specific fatigue level** (see [[Actors#Vitals and Combat|Vitals and Combat]] for a visual example)
    

### Wounds

Flat modifier to the following:

-   Wounds penalties total
    
-   Specific wound type penalty


### Natural resistance

Flat modifier to specific damage kind, this will add an additional field in the Soak dialog.

-   This can either be a resistance or a vulnerability (eg: negative value).
    

### Ability (category) bonus

Flat bonus to the ability score

-   For generic abilities, use the cogs icon to specify the ability option. It must match exactly the option of the owned generic ability (see [[Items#Generic abilities|Generic abilities]]  for explanations)
    

### Ability (category) affinity

Multiplier to the total number of experience points in an ability.

-   For generic abilities, use the cogs icon to specify the ability option. It must match exactly the option of the owned generic ability (see [[Items#Generic abilities|Generic abilities]] for explanations)
    
### Supernatural ability xp bonus

Give a flat XP bonus to a supernatural ability to simulate the score of 1 when the corresponding virtue is taken.

### Laboratory activities

Flat modifier to a specific lab activity. (Note: this is an effect for characters, for laboratories, specialties will cover that)

### Laboratory

Flat modifier to a laboratory attribute, those are given to laboratory vices and virtues

-   Size
    
-   General quality
    
-   Safety
    
-   Health
    
-   Refinement
    
-   Upkeep
    
-   Warping
    
-   Aesthetics
    

### Laboratory speciality

Flat modifier to lab totals of a given Art or specific activity

### Optional roll bonuses

This effect create additional option to rolls of a particular kind. This can be used to simulate virtues or flaws with circumstances' modifiers (Cyclic Magic, Special circumstances, talisman's attunements, ...)

- Formulaic magic
- Spontaneous magic
- Initiative rolls
- Attack rolls
- Defense rolls

### Might score modifier

Flat modifier to the might score

### Laboratory's aura modifier

Flat modifier to the aura bonus of a lab. 