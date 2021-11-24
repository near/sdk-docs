---
sidebar_position: 4
sidebar_label: "Add a puzzle"
title: "Adding a new puzzle now that we're using a collection that can contain multiple crossword puzzles"
---

import blankCrossword from '../assets/chapter-2-crossword-blank.png';

# Adding a puzzle

We're going to make a new puzzle, which means we need to provide the smart contract with a set of clues and info about the answers.

Of course, we'll not be sending the *answers* to the smart contract, otherwise everyone could see. We will, however, send details about each clue, including:

- The clue number
- Whether it's a down or across clue
- The coordinates (x and y position)
- The length of the clue. (How many letters)

Essentially, we're going to tell the smart contract enough information for an empty puzzle like this:

<img src={blankCrossword} alt="Blank crossword for chapter 2 of the crossword puzzle smart contract tutorial" width="600"/>
<br/>

(Note that we aren't showing the human-readable clues in the above screenshot, but we will provide that as well.)

## The clues

We're going to use these clues below for our improved puzzle. The **Answer** column will not get sent to the smart contract when we call `new_puzzle`.

| Number | Answer    | Clue | (x, y) coords | length |
| ----------- | ----------- | ----------- | ----------- | ----------- |
| 1 | paras | NFT market on NEAR that specializes in cards and comics. | (1, 1) | 5 |
| 2 | rainbowbridge | You can move assets between NEAR and different chains, including Ethereum, by visiting ______.app | (0, 2) | 13 |
| 3 | mintbase | NFT market on NEAR with art, physical items, tickets, and more. | (9, 1) | 8 |
| 4 | yoctonear | The smallest denomination of the native token on NEAR. | (3, 8) | 9 |
| 5 | cli | You typically deploy a smart contract with the NEAR ___ tool. | (5, 8) | 3 |

The x and y coordinates have their origin in the upper-left side of the puzzle grid, and each row and column start at 0.

## Solution hash

Let's derive the sha256 hash using an [easy online tool](https://www.wolframalpha.com/input/?i=sha256+%22paras+rainbowbridge+mintbase+yoctonear+cli%22) (there are many other offline methods as well) to discover the solution hash:

    d1a5cf9ad1adefe0528f7d31866cf901e665745ff172b96892693769ad284010

## Add the puzzle

Add a new puzzle using NEAR CLI with this long command, replacing `crossword.friend.testnet` with your subaccount:

```
near call crossword.friend.testnet new_puzzle '{
  "solution_hash": "d1a5cf9ad1adefe0528f7d31866cf901e665745ff172b96892693769ad284010",
  "answers": [
   {
     "num": 1,
     "start": {
       "x": 1,
       "y": 1
     },
     "direction": "Down",
     "length": 5,
     "clue": "NFT market on NEAR that specializes in cards and comics."
   },
   {
     "num": 2,
     "start": {
       "x": 0,
       "y": 2
     },
     "direction": "Across",
     "length": 13,
     "clue": "You can move assets between NEAR and different chains, including Ethereum, by visiting ______.app"
   },
   {
     "num": 3,
     "start": {
       "x": 9,
       "y": 1
     },
     "direction": "Down",
     "length": 8,
     "clue": "NFT market on NEAR with art, physical items, tickets, and more."
   },
   {
     "num": 4,
     "start": {
       "x": 3,
       "y": 8
     },
     "direction": "Across",
     "length": 9,
     "clue": "The smallest denomination of the native token on NEAR."
   },
   {
     "num": 5,
     "start": {
       "x": 5,
       "y": 8
     },
     "direction": "Down",
     "length": 3,
     "clue": "You typically deploy a smart contract with the NEAR ___ tool."
   }
  ]
}' --accountId crossword.friend.testnet
```