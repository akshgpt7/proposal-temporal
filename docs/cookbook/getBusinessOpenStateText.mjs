/**
 * Compare the given time to the business hours of a business located in a
 * particular time zone, and return a string indicating whether the business is
 * open, closed, opening soon, or closing soon. The length of "soon" can be
 * controlled using the `soonWindow` parameter.
 *
 * @param {Temporal.Instant} now - Time at which to consider whether the
 *  business is open
 * @param {Temporal.TimeZone} timeZone - Time zone in which the business is
 *  located
 * @param {(Object|null)[]} businessHours - Array of length 7 indicating
 *  business hours during the week
 * @param {Temporal.Time} businessHours[].open - Time at which the business
 *  opens
 * @param {Temporal.Time} businessHours[].close - Time at which the business
 *  closes
 * @param {Temporal.Duration} soonWindow - Length of time before the opening or
 *  closing time during which the business should be considered "opening soon"
 *  or "closing soon"
 * @returns {string} "open", "closed", "opening soon", or "closing soon"
 */
function getBusinessOpenStateText(now, timeZone, businessHours, soonWindow) {
  function inRange(abs, start, end) {
    return Temporal.Instant.compare(abs, start) >= 0 && Temporal.Instant.compare(abs, end) < 0;
  }

  const dateTime = now.toDateTimeISO(timeZone);
  const weekday = dateTime.dayOfWeek % 7; // convert to 0-based, for array indexing

  // Because of times wrapping around at midnight, we may need to consider
  // yesterday's and tomorrow's hours as well
  const today = dateTime.toDate();
  const yesterday = today.subtract({ days: 1 });
  const tomorrow = today.add({ days: 1 });

  // Push any of the businessHours that overlap today's date into an array,
  // that we will subsequently check. Convert the businessHours Times into
  // DateTimes so that they no longer wrap around.
  const businessHoursOverlappingToday = [];
  const yesterdayHours = businessHours[(weekday + 6) % 7];
  if (yesterdayHours) {
    const { open, close } = yesterdayHours;
    if (Temporal.Time.compare(close, open) < 0) {
      businessHoursOverlappingToday.push({
        open: yesterday.toDateTime(open).toInstant(timeZone),
        close: today.toDateTime(close).toInstant(timeZone)
      });
    }
  }
  const todayHours = businessHours[weekday];
  if (todayHours) {
    const { open, close } = todayHours;
    const todayOrTomorrow = Temporal.Time.compare(close, open) >= 0 ? today : tomorrow;
    businessHoursOverlappingToday.push({
      open: today.toDateTime(open).toInstant(timeZone),
      close: todayOrTomorrow.toDateTime(close).toInstant(timeZone)
    });
  }

  // Check if any of the candidate business hours include the given time
  const soon = now.add(soonWindow);
  let openNow = false;
  let openSoon = false;
  for (const { open, close } of businessHoursOverlappingToday) {
    openNow = openNow || inRange(now, open, close);
    openSoon = openSoon || inRange(soon, open, close);
  }

  if (openNow) {
    if (!openSoon) return 'closing soon';
    return 'open';
  }
  if (openSoon) return 'opening soon';
  return 'closed';
}

// For example, a restaurant or bar might have opening hours that go past
// midnight; make sure this is handled correctly
const businessHours = [
  /* Sun */ { open: Temporal.Time.from('13:00'), close: Temporal.Time.from('20:30') },
  /* Mon */ null, // closed Mondays
  /* Tue */ { open: Temporal.Time.from('11:00'), close: Temporal.Time.from('20:30') },
  /* Wed */ { open: Temporal.Time.from('11:00'), close: Temporal.Time.from('20:30') },
  /* Thu */ { open: Temporal.Time.from('11:00'), close: Temporal.Time.from('22:00') },
  /* Fri */ { open: Temporal.Time.from('11:00'), close: Temporal.Time.from('00:00') },
  /* Sat */ { open: Temporal.Time.from('11:00'), close: Temporal.Time.from('02:00') }
];

const now = Temporal.Instant.from('2019-04-07T00:00+01:00[Europe/Berlin]');
const tz = Temporal.TimeZone.from('Europe/Berlin');
const soonWindow = Temporal.Duration.from({ minutes: 30 });
const saturdayNightState = getBusinessOpenStateText(now, tz, businessHours, soonWindow);
assert.equal(saturdayNightState, 'open');
