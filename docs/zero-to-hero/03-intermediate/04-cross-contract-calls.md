---
sidebar_position: 5
sidebar_label: "Cross-contract calls, etc."
title: "Adding cross-contract calls, access key shuffling, etc."
---

# Updating the contract

import shuffleKeys from '../assets/shuffle-keys.gif';
import clionSuggestion from '../assets/clion-suggestion.gif';
import carpenterAddingKey from '../assets/create-key-carpenter-near--carlcarlkarl.near--CarlCarlKarl.jpg';

To reiterate, we'd like anyone to be able to participate in the crossword puzzle, even folks who don't have a NEAR account.

The first person to win will "reserve their spot" and choose where to send the prize money: either an account they own or an account they'd like to create.

## Reserving their spot

### The plan

When a user first visits the crossword, they only see the crossword. No login button and no fields (like a `memo` field) to fill out.

On their first visit, our frontend will create a brand new, random seed phrase in their browser. We'll use this seed phrase to create the user's unique key pair. If a random seed phrase is already there, it skips this part. (We covered the code for this in [a previous section](/zero-to-hero/intermediate/use-seed-phrase#generate-random-seed-phrase).)

If the user is the first to solve the puzzle, it discovers the function-call access key and calls `submit_solution` with that key. It's basically using someone else's key, as this key is on the crossword account.

**We'll be adding a new parameter** to the `submit_solution` so the user can include the random, public key we just stored in their browser. 

During the execution of `submit_solution`, because contracts can use Promises to perform Actions, we'll remove the solution public key and add the user's public key.

This will lock out other attempts to solve the crossword puzzle and ensure there is only one winner.

<img src={shuffleKeys} width="600"/><br/><br/>

This means that a puzzle can have three states it can be in:

1. Unsolved
2. Solved and not yet claimed (not paid out)
3. Claimed and finalized

The previous chapter [we discussed enums](/zero-to-hero/beginner/structs-enums#using-enums), so this is simply modifying the enumeration variants.  

### The implementation

First, let's see how the `submit_solution` will verify the correct solution.

```rust reference
https://github.com/near-examples/crossword-tutorial-chapter-3/blob/85bfe37824f9137faa1918b9a2dfb5eee3611d9b/contract/src/lib.rs#L152-L158
```

Instead of hashing the plaintext, we simply check that the public key matches what we know the answer is. (The answer being the series of words representing the solution to the crossword puzzle, used as a seed phrase to create a key pair, including a public key.)

Further down in the `submit_solution` method we'll follow our plan by **adding a function-call access key** (that only the winner has) and removing the access key that was discovered by the winner, so no one else can use it.

<figure>
    <img src={carpenterAddingKey} alt="Illustration of a carpenter who has created a key. Art by carlcarlkarl.near" width="400"/>
    <figcaption class="small">Our smart contract is like this carpenter adding a key to itself.<br/>Art by <a href="https://twitter.com/CarlCarlKarl" target="_blank">carlcarlkarl.near</a></figcaption>
</figure>
<br/>

```rust reference
https://github.com/near-examples/crossword-tutorial-chapter-3/blob/db4fb99c6fad52f48ed402be05524a4816d0c89f/contract/src/lib.rs#L182-L192
```

Note that the new function-call access key is able to call two methods we'll be adding:

1. `claim_reward` — when the user has an existing account and wishes to send the prize to it
2. `claim_reward_new_account` — when the user doesn't have an account, wants to create one and send the prize to it

Both functions will do cross-contract calls and use callbacks to see the result. We finally get to the meat of this chapter, let's go! 

## Cross-contract calls

### The traits

We're going to be making a cross-contract call to the linkdrop account deployed to the `testnet` account. We're also going to have callbacks for that, and for a simple transfer to a (potentially existing) account. For both of these, we'll want to add our special traits like we saw on the [linkdrop contract before](/zero-to-hero/intermediate/linkdrop#the-trait).

```rust reference
https://github.com/near-examples/crossword-tutorial-chapter-3/blob/3eb1701fe536c766a9bac3c59f880e573da61e63/contract/src/lib.rs#L15-L65
```

So we'll use `ext_linkdrop` for making the cross-contract call and `ext_self` to call "ourselves" at a callback.

### `claim_reward`

Again, this function is called when the user solves the crossword puzzle and wishes to send the prize money to an existing account.

Seems straightforward, so why would we need a callback? We didn't use a callback in the previous chapter when the user logged in, so what gives?

It's possible that while claiming the prize, the user accidentally fat-fingers their username, or their cat jumps on their keyboard. Instead of typing `mike.testnet` they type `mike.testnzzz` and hit send. In short, if we try to send the prize to a non-existent account, we want to catch that.

For brevity, we'll skip some code in this function to focus on the Promise and callback:

```rust
pub fn claim_reward(
    &mut self,
    crossword_pk: PublicKey,
    receiver_acc_id: String,
    memo: String,
    ) -> Promise {
        let signer_pk = env::signer_account_pk();
        // Logic we'll skip
        Promise::new(receiver_acc_id.parse().unwrap()) // Let your IDE help you here
            .transfer(puzzle.reward)
            .then(ext_self::callback_after_transfer(
                crossword_pk,
                receiver_acc_id,
                memo,
                env::signer_account_pk(),
                env::current_account_id(),
                0,
                GAS_FOR_ACCOUNT_CALLBACK,
            ))
    }
```

:::tip Your IDE is your friend

Oftentimes, the IDE can help you.

For instance, in the above snippet we have `receiver_acc_id.parse().unwrap()` which might look confusing. You can lean on code examples or documentation to see how this is done, or you can utilize the suggestions from your IDE.

<img src={clionSuggestion} width="600"/>

:::

This `claim_reward` method will attempt to use the `Transfer` Action to send NEAR to the account specified. It might fail on a protocol level (as opposed to a smart contract failure), which would indicate the account doesn't exist.

Let's see how we check this in the callback:

```rust reference
https://github.com/near-examples/crossword-tutorial-chapter-3/blob/3eb1701fe536c766a9bac3c59f880e573da61e63/contract/src/lib.rs#L380-L410
```

:::info The `#[private]` macro
Notice that above the function, we have declared it to be private.

This is an ergonomic helper that checks to make sure the predecessor is the current account ID.

We actually saw this done "the long way" in the callback for the linkdrop contract in [the previous section](/zero-to-hero/intermediate/linkdrop#the-callback).

Every callback will want to have this `#[private]` macro above it.
:::

The snippet above essentially says it expects there to be a Promise result for exactly one Promise, and then sees if that was successful or not. Note that we're not actually getting a *value* in this callback, just if it succeeded or failed.

If it succeeded, we proceed to finalize the puzzle, like setting its status to be claimed and finished, removing it from the `unsolved_puzzles` collection, etc.

### `claim_reward_new_account`

Now we want to handle a more interesting case. We're going to do a cross-contract call to the smart contract located on `testnet` and ask it to create an account for us. This name might be unavailable, and this time we get to write a callback that *gets a value*.

Again, for brevity, we'll show the meat of the `claim_reward_new_account` method:

```rust
pub fn claim_reward_new_account(
    &mut self,
    crossword_pk: PublicKey,
    new_acc_id: String,
    new_pk: PublicKey,
    memo: String,
) -> Promise {
    // Logic we'll skip
    ext_linkdrop::create_account(
        new_acc_id.parse().unwrap(),
        new_pk,
        AccountId::from(self.creator_account.clone()),
        reward_amount,
        GAS_FOR_ACCOUNT_CREATION,
    )
    .then(
        // Chain a promise callback to ourselves
        ext_self::callback_after_create_account(
            crossword_pk, // First parameter
            new_acc_id, // Second parameter
            memo, // Third parameter
            env::signer_account_pk(), // Fourth parameter
            env::current_account_id(), // Which contract? "me"
            0, // Deposit (in yoctoNEAR)
            GAS_FOR_ACCOUNT_CALLBACK, // Gas
        ),
    )
}
```

Then the callback:

```rust
#[private]
fn callback_after_create_account(
    &mut self,
    crossword_pk: PublicKey, // First parameter
    account_id: String, // Second parameter
    memo: String, // Third parameter
    signer_pk: PublicKey, // Fourth parameter
) -> bool {
    // Skipping logic
    match env::promise_result(0) {
        PromiseResult::NotReady => {
            unreachable!()
        }
        // NOTE: we capture the result from the linkdrop contract here
        PromiseResult::Successful(creation_result) => {
            // NOTE: Now we turn it into a boolean
            let creation_succeeded: bool = serde_json::from_slice(&creation_result)
                .expect("Could not turn result from account creation into boolean.");
            if creation_succeeded {
                // New account created and reward transferred successfully.
                self.finalize_puzzle(crossword_pk, account_id, memo, signer_pk);
                true
            } else {
                // Something went wrong trying to create the new account.
                false
            }
        }
        PromiseResult::Failed => {
            // Problem with the creation transaction, reward money has been returned to this contract.
            false
        }
    }
}
```

In the above snippet, there's one difference from the callback we saw in `claim_reward`: we capture the value returned from the smart contract we just called. Since the linkdrop contract returns a bool, we can expect that type. (See the comments with "NOTE:" above, highlighting this.)

## Callbacks

The previous callback for the `callback_after_create_account` has comments around the parameters. ("First parameter", "second parameter", etc.)

It might feel odd at first to do cross-contract calls because of the three "magic" parameters.

This is how the callback parameters need to be for a callback that takes two parameters:

```rust
.then(
    ext_self::my_callback(
        first_parameter,
        second_parameter,
        env::current_account_id(), // MAGIC: Which contract? "me"
        0, // MAGIC: Deposit (in yoctoNEAR)
        GAS_FOR_ACCOUNT_CALLBACK, // MAGIC: Gas
    ),
```

:::tip Consider changing contract state in callback
It's not always the case, but often you'll want to change the contract state in the callback.

The callback is a safe place where we have knowledge of what's happened after cross-contract calls or Actions. If your smart contract is changing state *before* doing a cross-contract call, make sure there's a good reason for it. It might be best to move this logic into the callback.
:::

So what parameters should I pass into a callback?

There's no one-size-fits-all solution, but perhaps there's some advice that can be helpful.

Try to pass parameters that would be unwise to trust coming from another source. For instance, if an account calls a method to transfer some digital asset, and you need to do a cross-contract call, don't rely on the results of contract call to determine ownership. If the original function call determines the owner of a digital asset, pass this to the callback.

Passing parameters to callbacks is also a handy way to save fetching data from persistent collections twice: once in the initial method and again in the callback. Instead, just pass them along and save some CPU cycles.

## Checking the public key

The last simple change in this section is to modify the way we verify if a user has found the crossword solution.

In previous chapters we hashed the plaintext solution and compared it to the known solution's hash.

Here we're able to simply check the signer's public key, which is available in the `env` object [under `signer_account_pk`](https://docs.rs/near-sdk/latest/near_sdk/env/fn.signer_account_pk.html).

We'll do this check in both when the solution is submitted, and when the prize is claimed.

### When the crossword is solved

```rust
// The solver_pk parameter is the public key generated and stored in their browser
pub fn submit_solution(&mut self, solver_pk: PublicKey) {
    let answer_pk = env::signer_account_pk();
    // check to see if the answer_pk from signer is in the puzzles
    let mut puzzle = self
        .puzzles
        .get(&answer_pk)
        .expect("ERR_NOT_CORRECT_ANSWER");
```

### When prize is claimed

```rust
pub fn claim_reward(
    &mut self,
    crossword_pk: PublicKey,
    receiver_acc_id: String,
    memo: String,
) -> Promise {
    let signer_pk = env::signer_account_pk();
    // Logic skipped
    /* check if puzzle is already solved and set `Claimed` status */
    match puzzle.status {
        PuzzleStatus::Solved {
            solver_pk: puzzle_pk,
        } => {
            // Check to see if signer_pk matches
            assert_eq!(signer_pk, puzzle_pk, "You're not the person who can claim this, or else you need to use your function-call access key, friend.");
        }
```
