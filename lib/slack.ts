import type { Person, Schedule } from './redis';

type ResponseType = 'ephemeral' | 'in_channel';

export function reply(text: string, type: ResponseType = 'ephemeral') {
  return Response.json({ response_type: type, text });
}

const mentionPattern = /<@([UW][A-Z0-9]+)\|?([^>]*)>/g;

export function parseMentions(text: string): Person[] {
  const found = new Map<string, Person>();
  for (const match of text.matchAll(mentionPattern)) {
    const id = match[1];
    const name = match[2] || id;
    found.set(id, { id, name });
  }
  return Array.from(found.values());
}

function mention(person: Person): string {
  return `<@${person.id}>`;
}

export function scheduleResponse(schedule: Schedule, highlightIndex: number): Response {
  const lines = schedule.days.map((assignment, i) => {
    const marker = i === highlightIndex ? '➡️ *' : '';
    const close = i === highlightIndex ? '*' : '';
    return `${marker}${close} *${assignment.day}* — 🎤 ${mention(assignment.presenter)}  |  💡 ${mention(assignment.curiosity)}`;
  });

  const header =
    highlightIndex >= 0
      ? `🗓️ *Daily ${schedule.week}* — hoje em destaque:`
      : `🗓️ *Daily ${schedule.week}*:`;

  return Response.json({
    response_type: 'in_channel',
    text: `${header}\n${lines.join('\n')}\n\n🎤 apresenta  •  💡 curiosidade`,
  });
}

export function rosterResponse(people: Person[]): Response {
  if (people.length === 0) {
    return reply('Nenhuma pessoa cadastrada. Use `/daily-presenter add @fulano @ciclano`.');
  }
  const lines = people.map((p, i) => `${i + 1}. <@${p.id}>`);
  return reply(`👥 *Roster (${people.length})*\n${lines.join('\n')}`);
}
