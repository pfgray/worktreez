import { flow, pipe } from 'fp-ts/lib/function'
import { Dir } from '../../files/Dir'
import { PS } from '../../files/PS'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'

export const branchExists = (repo: Dir) => (branch: string) =>
  pipe(
    PS.exec(`git -C ${repo} branch`),
    RTE.map(results => results.split('\n').map(b => b.trim())),
    RTE.map(
      flow(
        A.findFirst(a => a === branch),
        O.isSome
      )
    )
  )

export type BranchDoesNotExist = { _type: 'BranchDoesNotExist'; branch: string }

const branchDoesNotExist = (branch: string): BranchDoesNotExist =>
  ({
    _type: 'BranchDoesNotExist',
    branch,
  } as const)
export const checkBranchExists = (repo: Dir) => (branch: string) =>
  pipe(
    branchExists(repo)(branch),
    RTE.chainW(exists =>
      exists ? RTE.of(void 0) : RTE.left(branchDoesNotExist(branch))
    )
  )
