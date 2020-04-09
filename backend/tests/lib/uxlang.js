const _ = require('lodash');
const expect = require("chai").expect;
const moment = require("moment");
const debug = require("debug")("test:lib:uxlang");

const uxlang = require('../../parsers/uxlang');

/* This first check the capacity of load data and verify they are avail */
describe("Testing the localized strings", function() {

  const Polish = "Transmisja rozpoczęta 5 godzin temu";
  it(Polish, async function() {
    const { amount, unit } = uxlang.tryNLregexpChain(Polish)
    expect(amount).to.be.greaterThan(0);
    expect(_.keys(uxlang.localized)).to.be.an('array').that.does.includes(unit);
  });

  const Less1min = "Streaming started less than 1 minute ago";
  it(Less1min, async function() {
    const { amount, unit } = uxlang.tryNLregexpChain(Less1min)
    expect(amount).to.be.greaterThan(0);
    expect(_.keys(uxlang.localized)).to.be.an('array').that.does.includes(unit);
  });

  const Tedesco = "Aktiver Livestream seit 2 Minuten";
  it(Tedesco, function() {
    const { amount, unit } = uxlang.tryNLregexpChain(Tedesco)
    expect(amount).to.be.greaterThan(0);
    expect(_.keys(uxlang.localized)).to.be.an('array').that.does.includes(unit);
  });

});