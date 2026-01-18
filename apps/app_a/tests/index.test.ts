import { superCool } from "@jb_ts_monorepo/package_a";
import { app } from "../src";

console.log("TZ in app tests is", process.env.TZ); // shows that @types/node is available

console.log("Stuff imported from packages into app tests", superCool);

console.log("Value imported from app src", app);

export const shouldNotBeVisibleOutsideOfAppTests = "super secret";

it("does stuff", () => {
    expect(true).toBe(true);
});
