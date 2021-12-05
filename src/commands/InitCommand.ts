import * as A from 'fp-ts/lib/Array'
import { flow, pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import path from 'path'
import { match } from 'ts-adt'
import { Command } from '../Command'
import { FS, ReadError } from '../files/FS'
import { ChildProcessError, PS } from '../files/PS'
import { WorktreezConfigDirName } from './utils/findWorktreezDir'
import { handleErr } from './utils/handleErr'

export type WorktreezDirExistsError = { _type: 'WorktreezDirExistsError' }
const worktreezDirExistsError = { _type: 'WorktreezDirExistsError' as const }

export const InitCommand: Command<'init', { repo: string }> = {
  addCommand: yargs => yargs.command('init', 'initialize a worktreez project'),
  parseArgs: (argv, rawArgs) => {
    return pipe(
      A.head(rawArgs),
      RTE.of,
      RTE.map(O.filter(command => command === 'init')),
      RTE.map(
        O.chain(() =>
          pipe(
            rawArgs[1],
            O.fromNullable,
            O.chain(u => (typeof u === 'string' ? O.some(u) : O.none)),
            O.map(repo => ({
              _type: 'init' as const,
              repo,
            }))
          )
        )
      )
    )
  },
  executeCommand: context => args => {
    return pipe(
      FS.stat(path.join(process.cwd(), WorktreezConfigDirName)),
      RTE.swap,
      RTE.mapLeft(() => worktreezDirExistsError),
      RTE.chainW(
        match({
          PathNotFound: () => RTE.of(void 0),
          ReadError: err => RTE.left(err),
        })
      ),
      RTE.chainW(() => {
        const cmd = `git clone --bare ${args.repo} ${WorktreezConfigDirName}`
        console.log('> ', cmd)
        return PS.exec(cmd)
      }),
      RTE.map(() => O.none),
      handleErr('WorktreezDirExistsError', err =>
        RTE.fromIO<O.Option<never>, unknown, never>(() => {
          console.log(
            `Skipping init, as ${WorktreezConfigDirName} already exists.`
          )
          return O.none
        })
      )
    )
  },
}
