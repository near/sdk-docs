---
sidebar_position: 3
---

# Collections Nesting

## Traditional approach for unique prefixes

Hardcoded prefixes in the constructor using a short one letter prefix that was converted to a vector of bytes.
When using nested collection, the prefix must be constructed manually.

```rust
#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        Self {
            accounts: UnorderedMap::new(b"a"),
            tokens: LookupMap::new(b"t"),
            metadata: LazyOption::new(b"m"),
        }
    }

    fn get_tokens(&self, account_id: &AccountId) -> UnorderedSet<String> {
        let tokens = self.accounts.get(account_id).unwrap_or_else(|| {
            // Constructing a unique prefix for a nested UnorderedSet.
            let mut prefix = Vec::with_capacity(33);
            // Adding unique prefix.
            prefix.push(b's');
            // Adding the hash of the account_id (key of the outer map) to the prefix.
            // This is needed to differentiate across accounts.
            prefix.extend(env::sha256(account_id.as_bytes()));
            UnorderedSet::new(prefix)
        });
        tokens
    }
}
```

## Generating unique prefixes for persistent collections

Read more about persistent collections [from this documentation](/contract-structure/collections) or from [the Rust docs](https://docs.rs/near-sdk/latest/near_sdk/collections).

Every instance of a persistent collection requires a unique storage prefix.
The prefix is used to generate internal keys to store data in persistent storage.
These internal keys need to be unique to avoid collisions (including collisions with key `STATE`).

When a contract gets complicated, there may be multiple different
collections that are not all part of the main structure, but instead part of a sub-structure or nested collections.
They all need to have unique prefixes.

We can introduce an `enum` for tracking storage prefixes and keys.
And then use borsh serialization to construct a unique prefix for every collection.
It's as efficient as manually constructing them, because with Borsh serialization, an enum only takes one byte.

```rust
use near_sdk::BorshStorageKey;

#[derive(BorshStorageKey, BorshSerialize)]
pub enum StorageKeys {
    Accounts,
    SubAccount { account_hash: Vec<u8> },
    Tokens,
    Metadata,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        Self {
            accounts: UnorderedMap::new(StorageKeys::Accounts),
            tokens: LookupMap::new(StorageKeys::Tokens),
            metadata: LazyOption::new(StorageKeys::Metadata),
        }
    }
    
    fn get_tokens(&self, account_id: &AccountId) -> UnorderedSet<String> {
        let tokens = self.accounts.get(account_id).unwrap_or_else(|| {
            UnorderedSet::new(
                StorageKeys::SubAccount { account_hash: env::sha256(account_id.as_bytes()) }
            )
        });
        tokens
    }
}
```
