import { concat, pipe, tap, __ } from "ramda";

const options = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
  timeZone: "America/Chicago",
};

export const log = (message: string) =>
  pipe(
    concat("["),
    concat(__, "]: "),
    concat(__, message),
    console.log
  )(Intl.DateTimeFormat("en-US", options).format(Date.now()));

export const tapLog = <T>(message: string) => tap<T>(() => log(message));
