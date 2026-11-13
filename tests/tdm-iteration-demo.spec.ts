import { test } from '@fixtures/fixtures';

test('TDM nested iteration demonstration', async ({ environmentData }) => {
  for (const groupName in environmentData.PERMUTATION_TESTS) {
    console.log(`Dataset: ${groupName}`);

    for (const value of environmentData.PERMUTATION_TESTS[groupName]) {
      console.log(`  Value: ${value}`);
    }
  }
});
