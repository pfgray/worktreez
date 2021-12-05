import * as RTE from 'fp-ts/ReaderTaskEither'
import yargs from 'yargs'
import * as O from 'fp-ts/lib/Option'
import { Context } from './Context'
import { Dir } from './files/Dir'
import { ConsoleEnv } from './cli/ConsoleEnv'
import { WorktreezDirNotFound } from './commands/utils/findWorktreezDir'
import { PathNotFound, ReadError } from './files/FS'
import { BranchDoesNotExist } from './commands/utils/branchExists'
import { ExecError, ParseListError } from './commands/warp/listWorkspaces'
import { WarpPromptError } from './commands/WarpCommand'
import { ChildProcessError } from './files/PS'

export type JumpDir = {
  dir: Dir
}

/**
 * @template K represents the command tag
 * @template T represents the command's parsed arguments
 */
export type Command<K extends string, T extends object> = {
  addCommand(y: yargs.Argv<{}>): yargs.Argv<{}>
  parseArgs: (
    argv: Record<string, unknown>,
    rawArgs: Array<string | number>
  ) => RTE.ReaderTaskEither<
    unknown,
    WorktreezDirNotFound | ReadError | PathNotFound,
    O.Option<{ _type: K } & T>
  >
  executeCommand: (
    context: Context
  ) => (
    t: T
  ) => RTE.ReaderTaskEither<
    ConsoleEnv,
    | BranchDoesNotExist
    | WorktreezDirNotFound
    | PathNotFound
    | ReadError
    | ParseListError
    | ExecError
    | WarpPromptError
    | ChildProcessError,
    O.Option<JumpDir>
  >
}
