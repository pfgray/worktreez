import { pipe } from 'fp-ts/function'
import * as RTE from 'fp-ts/ReaderTaskEither'

export const handleErr =
  <T extends E1['_type'], E1 extends { _type: string }, E2, R2, B>(
    tag: T,
    f: (err: Extract<E1, { _type: T }>) => RTE.ReaderTaskEither<R2, E2, B>
  ) =>
  <R1, A>(
    rte: RTE.ReaderTaskEither<R1, E1, A>
  ): RTE.ReaderTaskEither<R1 & R2, Exclude<E1, { _type: T }> | E2, A | B> =>
    pipe(
      rte,
      RTE.orElseW<E1, R1 & R2, Exclude<E1, { _type: T }> | E2, A | B>(err =>
        err._type === tag
          ? f(err as any)
          : RTE.left(err as Exclude<E1, { _type: T }>)
      ),
      a => a
    )
