var AdapterResult = /** @class */ (function () {
    function AdapterResult(params) {
        this.result = params.result;
        this.errorInfo = params.errorInfo;
    }
    AdapterResult.prototype.hasNoData = function () {
        var _a;
        if (this.result && 'hasNoData' in this.result) {
            return this.result.hasNoData();
        }
        else {
            return this.result == null || ((_a = this.result) === null || _a === void 0 ? void 0 : _a.data) == null;
        }
    };
    AdapterResult.prototype.hasError = function () {
        var _a;
        return ((_a = this.getErrors()) === null || _a === void 0 ? void 0 : _a.length) > 0;
    };
    AdapterResult.prototype.getData = function () {
        if (this.hasNoData()) {
            return null;
        }
        return this.result.data;
    };
    /** Returns error array if errors are present.  If no errors present, returns null */
    AdapterResult.prototype.getErrors = function () {
        var _a, _b;
        if (((_a = this.errorInfo) === null || _a === void 0 ? void 0 : _a.errors) && ((_b = this.errorInfo) === null || _b === void 0 ? void 0 : _b.errors.length) > 0) {
            return this.errorInfo.errors;
        }
        return null;
    };
    /** Returns catastrophic error if present, otherwise returns null */
    AdapterResult.prototype.getCatastrophicError = function () {
        var _a;
        if ((_a = this.errorInfo) === null || _a === void 0 ? void 0 : _a.catastrophicError) {
            return this.errorInfo.catastrophicError;
        }
        return null;
    };
    return AdapterResult;
}());

export { AdapterResult as A };
//# sourceMappingURL=AdapterResult-96d676e4.js.map
