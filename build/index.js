"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("@actions/core");
var exec = require("@actions/exec");
var tc = require("@actions/tool-cache");
var cache = require("@actions/cache");
var core_1 = require("@octokit/core");
var os = require("os");
var path = require("path");
var fs = require("fs");
var repos = {
    main: { owner: 'swig', repo: 'swig' },
    jse: { owner: 'mmomtchev', repo: 'swig' }
};
var octokit = new core_1.Octokit({ auth: process.env.GITHUB_TOKEN });
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var version_1, branch, shouldCache, debug, tags, tag, swigRoot, cached, cacheKey, _a, _b, swigArchive, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 21, , 22]);
                    if (os.platform() !== 'linux') {
                        throw new Error('Only Linux runners are supported at the moment');
                    }
                    return [4 /*yield*/, core.getInput('version', { required: false })];
                case 1:
                    version_1 = _c.sent();
                    return [4 /*yield*/, core.getInput('branch', { required: false })];
                case 2:
                    branch = _c.sent();
                    return [4 /*yield*/, core.getBooleanInput('cache', { required: false })];
                case 3:
                    shouldCache = _c.sent();
                    return [4 /*yield*/, core.getBooleanInput('debug', { required: false })];
                case 4:
                    debug = _c.sent();
                    if (!repos[branch])
                        throw new Error('Invalid branch');
                    if (debug)
                        core.debug("Retrieving SWIG-".concat(branch, "-").concat(version_1));
                    return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/tags', {
                            owner: repos[branch].owner,
                            repo: repos[branch].repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 5:
                    tags = (_c.sent()).data;
                    if (debug)
                        tags.forEach(function (t) { return core.debug("Found tag ".concat(t.name)); });
                    tag = version_1 === 'latest' ? tags[0] : tags.find(function (t) { return t.name === version_1; });
                    if (!tag)
                        throw new Error('Invalid version');
                    swigRoot = path.join(process.env.RUNNER_TOOL_CACHE, 'swig');
                    cached = false;
                    cacheKey = "swig-".concat(branch, "-").concat(tag.name, "-").concat(os.platform(), "-").concat(os.arch(), "-").concat(os.release());
                    if (debug)
                        core.debug("Using cacheKey ".concat(cacheKey, ", swigRoot ").concat(swigRoot));
                    if (!shouldCache) return [3 /*break*/, 12];
                    _c.label = 6;
                case 6:
                    _c.trys.push([6, 11, , 12]);
                    _c.label = 7;
                case 7:
                    _c.trys.push([7, 8, , 10]);
                    fs.accessSync(swigRoot, fs.constants.X_OK);
                    return [3 /*break*/, 10];
                case 8:
                    _a = _c.sent();
                    return [4 /*yield*/, cache.restoreCache([swigRoot], cacheKey)];
                case 9:
                    _c.sent();
                    return [3 /*break*/, 10];
                case 10:
                    fs.accessSync(swigRoot, fs.constants.X_OK);
                    core.info("Found cached instance ".concat(cacheKey));
                    cached = true;
                    return [3 /*break*/, 12];
                case 11:
                    _b = _c.sent();
                    core.info('Rebuilding from source');
                    return [3 /*break*/, 12];
                case 12:
                    if (!!cached) return [3 /*break*/, 20];
                    core.info("Downloading from ".concat(tag.tarball_url));
                    core.info("Installing SWIG".concat(branch !== 'main' ? "-".concat(branch) : '', " ").concat(tag.name, " in ").concat(swigRoot));
                    return [4 /*yield*/, tc.downloadTool(tag.tarball_url)];
                case 13:
                    swigArchive = _c.sent();
                    return [4 /*yield*/, tc.extractTar(swigArchive, swigRoot, ['-zx', '--strip-components=1'])];
                case 14:
                    _c.sent();
                    return [4 /*yield*/, exec.exec('sh', ['autogen.sh'], { cwd: swigRoot })];
                case 15:
                    _c.sent();
                    return [4 /*yield*/, exec.exec('sh', ['configure'], { cwd: swigRoot })];
                case 16:
                    _c.sent();
                    return [4 /*yield*/, exec.exec('make', [], { cwd: swigRoot })];
                case 17:
                    _c.sent();
                    return [4 /*yield*/, exec.exec('ln', ['-s', 'swig', "swig-".concat(branch)], { cwd: swigRoot })];
                case 18:
                    _c.sent();
                    if (!shouldCache) return [3 /*break*/, 20];
                    return [4 /*yield*/, cache.saveCache([swigRoot], cacheKey)];
                case 19:
                    _c.sent();
                    core.info("Saved to cache ".concat(cacheKey));
                    _c.label = 20;
                case 20:
                    core.exportVariable('SWIG_LIB', path.resolve(swigRoot, 'Lib'));
                    core.exportVariable('PATH', swigRoot + ':' + process.env.PATH);
                    if (debug)
                        core.debug("exporting SWIG_LIB=".concat(path.resolve(swigRoot, 'Lib'), " PATH=").concat(swigRoot + ':' + process.env.PATH));
                    return [3 /*break*/, 22];
                case 21:
                    error_1 = _c.sent();
                    if (error_1 &&
                        typeof error_1 === 'object' &&
                        'message' in error_1 &&
                        (typeof error_1.message === 'string' ||
                            error_1.message instanceof Error)) {
                        core.setFailed(error_1.message);
                    }
                    return [3 /*break*/, 22];
                case 22: return [2 /*return*/];
            }
        });
    });
}
run();
