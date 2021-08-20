---
sidebar_position: 4
---

# Deploying Contracts

You might want your smart contract to deploy subsequent smart contract code for a few reasons:

* The contract acts as a Factory, a pattern where a parent contract creates many child contracts ([Mintbase](https://www.mintbase.io/) does this to create a new NFT store for [anyone who wants one](https://docs.mintbase.io/creating/store/deploy-fee); [Rainbow Bridge](https://near.org/bridge/) does this to deploy separate Fungible Token contracts for [each bridged token](https://github.com/aurora-is-near/rainbow-token-connector/blob/ce7640da144f000e0a93b6d9373bbc2514e37f3b/bridge-token-factory/src/lib.rs#L311-L341))
* The contract updates its own code (calls `deploy` on itself) pending the outcome of [a DAO vote](../upgrading/via-dao-vote.md).
* You could implement a "contract per user" system that creates app-specific subaccounts for users (`your-app.user1.near`, `your-app.user2.near`, etc) and deploys the same contract to each. This is currently prohibitively expensive due to NEAR's [storage fees](https://docs.near.org/docs/concepts/storage-staking), but that may be optimized in the future. If it is, this sort of "sharded app design" may become the more scalable, user-centric approach to contract standards and app mechanics. An early experiment with this paradigm was called [Meta NEAR](https://github.com/metanear).

If your goal is to deploy to a subaccount of your main contract like Mintbase or the Rainbow Bridge, you will also need to create the account and transfer some $NEAR to it. So, combining concepts from the last few pages, here's what you need:

```rust
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{json_types::U128, near_bindgen, Balance, AccountId, Promise};

const INITIAL_BALANCE: Balance = 3_000_000_000_000_000_000_000_000; // 3e24yN, 3N
let code: Vec<u8> = /* Can use static bytes embedded into contract or pass in through parameters */;

#[near_bindgen]
#[derive(Default, BorshDeserialize, BorshSerialize)]
pub struct Contract {}

#[near_bindgen]
impl Contract {
    #[private]
    pub fn create_child_contract(&self, prefix: String) -> Promise {
        let subaccount_id: AccountId = format!("{}.{}", prefix, env::current_account_id());
        Promise::new(subaccount_id)
            .create_account()
            .add_full_access_key(env::signer_account_pk())
            .transfer(INITIAL_BALANCE)
            .deploy_contract(code)
    }
}
```

Where the `code` bytes can either be included in the contract code with `include_bytes!("<path to wasm file>").to_vec()` or passed in through parameters (keep in mind transaction size is currently limited to 4MB).