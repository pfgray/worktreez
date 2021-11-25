import { pipe, flow } from "fp-ts/lib/function";
import { Command } from "../Command";
import * as A from 'fp-ts/lib/Array';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import * as O from 'fp-ts/lib/Option';
import { gradientForStr } from "../cli/StdoutConsoleEnv";

export const ProjectsCommand: Command<"projects", {}> = {
  addCommand: (yargs) =>
    yargs.command(
      "projects",
      "list every project"
    ),
  parseArgs: (argv, rawArgs) =>
    pipe(
      A.head(rawArgs),
      RTE.of,
      RTE.map(flow(O.filter((command) =>
        command === "projects"
      ), O.map(() => ({ _type: "projects" as const }))))
    ),
  executeCommand: (context) => (args) =>
    RTE.fromIO(() => {
      context.config.projects.forEach(w => {
        console.log(`${gradientForStr(w)(w)}`)
      })
      return O.none
    })
};