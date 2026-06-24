import type { Person, Schedule } from './redis';
import { formatDayMonth, weekDates, weekdayLabels } from './week';

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

const divider = '-------------------------';

export function scheduleResponse(schedule: Schedule): Response {
  const dates = weekDates(schedule.week);
  const lineFor = (i: number, person: Person) =>
    `- ${weekdayLabels[i]} (${formatDayMonth(dates[i])}): ${mention(person)}`;

  const presenters = schedule.days.map((a, i) => lineFor(i, a.presenter)).join('\n');
  const curiosities = schedule.days.map((a, i) => lineFor(i, a.curiosity)).join('\n');

  const text = [
    ':mega: *Apresentadores da Daily*',
    'Escolhidos para apresentar o board:',
    presenters,
    divider,
    ':bulb: *Curiosidades da Daily*',
    'Escolhidos para compartilhar curiosidades:',
    curiosities,
  ].join('\n');

  return Response.json({ response_type: 'in_channel', text });
}

export function rosterResponse(people: Person[]): Response {
  if (people.length === 0) {
    return reply('Nenhuma pessoa cadastrada. Use `/daily-presenter add @fulano @ciclano`.');
  }
  const lines = people.map((p, i) => `${i + 1}. <@${p.id}>`);
  return reply(`👥 *Roster (${people.length})*\n${lines.join('\n')}`);
}
