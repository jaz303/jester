module.exports = {
    createContext   : require('./lib/context').createContext,
    createVM        : require('./lib/vm').createVM,
    constants       : require('./lib/constants'),
    opcodeMeta      : require('./lib/vm').opcodeMeta
};