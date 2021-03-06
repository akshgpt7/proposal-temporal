// Copyright (C) 2020 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.yearmonth.prototype.subtract
---*/

const instance = Temporal.YearMonth.from({ year: 2000, month: 5 });
assert.throws(TypeError, () => instance.subtract("P3M"));
