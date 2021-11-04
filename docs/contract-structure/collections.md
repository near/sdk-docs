# Collections

When deciding on data structures to use for the data of the application, it is important to minimize the amount of data read and written to storage but also the amount of data serialized and deserialized to minimize the cost of transactions. It is important to understand the tradeoffs of data structures in your smart contract because it can become a bottleneck as the application scales and migrating the state to the new data structures will come at a cost.

The collections within `near-sdk` are designed to split the data into chunks and defer reading and writing to the store until needed. These data structures will handle the low-level storage interactions and aim to have a similar API to the [`std::collections`](https://doc.rust-lang.org/std/collections/index.html).

> Note: The `near_sdk::collections` will be moving to `near_sdk::store` and have updated APIs. If you would like to access these updated structures as they are being implemented, enable the `unstable` feature on `near-sdk`.

It is important to keep in mind that when using `std::collections`, that each time state is loaded, all entries in the data structure will be read eagerly from storage and deserialized. This will come at a large cost for any non-trivial amount of data, so to minimize the amount of gas used the SDK collections should be used in most cases.

The most up to date collections and their documentation can be found [in the rust docs](https://docs.rs/near-sdk/latest/near_sdk/collections/index.html).
<!-- TODO include/update link for store module to replace collections mod when docs updated -->

The following data structures that exist in the SDK are as follows:

| SDK collection                        | `std`&nbsp;equivalent           | Description |
| ------------------------------------- | ------------------------------- | ------------|
| `LazyOption<T>`                       | `Option<T>`      | Optional value in storage. This value will only be read from storage when interacted with. This value will be `Some<T>` when the value is saved in storage, and `None` if the value at the prefix does not exist. |
| `Vector<T>`                           | `Vec<T>`         | A growable array type. The values are sharded in memory and can be used for iterable and indexable values that are dynamically sized. |
| <code>LookupMap<K,&nbsp;V></code>     | <code>HashMap<K,&nbsp;V></code>  | This structure behaves as a thin wrapper around the key-value storage available to contracts. This structure does not contain any metadata about the elements in the map, so it is not iterable. |
| <code>UnorderedMap<K,&nbsp;V></code>  | <code>HashMap<K,&nbsp;V></code>  | Similar to `LookupMap`, except that it stores additional data to be able to iterate through elements in the data structure. |
| <code>TreeMap<K,&nbsp;V></code>       | <code>BTreeMap<K,&nbsp;V></code> | An ordered equivalent of `UnorderedMap`. The underlying implementation is based on an [AVL tree](https://en.wikipedia.org/wiki/AVL_tree). This structure should be used when a consistent order is needed or accessing the min/max keys is needed. |
| `LookupSet<T>`                        | `HashSet<T>`                     | A set, which is similar to `LookupMap` but without storing values, can be used for checking the unique existence of values. This structure is not iterable and can only be used for lookups. |
| `UnorderedSet<T>`                     | `HashSet<T>`                     | An iterable equivalent of `LookupSet` which stores additional metadata for the elements contained in the set. |

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

Example of pagination for `UnorderedMap` and `UnorderedSet`:

```rust
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub status_updates: UnorderedMap<AccountId, String>,
    
    pub daos: UnorderedSet<AccountId>,
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
    
    /// Retrieves multiple elements from the `UnorderedSet`.
    /// - `from_index` is the index to start from.
    /// - `limit` is the maximum number of elements to return.
    pub fn get_daos(&self, from_index: u64, limit: u64) -> Vec<AccountId> {
        let elements = self.daos.as_vector();
        (from_index..std::cmp::min(from_index + limit, elements.len()))
            .filter_map(|index| elements.get(index))
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
