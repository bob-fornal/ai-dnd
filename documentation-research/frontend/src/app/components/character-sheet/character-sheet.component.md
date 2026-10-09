# character-sheet.component.ts

`app-character-sheet` is a presentational sidebar panel. It has no inputs and reads everything from `CharacterStateService`.

Files: `.ts`, `.html`, `.css`, `.spec.ts`

## Shows
- Name, level, race, class; an HP bar (`healthy` above 60%, `hurt` 26–60%, `critical` at 25% or below); AC, XP, gold.
- XP progress bar and "XP to next level" (or "Max Level").
- Six ability scores with modifiers and full-name tooltips.
- A "Level Up Available" banner. The ability picker itself lives in the [game console](../game-console/game-console.component.md).

## Connections
**Parents (used by):**
- [../game-console/game-console.component.md](../game-console/game-console.component.md): left sidebar

**Children (uses):**
- [../../services/character-state.service.md](../../services/character-state.service.md)
- [../../models/game.models.md](../../models/game.models.md): `ABILITY_LABELS`, `AbilityKey`
- Styling: [../../../styles.md](../../../styles.md) (`.hp-bar` classes)
