export type Movie = {
  id: number
  title: string
  year: number
  runtime: number
  genres: readonly number[]
  genreLabel: string
  backdrop: string
  synopsis: string
}

export const movies: readonly Movie[] = [
  {
    id: 120467,
    title: 'The Grand Budapest Hotel',
    year: 2014,
    runtime: 100,
    genres: [35, 18],
    genreLabel: 'Comedy · Drama',
    backdrop: '/backdrops/grand-budapest.jpg',
    synopsis:
      'A devoted concierge and his young protégé get caught up in a stolen painting, a disputed inheritance, and a rapidly changing Europe.',
  },
  {
    id: 546554,
    title: 'Knives Out',
    year: 2019,
    runtime: 131,
    genres: [35, 80, 9648],
    genreLabel: 'Mystery · Comedy',
    backdrop: '/backdrops/knives-out.jpg',
    synopsis:
      'Detective Benoit Blanc investigates the death of a wealthy crime novelist. In a house full of secrets, everyone has a story to tell.',
  },
  {
    id: 157336,
    title: 'Interstellar',
    year: 2014,
    runtime: 169,
    genres: [12, 18, 878],
    genreLabel: 'Sci-fi · Adventure',
    backdrop: '/backdrops/interstellar.jpg',
    synopsis:
      'A team of explorers travels through a wormhole, crossing unimaginable distances in search of a future for humanity.',
  },
  {
    id: 10315,
    title: 'Fantastic Mr. Fox',
    year: 2009,
    runtime: 87,
    genres: [12, 16, 35, 10751],
    genreLabel: 'Animation · Comedy',
    backdrop: '/backdrops/fantastic-mr-fox.jpg',
    synopsis:
      'Mr. Fox returns to his chicken-stealing ways. Three furious farmers retaliate, putting his family and their entire underground community at risk.',
  },
  {
    id: 329865,
    title: 'Arrival',
    year: 2016,
    runtime: 116,
    genres: [18, 878, 9648],
    genreLabel: 'Sci-fi · Mystery',
    backdrop: '/backdrops/arrival.jpg',
    synopsis:
      'When alien spacecraft arrive on Earth, a linguist is asked to make contact and discover what their visitors are trying to say.',
  },
  {
    id: 1124,
    title: 'The Prestige',
    year: 2006,
    runtime: 130,
    genres: [18, 9648, 878],
    genreLabel: 'Mystery · Drama',
    backdrop: '/backdrops/prestige.jpg',
    synopsis:
      'Two rival magicians become consumed by the pursuit of the perfect illusion, taking their competition to increasingly dangerous extremes.',
  },
]

export function pickMovie(currentId: number, seen: readonly number[]) {
  const unseen = movies.filter((movie) => !seen.includes(movie.id))
  const candidates =
    unseen.length > 0
      ? unseen
      : movies.filter((movie) => movie.id !== currentId)
  return candidates[Math.floor(Math.random() * candidates.length)]
}
export function formatRuntime(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
