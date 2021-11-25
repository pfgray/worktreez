import * as IO from 'fp-ts/IO'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { ConsoleEnv } from '../cli/ConsoleEnv'

const enterAltScreenCommand = '\x1b[?1049h'
const leaveAltScreenCommand = '\x1b[?1049l'

export const AltScreenE = {
  enter: RTE.asksReaderTaskEither<ConsoleEnv, never, void>(console =>
    RTE.fromIO(() => console.tty(enterAltScreenCommand))
  ),
  exit: RTE.asksReaderTaskEither<ConsoleEnv, never, void>(console =>
    RTE.fromIO(() => console.tty(leaveAltScreenCommand))
  ),
}
