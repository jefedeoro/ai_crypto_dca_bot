// src/contract.ts

import { NearBindgen, near, call, view, UnorderedMap } from 'near-sdk-js';

@NearBindgen
class DCAContract {
  investments: UnorderedMap = new UnorderedMap('investments');

  @call
  set_investment({ account_id, crypto, amount, frequency }: { account_id: string; crypto: string; amount: string; frequency: string }): void {
    this.investments.set(account_id, { crypto, amount, frequency, last_executed: 0 });
    near.log(`Investment set for ${account_id}`);
  }

  @view
  get_investment({ account_id }: { account_id: string }): object {
    return this.investments.get(account_id);
  }

  // Additional functions to execute investments would go here
}
