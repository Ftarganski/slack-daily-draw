import { drawWeek } from '@/lib/draw';
import { env } from '@/lib/env';
import {
  addToRoster,
  getRoster,
  getSchedule,
  removeFromRoster,
  replaceSchedule,
  saveScheduleIfAbsent,
} from '@/lib/redis';
import { parseMentions, reply, rosterResponse, scheduleResponse } from '@/lib/slack';
import { verifySlackRequest } from '@/lib/verify';
import { currentWeekKey, todayIndex } from '@/lib/week';

export const runtime = 'edge';

const help = [
  '*Daily Draw* — comandos:',
  '`/daily` — escala da semana (sorteia se ainda não houver) com hoje em destaque',
  '`/daily semana` — escala completa da semana',
  '`/daily add @a @b` — cadastra pessoas',
  '`/daily remove @a` — remove pessoas',
  '`/daily lista` — quem está cadastrado',
  '`/daily reset` — re-sorteia a semana (apenas admins)',
].join('\n');

export async function POST(request: Request): Promise<Response> {
  const { ok, body } = await verifySlackRequest(request, env.signingSecret());
  if (!ok) return new Response('invalid signature', { status: 401 });

  const params = new URLSearchParams(body);
  const teamId = params.get('team_id') ?? '';
  const channelId = params.get('channel_id') ?? '';
  const userId = params.get('user_id') ?? '';
  const text = (params.get('text') ?? '').trim();

  const allowedTeam = env.allowedTeamId();
  if (allowedTeam && teamId !== allowedTeam) {
    return reply('⛔ Workspace não autorizado.');
  }
  const allowedChannel = env.allowedChannelId();
  if (allowedChannel && channelId !== allowedChannel) {
    return reply('⛔ Use o comando no canal autorizado da daily.');
  }

  const tz = env.timezone();
  const week = currentWeekKey(tz);
  const [sub, ...rest] = text.split(/\s+/).filter(Boolean);
  const args = rest.join(' ');
  const command = (sub ?? '').toLowerCase();

  switch (command) {
    case '':
    case 'hoje':
    case 'semana':
      return showSchedule(teamId, week, tz, command !== 'semana');

    case 'add': {
      const people = parseMentions(args);
      if (people.length === 0) {
        return reply('Mencione ao menos uma pessoa: `/daily add @fulano`.');
      }
      await addToRoster(teamId, people);
      return reply(`✅ Cadastrado: ${people.map((p) => `<@${p.id}>`).join(', ')}`);
    }

    case 'remove': {
      const people = parseMentions(args);
      if (people.length === 0) {
        return reply('Mencione ao menos uma pessoa: `/daily remove @fulano`.');
      }
      const removed = await removeFromRoster(
        teamId,
        people.map((p) => p.id),
      );
      return reply(`🗑️ Removidas ${removed} pessoa(s).`);
    }

    case 'lista':
    case 'list':
      return rosterResponse(await getRoster(teamId));

    case 'reset': {
      if (!env.adminIds().includes(userId)) {
        return reply('⛔ Apenas admins podem re-sortear.');
      }
      const roster = await getRoster(teamId);
      if (roster.length < 2) {
        return reply('Cadastre ao menos 2 pessoas antes de sortear.');
      }
      const schedule = drawWeek(week, roster);
      await replaceSchedule(teamId, week, schedule);
      return scheduleResponse(schedule, todayIndex(tz));
    }

    case 'help':
    case 'ajuda':
      return reply(help);

    default:
      return reply(`Comando desconhecido: \`${command}\`.\n\n${help}`);
  }
}

async function showSchedule(
  teamId: string,
  week: string,
  tz: string,
  highlightToday: boolean,
): Promise<Response> {
  let schedule = await getSchedule(teamId, week);
  if (!schedule) {
    const roster = await getRoster(teamId);
    if (roster.length < 2) {
      return reply(
        'Ainda não há sorteio e o roster tem menos de 2 pessoas.\nCadastre com `/daily add @fulano @ciclano`.',
      );
    }
    schedule = await saveScheduleIfAbsent(teamId, week, drawWeek(week, roster));
  }
  return scheduleResponse(schedule, highlightToday ? todayIndex(tz) : -1);
}
