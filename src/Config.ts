import { pipe } from "fp-ts/Function";
import { Eq } from "fp-ts/lib/Eq";
import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";
import reporter from "io-ts-reporters";
import { DirC } from "./files/Dir";
import * as RTE from 'fp-ts/ReaderTaskEither'

export const ConfigC = t.type({
  projects: t.array(DirC)
})

export type Config = t.TypeOf<typeof ConfigC>

export const parseConfig = (configPath: string) => (contents: string) =>
  pipe(
    RTE.fromEither(ConfigC.decode(JSON.parse(contents))),
    RTE.mapLeft((errs) => ({
      _tag: "ParseConfigError" as const,
      //errors: errs,
      parsedError: reporter.report(E.left(errs)),
      configPath,
    }))
  );
