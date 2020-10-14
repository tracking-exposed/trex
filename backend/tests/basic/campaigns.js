const _ = require('lodash');
const expect    = require("chai").expect;
const fs = require('fs');

const sourcefile = "config/campaigns.json";

describe("Test if config/campaigns.json is properly formatted", function() {

  it("Check if is a correct JSON file", async function() {
    const filecontent = fs.readFileSync(sourcefile);
    const content = JSON.parse(filecontent);
    expect(typeof content).to.be.equal(typeof []);
  });

  it("Expect at least two campaigns present", async function() {
    const filecontent = fs.readFileSync(sourcefile);
    const content = JSON.parse(filecontent);
    const campaigns = _.map(content, 'name');
    expect(_.size(campaigns)).to.be.gte(2);
  });
});
