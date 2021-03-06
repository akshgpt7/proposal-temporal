// Copyright (C) 2020 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.instant.prototype.subtract
---*/

const instance = Temporal.Instant.fromEpochSeconds(10);
assert.throws(TypeError, () => instance.subtract("P3D"));
