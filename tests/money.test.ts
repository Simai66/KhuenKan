import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMoney, equalShares, percentageShares } from "../src/lib/money";

test("THB inputs preserve satang and reject exponents, negatives and excess precision", () => {
  assert.equal(parseMoney("0.29"), 29);
  assert.equal(parseMoney("123.4"), 12340);
  for (const value of ["-1", "1e3", "0.001", "NaN", "100000001", ""])
    assert.throws(() => parseMoney(value));
});
test("Equal shares preserve every satang including totals smaller than member count", () => {
  assert.deepEqual(equalShares(10000, 3), [3334, 3333, 3333]);
  assert.deepEqual(equalShares(2, 3), [1, 1, 0]);
  for (let total = 0; total < 500; total++)
    for (let n = 1; n < 15; n++) {
      const values = equalShares(total, n);
      assert.equal(
        values.reduce((a, b) => a + b, 0),
        total,
      );
      assert.ok(Math.max(...values) - Math.min(...values) <= 1);
    }
});
test("Percentages use largest remainder and require exactly 100%", () => {
  assert.deepEqual(
    percentageShares(100, ["33.33", "33.33", "33.34"]),
    [33, 33, 34],
  );
  assert.throws(() => percentageShares(100, ["20", "20"]));
  assert.deepEqual(percentageShares(10001, ["50", "50"]), [5001, 5000]);
});
