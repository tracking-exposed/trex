---
sidebar_position: 1
title: Introduction
id: guardoni-intro
---

# Guardoni documentation

Guardoni is a free software **automated web scraper**, used to collect data about platforms as Youtube and Tik Tok. It is a [puppeteer](https://github.com/puppeteer/puppeteer)-based tool integrating Tracking Exposed extensions on its browser. Data is gathered and copied from platforms into our database for later retrieval or analysis.

## 🤝 Getting help

Having trouble? We’d like to help!

<!-- Try the FAQ – it’s got answers to some common questions. -->

- Feel free to ask questions by email. <!-- should the email be visible? -->

- Check the **[Github](https://github.com/tracking-exposed)** repo, report bugs or contribute. ❤️

- Join the community in Tracking Exposed **[Slack](trackingexposed.slack.com)**.

- Send a **[Tweet](https://twitter.com/trackingexposed)**

## 🛠 Disclaimer

Guardoni is still **alpha** stage, the software is not thoroughly tested by the developers yet, it may contain serious errors, and any resulting instability could cause crashes or data loss. Alpha software may not contain all of the features that are planned for the final version. In general, free software often has publicly available alpha versions.

## 👣 First steps

- **[Guardoni at first sight](https://docs.tracking.exposed/guardoni/getting-started/usage)**

  Understand what Guardoni is and how it can help you.

- **[Installation guide](https://docs.tracking.exposed/guardoni/getting-started/installation)**

  Get Scrapy installed on your computer.

- **Coming soon:** Guardoni Tutorial <!-- TBD -->

  Participate to our first experiment and learn how to create your first project.

- **Coming soon:** Examples and ready made experiments <!-- TBD -->

  Learn more by playing with a pre-made Tracking Exposed experiment.

<!--
## ⚛️ Features
-->

## 🔬 How we collect data

_Guardoni_ is not the direct responsible of collecting data while browsing, as it is, in simple words, just a wrapper around puppeteer with some automation features. The data scraping and collection is made by our browser extensions, loaded by _Guardoni_ at bootstrap.

## 🧪 Experiments

Experiments are instructions prepared to perform a series of actions. They are csv files with a list of URLs and and watching time. They belong to an exploratory phase, allowing us to work on a common basis and compare differences.

## 🏹 Design principles

- **User friendly**. Guardoni should be easy to learn and use, users shall not feel overwhelmed. It should look intuitive and easy to build on top of, using approaches they are familiar with.

- **Optimal Resource Consumption**. A wise, cost-efficient approach to system resources. Efficiency is one of the critical factors identifying high-quality softwares.

- **Interoperability**. Common data formats and communication protocols to work with other products or systems.
