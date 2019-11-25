import minimist from "minimist";
import { BadRequest } from "../errors";
export class BaseCommandRequest {
  body: any = "";
  qs: any = {};
  params: any = {};
  path: string = "";
  headers: any = {};
  method: string = "";
}
function splitCommand(line: string) {
  let regexpMatches = line.match(/"(?:[^"\\]|\\.)*"/g);
  let splits = line.split(/"(?:[^"\\]|\\.)*"/g);
  regexpMatches = regexpMatches || [];
  regexpMatches = Array.from(regexpMatches);
  let result = [];
  while (splits.length > 0 && regexpMatches.length > 0) {
    result.push(splits.shift());
    result.push(regexpMatches.shift());
  }
  result.push(...splits);
  result.push(...regexpMatches);
  const finalResult: string[] = [];
  result.forEach(item => {
    if (!!item) {
      if (item[0] === "\"") {
        finalResult.push(item);
      } else {
        const itemSplit = item.trim().split(" ").filter(x => x.length > 0);
        finalResult.push(...itemSplit);
      }
    }
  });
  return finalResult;
}

function tryParseJson(value: string): any {
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

export function parseCommand(line: string): BaseCommandRequest {
  const split = splitCommand(line);
  if (split.length < 1) {
    throw new BadRequest("Not enough arguments");
  }
  return parseArguments(split);
}

export function parseArguments(items: string[]): BaseCommandRequest {
  const method = 'Command';
  const path = items[0];
  const args = minimist(items.slice(1));
  const request = new BaseCommandRequest();
  request.body = args.body || {};
  if (typeof request.body === 'string') {
    request.body = tryParseJson(request.body);
  }
  request.headers = args.headers || {};
  request.path = path;
  request.method = method;
  request.params = {};
  const argsCopy = { ...args };
  delete argsCopy.body;
  delete argsCopy.headers;
  delete argsCopy['__'];
  delete argsCopy['_'];
  request.qs = argsCopy;
  return request;
}
