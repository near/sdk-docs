---
slug: /best-practices
---

# Best practices

## Main structure and persistent collections

The main contract structure is marked with `#[near_bindgen]`. It has to be serializable and deserializable with [Borsh](https://borsh.io).

```rust
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    pub data: String,
    pub owner_id: AccountId,
    pub value: u128,
}
```

Typically, when an external method is called the entire structure has to be deserialized. (Note that this doesn't happen when using `#[init]` or `#[init(ignore_state)]`, both of which are covered in the [`near_bindgen` section](/contract-structure/near-bindgen#initialization-methods) and [the upgradability section](https://sdk-g4yv.onrender.com/upgrading/production-basics#migration-method) respectively.)
The serialized contract data is stored in [persistent storage] under the key `STATE`.

Change methods ([see below](#view-vs-change-method)) serialize the main contract structure at the end and store the new value into storage.

[persistent storage]: https://nomicon.io/DataStructures/Account.html#storage

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

## Payable methods

To mark a change method as a payable, you need to add the `#[payable]` macro decorator. This will allow this change method
to receive attached deposits. Otherwise, if a deposit is attached to a non-payable change method, the method will panic.

```rust
#[near_bindgen]
impl Contract {
    #[payable]
    pub fn take_my_money(&mut self) {
        env::log_str("Thanks!");
    }

    pub fn do_not_take_my_money(&mut self) {
        env::log_str("Thanks!");
    }
}
```

This is equivalent to:

```rust
#[near_bindgen]
impl Contract {
    pub fn take_my_money(&mut self) {
        env::log_str("Thanks!");
    }

    pub fn do_not_take_my_money(&mut self) {
        if near_sdk::env::attached_deposit() != 0 {
            near_sdk::env::panic(b"Method do_not_take_my_money doesn't accept deposit");
        }
        env::log_str("Thanks!");
    }
}
```

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

## Use high-level cross-contract API

There is a helper macro that allows you to make cross-contract calls with the syntax `#[ext_contract(...)]`. It takes a Rust Trait and
converts it to a module with static methods. Each of these static methods takes positional arguments defined by the Trait,
then the `receiver_id`, the attached deposit and the amount of gas and returns a new `Promise`.

For example, let's define a calculator contract Trait:

```rust
#[ext_contract(ext_calculator)]
trait Calculator {
    fn mult(&self, a: U64, b: U64) -> U128;

    fn sum(&self, a: U128, b: U128) -> U128;
}
```

It's equivalent to the following code:

```rust
mod ext_calculator {
    pub fn mult(a: U64, b: U64, receiver_id: &AccountId, deposit: Balance, gas: Gas) -> Promise {
        Promise::new(receiver_id.clone())
            .function_call(
                b"mult",
                json!({ "a": a, "b": b }).to_string().as_bytes(),
                deposit,
                gas,
            )
    }

    pub fn sum(a: U128, b: U128, receiver_id: &AccountId, deposit: Balance, gas: Gas) -> Promise {
        // ...
    }
}
```

Let's assume the calculator is deployed on `calc.near`, we can use the following:

```rust
const CALCULATOR_ACCOUNT_ID: &str = "calc.near";
const NO_DEPOSIT: Balance = 0;
const BASE_GAS: Gas = 5_000_000_000_000;

#[near_bindgen]
impl Contract {
    pub fn sum_a_b(&mut self, a: U128, b: U128) -> Promise {
        let calculator_account_id: AccountId = CALCULATOR_ACCOUNT_ID.to_string();
        ext_calculator::sum(a, b, &calculator_account_id, NO_DEPOSIT, BASE_GAS)
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

## In-memory `HashMap` vs persistent `UnorderedMap`

- `HashMap` keeps all data in memory. To access it, the contract needs to deserialize the whole map.
- `UnorderedMap` keeps data in persistent storage. To access an element, you only need to deserialize this element.

Use `HashMap` in case:

- Need to iterate over all elements in the collection **in one function call**.
- The number of elements is small or fixed, e.g. less than 10.

Use `UnorderedMap` in case:

- Need to access a limited subset of the collection, e.g. one or two elements per call.
- Can't fit the collection into memory.

The reason is `HashMap` deserializes (and serializes) the entire collection in one storage operation.
Accessing the entire collection is cheaper in gas than accessing all elements through `N` storage operations.

Example of `HashMap`:

```rust
/// Using Default initialization.
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Default)]
pub struct Contract {
    pub status_updates: HashMap<AccountId, String>,
}

#[near_bindgen]
impl Contract {
    pub fn set_status(&mut self, status: String) {
        self.status_updates.insert(env::predecessor_account_id(), status);
        assert!(self.status_updates.len() <= 10, "Too many messages");
    }

    pub fn clear(&mut self) {
        // Effectively iterating through all removing them.
        self.status_updates.clear();
    }

    pub fn get_all_updates(self) -> HashMap<AccountId, String> {
        self.status_updates
    }
}
```

Example of `UnorderedMap`:

```rust
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub status_updates: UnorderedMap<AccountId, String>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        // Initializing `status_updates` with unique key prefix.
        Self {
            status_updates: UnorderedMap::new(b"s".to_vec()),
        }
    }

    pub fn set_status(&mut self, status: String) {
        self.status_updates.insert(&env::predecessor_account_id(), &status);
        // Note, don't need to check size, since `UnorderedMap` doesn't store all data in memory.
    }

    pub fn delete_status(&mut self) {
        self.status_updates.remove(&env::predecessor_account_id());
    }

    pub fn get_status(&self, account_id: AccountId) -> Option<String> {
        self.status_updates.get(&account_id)
    }
}
```

## Pagination with persistent collections

Persistent collections such as `UnorderedMap`, `UnorderedSet` and `Vector` may
contain more elements than the amount of gas available to read them all.
In order to expose them all through view calls, we can implement pagination.

`Vector` returns elements by index natively using `.get(index)`.

To access elements by index in `UnorderedSet` we can use `.as_vector()` that will return a `Vector` of elements.

For `UnorderedMap` we need to get keys and values as `Vector` collections, using `.keys_as_vector()` and `.values_as_vector()` respectively.

Example of pagination for `UnorderedMap`:

```rust
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub status_updates: UnorderedMap<AccountId, String>,
}

#[near_bindgen]
impl Contract {
    /// Retrieves multiple elements from the `UnorderedMap`.
    /// - `from_index` is the index to start from.
    /// - `limit` is the maximum number of elements to return.
    pub fn get_updates(&self, from_index: u64, limit: u64) -> Vec<(AccountId, String)> {
        let keys = self.status_updates.keys_as_vector();
        let values = self.status_updates.values_as_vector();
        (from_index..std::cmp::min(from_index + limit, self.status_updates.len()))
            .map(|index| (keys.get(index).unwrap(), values.get(index).unwrap()))
            .collect()
    }
}
```

## `LookupMap` vs `UnorderedMap`

### Functionality

- `UnorderedMap` supports iteration over keys and values, and also supports pagination. Internally, it has the following structures:
    - a map from a key to an index
    - a vector of keys
    - a vector of values
- `LookupMap` only has a map from a key to a value. Without a vector of keys, it doesn't have the ability to iterate over keys.

### Performance

`LookupMap` has a better performance and stores less data compared to `UnorderedMap`.

- `UnorderedMap` requires `2` storage reads to get the value and `3` storage writes to insert a new entry.
- `LookupMap` requires only one storage read to get the value and only one storage write to store it.

### Storage space

`UnorderedMap` requires more storage for an entry compared to a `LookupMap`.

- `UnorderedMap` stores the key twice (once in the first map and once in the vector of keys) and value once. It also has a higher constant for storing the length of vectors and prefixes.
- `LookupMap` stores key and value once.

## `LazyOption`

It's a type of persistent collection that only stores a single value.
The goal is to prevent a contract from deserializing the given value until it's needed.
An example can be a large blob of metadata that is only needed when it's requested in a view call,
but not needed for the majority of contract operations.

It acts like an `Option` that can either hold a value or not and also requires a unique prefix (a key in this case)
like other persistent collections.

Compared to other collections, `LazyOption` only allows you to initialize the value during initialization.

```rust
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub metadata: LazyOption<Metadata>,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Metadata {
    data: String,
    image: Base64Vec,
    blobs: Vec<String>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(metadata: Metadata) -> Self {
        Self {
            metadata: LazyOption::new(b"m", Some(metadata)),
        }
    }

    pub fn get_metadata(&self) -> Metadata {
        // `.get()` reads and deserializes the value from the storage. 
        self.metadata.get().unwrap()
    }
}
```

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
