const mongoose = require('mongoose');
const mockDb = require('./mockDb');

function createDynamicModel(modelName, schema) {
  const mongooseModel = mongoose.model(modelName, schema);
  const mockModel = mockDb.model(modelName);

  // Return a proxy that delegates calls to either mongooseModel or mockModel
  const handler = {
    get(target, prop) {
      const isConnected = mongoose.connection.readyState === 1;
      const activeModel = isConnected ? mongooseModel : mockModel;
      
      const value = activeModel[prop];
      if (typeof value === 'function') {
        return value.bind(activeModel);
      }
      return value;
    },
    construct(target, args) {
      const isConnected = mongoose.connection.readyState === 1;
      const activeModel = isConnected ? mongooseModel : mockModel;
      return new activeModel(...args);
    }
  };

  return new Proxy(mongooseModel, handler);
}

module.exports = createDynamicModel;
