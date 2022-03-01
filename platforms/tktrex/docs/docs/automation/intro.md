---
sidebar_position: 1
---

# Getting Started

This project is an early stage attempt at providing a different way to quickly design
and implement complex research experiments in an automated way.

## Concepts

### Experiment

An `experiment` can be any browser automation script designed for extracting data from websites (called `platforms`),
possibly involving advanced browser interaction.

This tool lets you run `experiments` in an (as much as possible) automated way.

### Projects

A `project` is a specific instance of an experiment.

For instance, considering the experiment "Monitoring of French presidential elections on TikTok",
which has an `experimentType` of `tt-french-elections`, we can setup `projects` for running this experiment.

Every person that runs an experiment initializes a `project` corresponding to that `experiment` and runs it
from there. A `project` is simply materialized as a directory.

## Installation

```bash
git clone git@github.com:tracking-exposed/yttrex.git
git checkout <the appropriate branch, ask @djfm>
cd yttrex
yarn
cd services/tktrex/automation
```

## Usage

```bash
yarn automate init some/directory
yarn automate run some/directory
```
