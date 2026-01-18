import { superCool } from "../src";

console.log("TZ in package tests is", process.env.TZ); // shows that @types/node is available

console.log("Stuff imported from packages into package tests", superCool);

export const shouldNotBeVisibleOutsideOfPackageTests = "super secret";

it("does stuff", () => {
    expect(true).toBe(true);
});
