---
sidebar_position: 2
sidebar_label: Production App Basics
title: "Upgrading Contracts: Production App Basics"
---

# Production App Basics

When deploying new code to production contracts, you obviously can't destroy old account state, as you do [during rapid prototyping](./prototyping). So how to you prevent the dreaded error?

    Cannot deserialize the contract state.

You can use a couple different approaches, depending on the complexity of your contract.

## Migration method

For cases like [the change to the `rust-status-message` contract](https://github.com/near-examples/rust-status-message/commit/a39e1fc55ee018b631e3304ba6f0884b7558873e) that we looked at [previously](./prototyping), a simple migration method is all you need.

As a reminder, the goal was to change this:

```rust reference
https://github.com/near-examples/rust-status-message/blob/61de649d8311bef5957c129e6ad1407101a0f873/src/lib.rs#L9-L19
```

into this:

```rust reference
https://github.com/near-examples/rust-status-message/blob/a39e1fc55ee018b631e3304ba6f0884b7558873e/src/lib.rs#L9-L21
```

This change seems _almost_ backwards-compatible:

* it renames a field while keeping the [persistent collection](../contract-structure/collections) prefix, `r`, the same
* it adds a new field

In fact, if the contract state was serialized to a self-describing data format such as JSON, it _might_ be backwards-compatible _[TODO: fact check]_, and you could upgrade your contract without encountering any errors. But [Borsh](../contract-interface/serialization-interface) needs a little help figuring out how to match the old state to the new contract structure. How to help it?

First, keep the old `struct` around for at least one deploy:

```rust reference
https://github.com/near-examples/rust-status-message/blob/7f6afcc5ce414271fdf9bc750f666c062a6d697e/src/lib.rs#L7-L10
```

And add a `migrate` method to the main struct:

```rust reference
https://github.com/near-examples/rust-status-message/blob/7f6afcc5ce414271fdf9bc750f666c062a6d697e/src/lib.rs#L48-L56
```

Here's the full diff between the starting contract and the update + migration:

```diff
+#[derive(BorshDeserialize, BorshSerialize)]
+pub struct OldStatusMessage {
+    records: LookupMap<String, String>,
+}
+
 #[near_bindgen]
 #[derive(BorshDeserialize, BorshSerialize)]
 pub struct StatusMessage {
-    records: LookupMap<String, String>,
+    taglines: LookupMap<String, String>,
+    bios: LookupMap<String, String>,
 }
 
 impl Default for StatusMessage {
     fn default() -> Self {
         Self {
-            records: LookupMap::new(b"r".to_vec()),
+            taglines: LookupMap::new(b"r".to_vec()),
+            bios: LookupMap::new(b"b".to_vec()),
         }
     }
 }
 
 #[near_bindgen]
 impl StatusMessage {
-    pub fn set_status(&mut self, message: String) {
+    pub fn set_tagline(&mut self, message: String) {
         let account_id = env::signer_account_id();
-        self.records.insert(&account_id, &message);
+        self.taglines.insert(&account_id, &message);
+    }
+
+    pub fn get_tagline(&self, account_id: String) -> Option<String> {
+        return self.taglines.get(&account_id);
     }

-    pub fn get_status(&self, account_id: String) -> Option<String> {
-        return self.records.get(&account_id);
+    pub fn set_bio(&mut self, message: String) {
+        let account_id = env::signer_account_id();
+        self.bios.insert(&account_id, &message);
+    }
+
+    pub fn get_bio(&self, account_id: String) -> Option<String> {
+        return self.bios.get(&account_id);
+    }
+
+    #[private]
+    #[init(ignore_state)]
+    pub fn migrate() -> Self {
+        let old_state: OldStatusMessage = env::state_read().expect("failed");
+        Self {
+            taglines: old_state.records,
+            bios: LookupMap::new(b"b".to_vec()),
+        }
     }
 }
```

When you deploy your change, call the `migrate` method too:

    near deploy \
      --wasmFile res/status_message.wasm \
      --initFunction "migrate" \
      --initArgs "{}" \
      --accountId app-name.you.testnet

Finally, you can view old statuses with your new `get_tagline` method:

    near view app-name.you.testnet get_tagline '{"account_id": "you.testnet"}'

Hooray!

:::tip Tidying Up
At this point, all contract state has been migrated, and you don't need to keep the `OldStatusMessage` struct or the `migrate` method. Feel free to remove them and deploy again with no `initFunction` call. Your contract will be all tidy and ready for the next migration!
:::

## Using Enums

TODO

## Migrating: all at once or incremental

TODO

## Guidelines for writing upgradeable apps

TODO
