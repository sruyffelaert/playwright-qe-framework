import { test } from '@fixtures/fixtures';

test.skip(process.env.RUN_TDM_DEMO !== '1', 'Set RUN_TDM_DEMO=1 to run the TDM demonstration.');

test('TDM nested iteration demonstration', async ({ environmentData }) => {
  for (const groupName in environmentData.PERMUTATION_TESTS) {
    console.log(`Dataset: ${groupName}`);

    for (const value of environmentData.PERMUTATION_TESTS[groupName]) {
      console.log(`  Value: ${value}`);
    }
  }
});
