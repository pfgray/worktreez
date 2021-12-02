import { flow, pipe } from 'fp-ts/lib/function'
import { Dir } from '../../files/Dir'
import { PS } from '../../files/PS'

import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import { parseList } from './parseList'
import { ExecException } from 'child_process'

export type ParseListError = {
  _type: 'ParseListError'
  source: string
}
export const parseListError = (source: string): ParseListError => ({
  _type: 'ParseListError',
  source,
})

export type ExecError = {
  _type: 'ExecError'
  command: string
  reason: ExecException
}
export const execError = (
  command: string,
  reason: ExecException
): ExecError => ({
  _type: 'ExecError',
  command,
  reason,
})

export const listWorktrees = (path: Dir) =>
  pipe(
    PS.exec(`git -C ${path} worktree list`),
    //. RTE.mapLeft(reason => execError(`git -C ${path} worktree list`, reason)),
    RTE.chainW(source =>
      pipe(
        source,
        parseList,
        RTE.fromEither,
        RTE.mapLeft(err => parseListError(source))
      )
    )
  )
