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
import { listWorkspaces } from './warp/listWorkspaces'
import { Dir, DirC } from '../files/Dir'

import * as fs from 'fs'

import * as tty from 'tty'
import { FS } from '../files/FS'

// const wut = new tty.WriteStream('')

export const WarpCommand: Command<'warp', { repo: O.Option<Dir> }> = {
  addCommand: yargs => yargs.command('warp', 'warp to another project'),
  parseArgs: (argv, rawArgs) =>
    pipe(
      A.head(rawArgs),
      RTE.of,
      RTE.map(
        flow(
          O.filter(command => command === 'warp'),
          O.map(() => ({
            _type: 'warp' as const,
            repo: pipe(
              argv.repo,
              O.fromNullable,
              O.chain(u => (typeof u === 'string' ? O.some(u) : O.none)),
              O.chain(flow(DirC.decode, O.fromEither))
            ),
          }))
        )
      )
    ),
  executeCommand: context => args => {
    return pipe(
      RTE.Do,
      // todo: repo should be optional
      RTE.bind('repo', () =>
        RTE.fromOption(() => ({
          _type: 'NoProject',
          message: "Repo wasn't supplied",
        }))(args.repo)
      ),
      RTE.bindW('workspaces', ({ repo }) => listWorkspaces(repo)),
      RTE.bindW('enter', () => AltScreenE.enter),
      RTE.bindW('devtty', () => FS.open('/dev/tty', 'a')),
      RTE.bindW('directory', ({ repo, workspaces, devtty }) => {
        let onExit
        let warpViewInstance: Instance
        return RTE.fromTaskEither(
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
                    workspaces,
                  }),
                  {
                    // YOLO
                    stdout: new tty.WriteStream(devtty),
                  }
                )
              })
            },
            () => {
              return {}
            }
          )
        )
      }),
      RTE.bindW('exit', () => AltScreenE.exit),
      RTE.map(({ directory }) =>
        pipe(
          directory,
          O.map(dir => ({
            dir,
          }))
        )
      ),
      RTE.orElseW(() => RTE.of(O.none))
    )
  },
}
