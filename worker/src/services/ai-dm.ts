import type { Ai } from '@cloudflare/workers-types';
import type { Character, SessionData, AIDMResponse, CombatState, DiceRoll } from '../types/index.js';

// ─── Schema description injected into every prompt ──────────────────────────
const RESPONSE_SCHEMA = JSON.stringify({
  narrative: 'string (1-4 vivid paragraphs of story prose)',
  gameStateChanges: {
    hpDelta: 'number | null (positive = heal, negative = damage)',
    xpGained: 'number | null',
    goldDelta: 'number | null',
    itemsAdded: 'string[] (item names found/given)',
    itemsRemoved: 'string[] (item names consumed/lost)',
    locationChange: 'string | null (new location name if moved)',
    questUpdate: 'string | null (short quest progress note)',
    combatInitiated: 'boolean',
    combatEnded: 'boolean',
  },
  suggestedActions: 'string[] (2-4 short player action suggestions)',
  diceRolls: 'Array<{type:string, result:number, reason:string}> (dice rolls you narrated)',
}, null, 2);

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert, creative, and unflinching Dungeon Master for a dark, mature D&D 5e-inspired text adventure game.

Tone: Gritty, immersive, adult fantasy. Violence has weight; choices have consequences. Moral ambiguity is welcome. NPC deaths, betrayal, horror, and dark humour are fair game. Avoid gratuitous content for its own sake, but do not shy away from the darkness that makes heroism meaningful.

Your role:
- Describe vivid, immersive scenes that react meaningfully to the player's choices.
- Drive the story forward with tension, dread, mystery, dark humour, and real consequence.
- When skill checks matter (Perception, Stealth, Persuasion, Athletics, etc.) weave them into the narrative poetically — describe the dice hitting the table, the moment of fate, the outcome in prose. Never present raw numbers; always interpret them as story.
- Keep the world consistent with established locations, quests, and prior events.
- NEVER break character. NEVER acknowledge being an AI. NEVER mention JSON or schemas.
- Always return ONLY a valid JSON object matching the exact schema provided. No markdown fences, no extra text, no explanation — just the JSON object.

Rules:
- hpDelta: only set if the narrative clearly involves healing or taking damage NOT from combat (combat damage is resolved separately). Use null otherwise.
- combatInitiated: true ONLY when a hostile creature explicitly attacks or the player starts a fight.
- combatEnded: true ONLY when combat is concluded in the narrative.
- suggestedActions: 2-4 short phrases (max 6 words each) a player might logically do next.
- diceRolls: include rolls you narrate in prose (e.g. a Perception check you describe). Do NOT include attack/damage rolls — those are resolved by the system.`;

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildUserPrompt(
  character: Character,
  session: SessionData,
  playerAction: string,
  combatContext?: string,
): string {
  const historyText = session.history.length > 0
    ? session.history
        .slice(-10)
        .map(h => `${h.role === 'player' ? 'PLAYER' : 'DM'}: ${h.content}`)
        .join('\n')
    : '(This is the beginning of the adventure.)';

  const abilityStr = `STR ${character.str} / DEX ${character.dex} / CON ${character.con} / INT ${character.int} / WIS ${character.wis} / CHA ${character.cha}`;

  let prompt = `GAME STATE:
- Character: ${character.name}, Level ${character.level} ${character.race} ${character.class}
- HP: ${character.hp}/${character.max_hp} | AC: ${character.ac} | Gold: ${character.gold}gp | XP: ${character.xp}
- Abilities: ${abilityStr}
- Location: ${session.location}
- Active Quest: ${session.activeQuestSummary}

RECENT HISTORY (last 10 turns):
${historyText}`;

  if (combatContext) {
    prompt += `\n\nCOMBAT CONTEXT (pre-resolved by the system — narrate these results vividly):\n${combatContext}`;
  }

  prompt += `\n\nPLAYER ACTION:\n"${playerAction.trim()}"

Respond ONLY with a JSON object matching this exact schema:
${RESPONSE_SCHEMA}`;

  return prompt;
}

// ─── Primary AI DM call ───────────────────────────────────────────────────────
export async function askDM(
  ai: Ai,
  character: Character,
  session: SessionData,
  playerAction: string,
  combatContext?: string,
): Promise<AIDMResponse> {
  const userPrompt = buildUserPrompt(character, session, playerAction, combatContext);

  let rawText = '';

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.85,
    }) as { response?: string } | ReadableStream;

    if (response instanceof ReadableStream) {
      // Shouldn't happen with non-streaming calls, but guard it
      throw new Error('Unexpected streaming response from Worker AI');
    }
    // Guard: local Wrangler stub may return a non-string value; coerce defensively
    const raw = (response as any).response;
    rawText = typeof raw === 'string' ? raw : '';
  } catch (err) {
    // Fallback: try mistral
    try {
      const fallback = await ai.run('@cf/mistral/mistral-7b-instruct-v0.1', {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens: 1024,
      }) as { response?: string };
      const raw2 = (fallback as any).response;
      rawText = typeof raw2 === 'string' ? raw2 : '';
    } catch {
      return fallbackNarrative(playerAction);
    }
  }

  return parseAIResponse(rawText, playerAction);
}

// ─── Parse & validate AI response ────────────────────────────────────────────
function parseAIResponse(raw: string, playerAction: string): AIDMResponse {
  // Guard against non-string values from the local Wrangler dev AI stub
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return fallbackNarrative(playerAction);
  }

  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<AIDMResponse>;

    return {
      narrative: typeof parsed.narrative === 'string' && parsed.narrative.length > 0
        ? parsed.narrative
        : 'The world holds its breath as your words echo into the shadows.',
      gameStateChanges: {
        hpDelta:          parsed.gameStateChanges?.hpDelta          ?? null,
        xpGained:         parsed.gameStateChanges?.xpGained         ?? null,
        goldDelta:        parsed.gameStateChanges?.goldDelta         ?? null,
        itemsAdded:       Array.isArray(parsed.gameStateChanges?.itemsAdded)   ? parsed.gameStateChanges!.itemsAdded   : [],
        itemsRemoved:     Array.isArray(parsed.gameStateChanges?.itemsRemoved) ? parsed.gameStateChanges!.itemsRemoved : [],
        locationChange:   parsed.gameStateChanges?.locationChange   ?? null,
        questUpdate:      parsed.gameStateChanges?.questUpdate      ?? null,
        combatInitiated:  parsed.gameStateChanges?.combatInitiated  === true,
        combatEnded:      parsed.gameStateChanges?.combatEnded      === true,
      },
      suggestedActions: Array.isArray(parsed.suggestedActions)
        ? parsed.suggestedActions.slice(0, 4)
        : ['Look around', 'Search the area', 'Listen carefully', 'Move on'],
      diceRolls: Array.isArray(parsed.diceRolls)
        ? (parsed.diceRolls as DiceRoll[]).slice(0, 8)
        : [],
    };
  } catch {
    return fallbackNarrative(playerAction);
  }
}

// ─── Graceful fallback (AI unavailable / parse failed) ───────────────────────
function fallbackNarrative(playerAction: string): AIDMResponse {
  return {
    narrative: `You attempt to ${playerAction.toLowerCase()}. The world shifts around you — shadows lengthen, torches flicker. Something stirs in the distance, just beyond sight. The moment passes, leaving only silence and the weight of possibility.`,
    gameStateChanges: {
      hpDelta: null, xpGained: null, goldDelta: null,
      itemsAdded: [], itemsRemoved: [],
      locationChange: null, questUpdate: null,
      combatInitiated: false, combatEnded: false,
    },
    suggestedActions: ['Look around', 'Proceed carefully', 'Listen for sounds', 'Rest a moment'],
    diceRolls: [],
  };
}

// ─── Dynamic quest generation ─────────────────────────────────────────────────
export interface GeneratedQuest {
  title: string;
  description: string;
  location: string;
  hook: string;         // 1-sentence in-world hook (NPC dialogue / notice board)
  xp_reward: number;
  gold_reward: number;
}

export async function generateQuest(
  ai: Ai,
  character: Character,
  currentLocation: string,
): Promise<GeneratedQuest> {
  const schema = JSON.stringify({
    title: 'string',
    description: 'string (2-3 sentences of quest premise)',
    location: 'string (where the quest takes place)',
    hook: 'string (1-sentence in-world hook — what an NPC says or what the notice reads)',
    xp_reward: `number (appropriate for level ${character.level})`,
    gold_reward: 'number (reasonable gold)',
  });

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: `You are a Dungeon Master creating a dark, mature fantasy quest for a ${character.race} ${character.class} adventurer at Level ${character.level}. Return ONLY valid JSON — no markdown, no extra text.`,
        },
        {
          role: 'user',
          content: `Generate a fresh, dark, morally complex quest hook for ${character.name} currently in ${currentLocation}. Appropriate difficulty for Level ${character.level}. Return JSON matching: ${schema}`,
        },
      ],
      max_tokens: 400,
      temperature: 1.0,
    }) as { response?: string };

    const raw = (response.response ?? '').replace(/```(?:json)?/g, '').trim();
    const parsed = JSON.parse(raw) as Partial<GeneratedQuest>;

    return {
      title:        parsed.title        ?? 'A Dark Errand',
      description:  parsed.description  ?? 'Something sinister stirs nearby.',
      location:     parsed.location     ?? currentLocation,
      hook:         parsed.hook         ?? '"There\'s coin in it for you — if you\'re not squeamish."',
      xp_reward:    typeof parsed.xp_reward   === 'number' ? parsed.xp_reward   : character.level * 150,
      gold_reward:  typeof parsed.gold_reward === 'number' ? parsed.gold_reward : character.level * 30,
    };
  } catch {
    return {
      title: 'Blood on the Road',
      description: 'A merchant caravan was ambushed on the road east of here. Survivors are few and the perpetrators have not fled far.',
      location: 'Eastern Road',
      hook: '"Please — they took everything. My family. There\'s nothing left but revenge."',
      xp_reward: character.level * 150,
      gold_reward: character.level * 30,
    };
  }
}

// ─── Generate AI backstory ────────────────────────────────────────────────────
export async function generateBackstory(
  ai: Ai,
  name: string,
  race: string,
  cls: string,
): Promise<string> {
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a creative fantasy writer. Write a 2-sentence character backstory. Return ONLY the backstory text — no labels, no quotes.',
        },
        {
          role: 'user',
          content: `Write a compelling 2-sentence backstory for a D&D character named ${name}, a ${race} ${cls}.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.9,
    }) as { response?: string };
    return response.response?.trim() ?? '';
  } catch {
    return `${name} emerged from humble beginnings, driven by a restless spirit and an unquenchable hunger for adventure. Fate has brought them to this crossroads — and the road ahead promises nothing but challenge.`;
  }
}

// ─── Generate level-up narrative ─────────────────────────────────────────────
export async function generateLevelUpNarrative(
  ai: Ai,
  character: Character,
  newLevel: number,
): Promise<string> {
  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a Dungeon Master. Write 1–2 vivid sentences narrating a character reaching a new level. No JSON. Just prose.',
        },
        {
          role: 'user',
          content: `${character.name} the ${character.race} ${character.class} has just reached Level ${newLevel}! Write a 1-2 sentence narrative of this moment of growth.`,
        },
      ],
      max_tokens: 120,
      temperature: 0.9,
    }) as { response?: string };
    return response.response?.trim() ?? `${character.name} feels a surge of power — Level ${newLevel} reached!`;
  } catch {
    return `A surge of energy flows through ${character.name} as they reach Level ${newLevel}, their skills and resolve sharpened by hard-won experience.`;
  }
}
