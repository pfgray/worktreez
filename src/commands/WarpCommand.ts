import { pipe, flow } from 'fp-ts/lib/function'
import { Command } from '../Command'
import * as A from 'fp-ts/lib/Array'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import { AltScreenE } from '../alt/AltScreen'
import * as React from 'react'
import { Instance, render, useInput } from 'ink'
import { WarpView } from './warp/WarpView'
import { listWorktrees } from './warp/listWorkspaces'
import { Dir, liftDir } from '../files/Dir'
import * as NEA from 'fp-ts/lib/NonEmptyArray'

import * as tty from 'tty'
import { FS } from '../files/FS'
import { Context } from '../Context'
import { FolderDetails } from './warp/FolderDetails'
import { findWorktreezDir } from './utils/findWorktreezDir'
import { branchExists, checkBranchExists } from './utils/branchExists'

const traverseRte = O.traverse(RTE.ApplicativePar)

export type WarpPromptError = { _type: 'WarpPromptError' }
const warpPromptError = { _type: 'WarpPromptError' as const }

export const WarpCommand: Command<
  'warp',
  { repo: Dir; branch: O.Option<string> }
> = {
  addCommand: yargs => yargs.command('warp', 'warp to another project'),
  parseArgs: (argv, rawArgs) => {
    return pipe(
      A.head(rawArgs),
      RTE.of,
      RTE.map(O.filter(command => command === 'warp')),
      RTE.chainW(
        traverseRte(() =>
          pipe(
            argv.repo,
            O.fromNullable,
            O.chain(u => (typeof u === 'string' ? O.some(liftDir(u)) : O.none)),
            O.map(RTE.of),
            O.getOrElseW(() => findWorktreezDir(liftDir(process.cwd())))
          )
        )
      ),
      RTE.map(
        flow(
          O.map(repo => ({
            _type: 'warp' as const,
            repo,
            branch: pipe(
              rawArgs[1],
              O.fromNullable,
              O.chain(u => (typeof u === 'string' ? O.some(u) : O.none))
            ),
          }))
        )
      )
    )
  },
  executeCommand: context => args => {
    return pipe(
      RTE.Do,
      RTE.bindW('worktrees', () => listWorktrees(args.repo)),
      RTE.bindW('directory', ({ worktrees }) => {
        // args.repo
        // args.branch

        // if branch is supplied, we'll attempt to switch there immediately, if it is checked out somewhere.
        //   if branch is checked out somewhere, cd into that directory
        //   else prompt the user for a place to check it out
        // else
        //   prompt the user to select a worktree to switch to

        return pipe(
          args.branch,
          O.fold(
            () =>
              promptUserForWarpDir({
                context,
                worktrees,
                skipWorktreesWithChanges: false,
              }),
            branch =>
              pipe(
                worktrees,
                A.findFirstMap(w =>
                  w.details._type === 'branch' && w.details.value === branch
                    ? O.some(w.path)
                    : O.none
                ),
                O.foldW(
                  () =>
                    pipe(
                      branch,
                      checkBranchExists(args.repo),
                      RTE.chainW(() =>
                        promptUserForWarpDir({
                          prePrompt: `Checkout ${branch} in:`,
                          context,
                          worktrees,
                          skipWorktreesWithChanges: true,
                        })
                      )
                    ),
                  branchDir => RTE.of(O.some(branchDir))
                )
              )
          )
        )
      }),
      RTE.map(({ directory }) =>
        pipe(
          directory,
          O.map(dir => ({
            dir,
          }))
        )
      ),
      a => a
      //RTE.orElseW(() => RTE.of(O.none))
    )
  },
}

const promptUserForWarpDir = (options: {
  context: Context
  worktrees: NEA.NonEmptyArray<{
    path: Dir
    details: FolderDetails
  }>
  skipWorktreesWithChanges: boolean
  prePrompt?: string
}) => {
  const { context, worktrees, skipWorktreesWithChanges, prePrompt } = options
  let onExit
  let warpViewInstance: Instance
  return pipe(
    RTE.Do,
    RTE.bindW('enter', () => AltScreenE.enter),
    RTE.bindW('devtty', () => FS.open('/dev/tty', 'a')),
    RTE.bindW('prePrompt', ({ devtty }) =>
      prePrompt ? FS.writeFile(devtty, prePrompt) : RTE.of(void 0)
    ),
    RTE.bindW('prompt', ({ devtty }) =>
      RTE.fromTaskEither(
        TE.tryCatch(
          () => {
            return new Promise<O.Option<Dir>>((resolve, reject) => {
              onExit = (s: O.Option<Dir>) => {
                warpViewInstance.unmount()
                resolve(s)
              }
              warpViewInstance = render(
                React.createElement(WarpView, {
                  onExit,
                  context,
                  worktrees,
                  skipWorktreesWithChanges,
                }),
                {
                  stdout: new tty.WriteStream(devtty),
                }
              )
            })
          },
          () => {
            return warpPromptError
          }
        )
      )
    ),
    RTE.bindW('exit', () => AltScreenE.exit),
    RTE.map(({ prompt }) => prompt)
  )
}
