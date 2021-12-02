import * as cps from 'child_process'
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as Rd from 'fp-ts/lib/Reader'
import { execError } from '../commands/warp/listWorkspaces'
import { pipe } from 'fp-ts/lib/function'

export type ChildProcessError = {
  _type: 'ChildProcessError'
  exception: cps.ExecException
}
const childProcessError = (
  exception: cps.ExecException
): ChildProcessError => ({
  _type: 'ChildProcessError',
  exception,
})

const exec = pipe(
  RTE.fromTaskEitherK(TE.taskify<string, cps.ExecException, string>(cps.exec)),
  Rd.map(RTE.mapLeft(childProcessError))
)

export const PS = {
  exec,
}
