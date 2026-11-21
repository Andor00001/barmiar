import assert from 'node:assert/strict';
import { test } from 'node:test';
import { flyerAppliesToday } from './extra.mjs';

test('flyer prices exclude offers that start later', () => {
  assert.equal(flyerAppliesToday('11.23.-től', null, '2026-11-21'), false);
  assert.equal(flyerAppliesToday('11.23. - 11.25.', null, '2026-11-21'), false);
  assert.equal(flyerAppliesToday('11.23.-től', null, '2026-11-23'), true);
});

test('the last day is included for both scraped and manually imported offers', () => {
  assert.equal(flyerAppliesToday('11.19. - 11.22.', null, '2026-11-22'), true);
  assert.equal(flyerAppliesToday('11.22.-ig', null, '2026-11-23'), false);
  assert.equal(flyerAppliesToday('11.19.–11.25. · forrás: Tesco', '2026-11-25', '2026-11-26'), false);
});

test('dates without a year are interpreted across New Year', () => {
  assert.equal(flyerAppliesToday('12.29. – 01.03.', null, '2027-01-01'), true);
  assert.equal(flyerAppliesToday('01.02.-től', null, '2026-12-31'), false);
});
