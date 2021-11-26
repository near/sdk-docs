---
sidebar_position: 6
sidebar_label: "Access keys and login 2/2"
title: "Implementing the login button"
---

import loggingIn from '../assets/logging-in.png';

# Add the login functionality

## Plan

We're going to add a login button that uses `near-api-js` to login with NEAR.

Below is the workflow of logging in: 

<img src={loggingIn} alt="Three steps to logging in. 1. click the login button we will build. 2. It creates a private key in the browser local storage. 3. Redirected to NEAR Wallet where you sign, creating a new key"/><br/><br/>

1. User clicks the login button
2. `near-api-js` creates a private key in the browser
3. A redirect to NEAR Wallet occurs, passing the public key. NEAR Wallet (often) has a full-access key capable of the `AddKey` action. The user follows a wizard, ultimately authorizing the creation of a new key.

## Adding the button

In the `src` directory we'll look at:

- `index.js`
- `App.js`

We won't go over every change, but instead point to the new logic.

First we set up a `WalletConnection` object from our JavaScript library:

```js reference
https://github.com/near-examples/crossword-tutorial-chapter-2/blob/1d64bf29c3376a18c71e5c5a075e29824d7a55f5/src/index.js#L12-L20
```

It's then used in React:

```js
const signIn = () => {
  walletConnection.requestSignIn(
    nearConfig.contractName,
    '', // title. Optional, by the way
    '', // successUrl. Optional, by the way
    '', // failureUrl. Optional, by the way
  );
};

const signOut = () => {
  walletConnection.signOut();
  …
};

…

return (
  <div id="page">
    <h1>NEAR Crossword Puzzle</h1>
    <div id="crossword-wrapper">
      <div id="login">
        { currentUser
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </div>
      …
    </div>
  </div>
);
```

Once logged in, that `WalletConnection` object will be tied to the logged-in user, and they'll use that key to sign transactions and interact with the contract.

:::info Transactions that redirect to NEAR Wallet
In our improved crossword puzzle, the function-call access key for the logged-in user will be signing a transaction to submit their solution.

You may notice, however, that sometimes you'll be redirected to NEAR Wallet, and other times you aren't.

This goes back to an earlier rule we mentioned: function-call access keys cannot send NEAR. They cannot perform the `Transfer` Action.

If a function call requires even 1 yoctoNEAR, NEAR Wallet (or any other wallet containing a full-access key) is required to sign the transaction.
:::

## Call the contract function from JavaScript

The frontend code contains a check to see if the user has completed the crossword puzzle successfully. In there we'll add logic to call the `submit_solution` function on the smart contract.

```js
// Send the 5 NEAR prize to the logged-in winner
let functionCallResult = await walletConnection.account().functionCall({
  contractId: nearConfig.contractName,
  methodName: 'submit_solution',
  args: {solution_hash: seedPhrase, memo: "Yay I won!"},
  gas: DEFAULT_FUNCTION_CALL_GAS, // optional param, by the way
  attachedDeposit: 0,
  walletMeta: '', // optional param, by the way
  walletCallbackUrl: '' // optional param, by the way
});

if (functionCallResult && functionCallResult.transaction && functionCallResult.transaction.hash) {
  // Display a link the NEAR Explorer
  console.log('Transaction hash for explorer', functionCallResult.transaction.hash)
}
```

:::tip try…catch blocks
It's not a bad idea to wrap these type of calls in try…catch blocks to properly handle any errors that come from the blockchain.

These errors can be quite helpful to the developer and the end user.
:::

## Fetch the puzzle, finish up

In the previous chapter, the frontend had a hardcoded file containing information about the clues for a simple crossword puzzle. In this chapter, we've given the coordinates and details about the clues, but the frontend needs to fetch this information.

We're going to modify the logic surrounding our view-only call to `get_unsolved_puzzles` on the contract. This method now returns the clue information, so we've implemented a function that puts it in the proper format for React to construct the crossword puzzle.

This is a tutorial about Rust smart contract development, so we won't focus on the details of this, but know we've added the function `mungeBlockchainCrossword`. This allows us to keep adding custom crossword puzzles and have the frontend be dynamic.

We'll also make other minor changes like adding a page for when there are no puzzles available, and adding a loading screen.