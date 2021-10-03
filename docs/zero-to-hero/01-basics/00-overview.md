---
sidebar_position: 1
sidebar_label: "Overview"
title: "Basics overview laying out what will be accomplished in this first section."
---

import myImageUrl from '../assets/basics-crossword.jpg';

# Basics Overview

This first chapter of the crossword puzzle tutorial will introduce fundamental concepts to smart contract development in a beginner-friendly way. By the end of this chapter we'll have a proof-of-concept contract that can be interacted with via [NEAR CLI](https://docs.near.org/docs/tools/near-cli) and a simple frontend that uses the [`near-api-js` library](https://www.npmjs.com/package/near-api-js).

## Assumptions on what we're building

- There will be only one crossword puzzle with one solution.
- The user solving the crossword puzzle will not be able to know the solution.
- Only the author of the crossword puzzle smart contract can set the solution.

## How it works

<img src={myImageUrl} alt="Example banner" width="600" />

We'll have a rule about how to get the words in the proper order. We collect words in ascending order by number, and if there's and across and a down for a number, the across goes first.

So in the image above, the solution will be **near nomicon ref finance**. 

Let's begin!