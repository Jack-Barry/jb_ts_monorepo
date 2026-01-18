export const superCool = "Kenny Powers";

console.log("TZ in package is", process.env.TZ); // shows that @types/node is available

// import { shouldNotBeVisibleOutsideOfPackageTests } from '../tests' // tests dir should be considered inaccessible from here

// describe('stuff', () => {}); // vitest globals should not be available in src
