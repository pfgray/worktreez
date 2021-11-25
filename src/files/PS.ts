import * as cps from "child_process";
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'

const exec = RTE.fromTaskEitherK(TE.taskify<string, cps.ExecException, string>(cps.exec))

export const PS = {
  exec
};
