import * as RTE from 'fp-ts/ReaderTaskEither'
import yargs from 'yargs'
import * as O from 'fp-ts/lib/Option'
import { Context } from './Context'
import { Dir } from './files/Dir'
import { ConsoleEnv } from './cli/ConsoleEnv'

export type JumpDir = {
  dir: Dir
}

export type Command<K extends string, T extends object> = {
  addCommand(y: yargs.Argv<{}>): yargs.Argv<{}>
  parseArgs: (
    argv: Record<string, unknown>,
    rawArgs: Array<string | number>
  ) => RTE.ReaderTaskEither<unknown, never, O.Option<{ _type: K } & T>>
  executeCommand: (
    context: Context
  ) => (t: T) => RTE.ReaderTaskEither<ConsoleEnv, never, O.Option<JumpDir>>
}
