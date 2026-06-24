import type { DayAssignment, Person, Schedule } from './redis';
import { weekdays } from './week';

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function drawWeek(week: string, roster: Person[]): Schedule {
  if (roster.length < 2) {
    throw new Error('roster too small');
  }

  const presenters = shuffle(roster);
  const curiosities = shuffle(roster);

  const days: DayAssignment[] = weekdays.map((day, i) => {
    const presenter = presenters[i % presenters.length];
    let curiosity = curiosities[i % curiosities.length];
    if (curiosity.id === presenter.id) {
      curiosity = curiosities[(i + 1) % curiosities.length];
    }
    return { day, presenter, curiosity };
  });

  return { week, days, createdAt: new Date().toISOString() };
}
