---
slug: /best-practices
---

# Best practices

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

For a traditional way of handling it, see [instructions below](#the-traditional-way-of-handling-unique-prefixes-for-persistent-collections)

## Enable overflow checks

It's usually helpful to panic on integer overflow. To enable it, add the following into your `Cargo.toml` file:

```toml
[profile.release]
overflow-checks = true
```

## Use `assert!` early

Try to validate the input, context, state and access first before taking any actions. The earlier you panic, the more [gas](https://docs.near.org/docs/concepts/gas) you will save for the caller.

```rust
#[near_bindgen]
impl Contract {
    pub fn set_fee(&mut self, new_fee: Fee) {
        assert_eq!(env::predecessor_account_id(), self.owner_id, "Owner's method");
        new_fee.assert_valid();
        self.internal_set_fee(new_fee);
    }
}
```

## Use `log!`

Use logging for debugging and notifying user.

When you need a formatted message, you can use the following macro:

```rust
log!("Transferred {} tokens from {} to {}", amount, sender_id, receiver_id);
```

It's equivalent to the following message:

```rust
env::log_str(format!("Transferred {} tokens from {} to {}", amount, sender_id, receiver_id).as_ref());
```

## Return `Promise`

If your method makes a cross-contract call, you probably want to return the newly created `Promise`.
This allows the caller (such as a near-cli or near-api-js call) to wait for the result of the promise instead of returning immediately.
Additionally, if the promise fails for some reason, returning it will let the caller know about the failure, as well as enabling NEAR Explorer and other tools to mark the whole transaction chain as failing.
This can prevent false-positives when the first or first few transactions in a chain succeed but a subsequent transaction fails.

E.g.

```rust
#[near_bindgen]
impl Contract {
    pub fn withdraw_100(&mut self, receiver_id: AccountId) -> Promise {
        Promise::new(receiver_id).transfer(100)
    }
}
```



## Reuse crates from `near-sdk`

`near-sdk` re-exports the following crates:

- `borsh`
- `base64`
- `bs58`
- `serde`
- `serde_json`

Most common crates include `borsh` which is needed for internal STATE serialization and
`serde` for external JSON serialization.

When marking structs with `serde::Serialize` you need to use `#[serde(crate = "near_sdk::serde")]`
to point serde to the correct base crate.

```rust
/// Import `borsh` from `near_sdk` crate 
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
/// Import `serde` from `near_sdk` crate 
use near_sdk::serde::{Serialize, Deserialize};

/// Main contract structure serialized with Borsh
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub pair: Pair,
}

/// Implements both `serde` and `borsh` serialization.
/// `serde` is typically useful when returning a struct in JSON format for a frontend.
#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Pair {
    pub a: u32,
    pub b: u32,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(pair: Pair) -> Self {
        Self {
            pair,
        }
    }

    pub fn get_pair(self) -> Pair {
        self.pair
    }
}
```

## `std::panic!` vs `env::panic`

- `std::panic!` panics the current thread. It uses `format!` internally, so it can take arguments.
  SDK sets up a panic hook, which converts the generated `PanicInfo` from `panic!` into a string and uses `env::panic` internally to report it to Runtime.
  This may provide extra debugging information such as the line number of the source code where the panic happened.

- `env::panic` directly calls the host method to panic the contract.
  It doesn't provide any other extra debugging information except for the passed message.

## Compile smaller binaries

When compiling a contract make sure to pass flag `-C link-arg=-s` to the rust compiler:

```bash
RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release
```

Here is the parameters we use for the most examples in `Cargo.toml`:

```toml
[profile.release]
codegen-units = 1
opt-level = "s"
lto = true
debug = false
panic = "abort"
overflow-checks = true
```

You may want to experiment with using `opt-level = "z"` instead of `opt-level = "s"` to see if generates a smaller binary. See more details on this in [The Cargo Book Profiles section](https://doc.rust-lang.org/cargo/reference/profiles.html#opt-level).

## Use simulation testing

**Note**: simulation testing is deprecated in favor of [Sandbox testing](https://github.com/near/sandbox).

Simulation testing allows you to run tests for multiple contracts and cross-contract calls in a simulated runtime environment.
Read more, [near-sdk-sim](https://github.com/near/near-sdk-rs/tree/master/near-sdk-sim)

## Appendix

### The traditional way of handling unique prefixes for persistent collections

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
