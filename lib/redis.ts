import { Redis } from '@upstash/redis';

let client: Redis | null = null;

function redis(): Redis {
  if (!client) client = Redis.fromEnv();
  return client;
}

export type Person = { id: string; name: string };

export type DayAssignment = {
  day: string;
  presenter: Person;
  curiosity: Person;
};

export type Schedule = {
  week: string;
  days: DayAssignment[];
  createdAt: string;
};

function rosterKey(teamId: string): string {
  return `roster:${teamId}`;
}

function drawKey(teamId: string, week: string): string {
  return `draw:${teamId}:${week}`;
}

export async function getRoster(teamId: string): Promise<Person[]> {
  const data = await redis().hgetall<Record<string, string>>(rosterKey(teamId));
  if (!data) return [];
  return Object.entries(data)
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addToRoster(teamId: string, people: Person[]): Promise<void> {
  if (people.length === 0) return;
  const entries: Record<string, string> = {};
  for (const person of people) entries[person.id] = person.name;
  await redis().hset(rosterKey(teamId), entries);
}

export async function removeFromRoster(teamId: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  return redis().hdel(rosterKey(teamId), ...ids);
}

export async function getSchedule(teamId: string, week: string): Promise<Schedule | null> {
  return redis().get<Schedule>(drawKey(teamId, week));
}

const thirtyDays = 60 * 60 * 24 * 30;

export async function saveScheduleIfAbsent(
  teamId: string,
  week: string,
  schedule: Schedule,
): Promise<Schedule> {
  const result = await redis().set(drawKey(teamId, week), schedule, {
    nx: true,
    ex: thirtyDays,
  });
  if (result === 'OK') return schedule;
  const existing = await redis().get<Schedule>(drawKey(teamId, week));
  return existing ?? schedule;
}

export async function replaceSchedule(
  teamId: string,
  week: string,
  schedule: Schedule,
): Promise<void> {
  await redis().set(drawKey(teamId, week), schedule, { ex: thirtyDays });
}
