import { Hono } from 'hono';
import type { Env } from '../types/index.js';
import { createCharacter, getCharacter, getInventory } from '../services/character.js';
import { newSession, saveSession } from '../services/session.js';
import { generateBackstory } from '../services/ai-dm.js';
import type { CreateCharacterBody } from '../types/index.js';

export const characterRoutes = new Hono<{ Bindings: Env }>();

// POST /api/character/create
characterRoutes.post('/create', async (c) => {
  let body: CreateCharacterBody;
  try {
    body = await c.req.json<CreateCharacterBody>();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate required fields
  const { name, race, class: cls, abilityRollMethod } = body;
  if (!name?.trim() || !race || !cls) {
    return c.json({ error: 'name, race, and class are required' }, 400);
  }
  if (name.trim().length > 40) {
    return c.json({ error: 'Name must be 40 characters or fewer' }, 400);
  }

  // Simple sanitize — strip HTML-like characters
  const sanitizedName = name.trim().replace(/[<>'"]/g, '');

  const sessionId = crypto.randomUUID();

  try {
    const character = await createCharacter(
      c.env.DB,
      { ...body, name: sanitizedName, abilityRollMethod: abilityRollMethod ?? 'standard' },
      sessionId,
    );

    // Create KV session
    const session = newSession(character.id);
    await saveSession(c.env.SESSION_KV, sessionId, session);

    // Generate AI backstory (best-effort — doesn't fail the request)
    let backstory = '';
    try {
      backstory = await generateBackstory(c.env.AI, character.name, character.race, character.class);
    } catch { /* non-critical */ }

    // Opening narrative seeded into session
    const openingNarrative = [
      `The world of Aethermoor is vast, brutal, and beautiful.`,
      backstory || `${character.name} arrived with nothing but a blade and a burning need to prove themselves.`,
      `You find yourself in ${session.location}. The air smells of candle wax and old wood. A barkeep wipes down the counter without looking up.`,
      `"Another wanderer," he mutters. "You'll either find glory or a shallow grave. Most find the latter."`,
    ].join('\n\n');

    return c.json({
      characterId: character.id,
      sessionId,
      character,
      backstory,
      startNarrative: openingNarrative,
    });
  } catch (err) {
    console.error('Character creation error:', err);
    return c.json({ error: 'Failed to create character' }, 500);
  }
});

// GET /api/character/:id
characterRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  try {
    const character = await getCharacter(c.env.DB, id);
    if (!character) return c.json({ error: 'Character not found' }, 404);

    const inventory = await getInventory(c.env.DB, id);

    // Fetch active quest
    const questRow = await c.env.DB.prepare(
      'SELECT * FROM quests WHERE id = ?'
    ).bind(1).first();

    return c.json({ character, inventory, activeQuest: questRow ?? null });
  } catch (err) {
    console.error('Get character error:', err);
    return c.json({ error: 'Failed to fetch character' }, 500);
  }
});
