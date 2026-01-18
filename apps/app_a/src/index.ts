import { superCool } from "@jb_ts_monorepo/package_a";

console.log("Stuff imported from packages into app src", superCool);

console.log("TZ in app is", process.env.TZ); // shows that @types/node is available

export const app = "Hi, I'm an app";

// describe('stuff', () => {}); // vitest globals should not be available in src

// import { shouldNotBeVisibleOutsideOfAppTests } from '../tests' // tests dir should be considered inaccessible from here
