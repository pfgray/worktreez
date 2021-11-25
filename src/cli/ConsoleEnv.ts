import * as RTE from 'fp-ts/ReaderTaskEither'

export interface ConsoleEnv {
  log: (out: string) => void
  error: (err: string) => void
  tty: (out: string) => void
}

export const ConsoleE = {
  log: (msg: string) =>
    RTE.asksReaderTaskEither<ConsoleEnv, never, void>(console =>
      RTE.fromIO(() => console.log(msg))
    ),
  error: (err: string) =>
    RTE.asksReaderTaskEither<ConsoleEnv, never, void>(console =>
      RTE.fromIO(() => console.error(err))
    ),
  tty: (err: string) =>
    RTE.asksReaderTaskEither<ConsoleEnv, never, void>(console =>
      RTE.fromIO(() => console.tty(err))
    ),
}
