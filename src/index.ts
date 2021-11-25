import * as RTE from 'fp-ts/ReaderTaskEither'
import * as A from 'fp-ts/Array'
import * as RA from 'fp-ts/ReadonlyArray'
import * as RNEA from 'fp-ts/lib/ReadonlyNonEmptyArray'
import * as NEA from 'fp-ts/NonEmptyArray'
import * as O from 'fp-ts/Option'
import { identity, pipe } from 'fp-ts/function'
import { render } from 'ink'
import { makeMatchers } from 'ts-adt/MakeADT'
import { hideBin } from 'yargs/helpers'
import { ADT, match } from 'ts-adt'
import yargs, { parse } from 'yargs'
import { Config } from './Config'
import { ProjectsCommand } from './commands/ProjectsCommand'
import { Command, JumpDir } from './Command'
import * as TE from 'fp-ts/TaskEither'
import { DirC } from './files/Dir'
import * as E from 'fp-ts/Either'
import { WarpCommand } from './commands/WarpCommand'
import { ConsoleEnv } from './cli/ConsoleEnv'
import { StdoutConsoleEnv } from './cli/StdoutConsoleEnv'

//  wt list-all
//    list all projects and their worktrees
//  wt list
//    list worktrees in the current project
//  wt jump
//    move to a worktree
//  wt warp
//    move to a worktree in a different project
//  wt co <- checkout a branch if not checked out
//    see if the branch is already checked out here,
//    if not, then ask to check out in an existing directory, or create a new worktree

const homeDir = DirC.decode('~')

const Commands = [ProjectsCommand, WarpCommand]

const handleCommand =
  (
    context: {
      config: Config
    },
    argv: Record<string, unknown>,
    rawArgs: (string | number)[]
  ) =>
  <K extends string, T extends object>(c: Command<K, T>) =>
    pipe(
      c.parseArgs(argv, rawArgs),
      RTE.chainW(args =>
        pipe(
          args,
          O.foldW(
            () => RTE.of<ConsoleEnv, never, O.Option<JumpDir>>(O.none),
            c.executeCommand(context)
          )
        )
      )
    )

const initializeArgs = () =>
  TE.tryCatch(
    () => {
      const yargParsedArgs = pipe(
        Commands,
        A.reduce(yargs(hideBin(process.argv)), (y, c) => c.addCommand(y))
      )
        .command('help', 'view this help message')
        .scriptName('gbt')
      const parsedArgsV = yargParsedArgs.argv
      if (parsedArgsV instanceof Promise) {
        return parsedArgsV
      } else {
        return Promise.resolve(parsedArgsV)
      }
    },
    reason => ({ _type: 'ArgParseError' as const, reason })
  )

const readConfig = (configFileLocationOverride: O.Option<string>) =>
  pipe(
    RTE.fromEither(homeDir),
    // RTE.chainW(),
    RTE.map(home => ({ config: { projects: [home] } })),
    RTE.mapLeft(reason => ({ _type: 'ConfigParseError' as const, reason }))
  )

pipe(
  RTE.Do,
  RTE.bindW('args', () => initializeArgs),
  RTE.bindW('config', () => readConfig(O.none)),
  RTE.chainW(({ args, config }) => {
    return pipe(
      Commands,
      RTE.traverseArray(handleCommand(config, args, args._))
    )
  }),
  e =>
    RTE.run(e, StdoutConsoleEnv).then(
      E.fold(
        match({
          ArgParseError: err => {
            console.log('error parsing args')
          },
          ConfigParseError: () => {
            console.log('error parsing config')
          },
        }),
        pushDir => {
          // todo finish this
          pipe(
            pushDir,
            RA.filterMap(identity),
            O.fromPredicate(RA.isNonEmpty),
            O.map(RNEA.head),
            O.map(dir => {
              console.log(dir.dir)
            })
          )
        }
      )
    )
)
