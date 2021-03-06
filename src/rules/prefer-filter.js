/**
 * @fileoverview Rule to check if a call to _.forEach should be a call to _.filter
 */
'use strict'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {
    const {getLodashMethodVisitor, isCallToMethod} = require('../util/lodashUtil')
    const {
        isIdentifierOfParam, 
        isMemberExpOf, 
        isNegationOfMemberOf, 
        isEqEqEqToMemberOf, 
        isNotEqEqToMemberOf, 
        getFirstFunctionLine, 
        hasOnlyOneStatement, 
        getFirstParamName
    } = require('../util/astUtil')
    const settings = require('../util/settingsUtil').getSettings(context)
    const DEFAULT_MAX_PROPERTY_PATH_LENGTH = 3
    const maxPropertyPathLength = parseInt(context.options[0], 10) || DEFAULT_MAX_PROPERTY_PATH_LENGTH

    function isIfWithoutElse(statement) {
        return statement && statement.type === 'IfStatement' && !statement.alternate
    }

    function canBeShorthand(exp, paramName) {
        return isIdentifierOfParam(exp, paramName) ||
            isMemberExpOf(exp, paramName, maxPropertyPathLength) || isNegationOfMemberOf(exp, paramName, maxPropertyPathLength) ||
            isEqEqEqToMemberOf(exp, paramName, maxPropertyPathLength) || isNotEqEqToMemberOf(exp, paramName, maxPropertyPathLength)
    }

    function onlyHasSimplifiableIf(func) {
        const firstLine = getFirstFunctionLine(func)
        return func && hasOnlyOneStatement(func) && func.params.length === 1 && isIfWithoutElse(firstLine) && canBeShorthand(firstLine.test, getFirstParamName(func))
    }

    return {
        CallExpression: getLodashMethodVisitor(settings, (node, iteratee) => {
            if (isCallToMethod(node, settings.version, 'forEach') && onlyHasSimplifiableIf(iteratee)) {
                context.report(node, 'Prefer _.filter or _.some over an if statement inside a _.forEach')
            }
        })
    }
}

module.exports.schema = [
    {
        type: 'integer'
    }
]