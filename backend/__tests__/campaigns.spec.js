import _ from 'lodash';
import * as fs from 'fs';

const sourcefile = "config/campaigns.json";

describe("Test if config/campaigns.json is properly formatted", function() {

  it("Check if is a correct JSON file", async function() {
    const filecontent = fs.readFileSync(sourcefile);
    const content = JSON.parse(filecontent);
    expect(content).toBeInstanceOf(Array);
  });

  it("Expect at least two campaigns present", async function() {
    const filecontent = fs.readFileSync(sourcefile);
    const content = JSON.parse(filecontent);
    const campaigns = _.map(content, 'name');
    expect(_.size(campaigns)).toBeGreaterThan(2);
  });
});
