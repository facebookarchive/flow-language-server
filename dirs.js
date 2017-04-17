const {getFlowDataDir} = require('./lib/flow-versions/utils');

module.exports = {
  flowData: getFlowDataDir(),
};
