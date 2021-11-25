import { flow, pipe } from "fp-ts/lib/function";
import { Dir } from "../../files/Dir";
import { PS } from "../../files/PS";

import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { parseList } from "./parseList";

export const listWorkspaces = (path: Dir) =>
  pipe(
    PS.exec(`git -C ${path} worktree list`),
    RTE.mapLeft(reason => ({_type: 'ExecError', message: `Error running: \`git -C ${path} worktree list\`\nreason: ${reason}`})),
    RTE.chainW(flow(parseList, RTE.fromEither, RTE.mapLeft(err => `Error parsing output of: \`git -C ${path} worktree list\`\nerr was:\n${err}`))),
  )