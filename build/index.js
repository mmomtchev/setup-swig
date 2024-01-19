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
        var version_1, _a, branch_1, _b, shouldCache, tags, tag, swigRoot, cached, cacheKey, _c, _d, swigArchive, error_1;
        var _this = this;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 22, , 23]);
                    if (os.platform() !== 'linux') {
                        throw new Error('Only Linux runners are supported at the moment');
                    }
                    _a = process.env.SETUP_SWIG_VERSION;
                    if (_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, core.getInput('version')];
                case 1:
                    _a = (_e.sent());
                    _e.label = 2;
                case 2:
                    version_1 = _a;
                    _b = process.env.SETUP_SWIG_BRANCH;
                    if (_b) return [3 /*break*/, 4];
                    return [4 /*yield*/, core.getInput('branch')];
                case 3:
                    _b = (_e.sent());
                    _e.label = 4;
                case 4:
                    branch_1 = _b;
                    return [4 /*yield*/, core.getInput('cache')];
                case 5:
                    shouldCache = _e.sent();
                    if (!repos[branch_1])
                        throw new Error('Invalid branch');
                    return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/tags', {
                            owner: repos[branch_1].owner,
                            repo: repos[branch_1].repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })
                            .then(function (tags) { return Promise.all(tags.data.map(function (t) { return __awaiter(_this, void 0, void 0, function () {
                            var date, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = Date.bind;
                                        return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/commits/{tag}', {
                                                tag: t.name,
                                                owner: repos[branch_1].owner,
                                                repo: repos[branch_1].repo,
                                                headers: {
                                                    'X-GitHub-Api-Version': '2022-11-28'
                                                }
                                            })];
                                    case 1:
                                        date = new (_a.apply(Date, [void 0, (_b.sent()).data.commit.author.date]))();
                                        return [2 /*return*/, ({
                                                name: t.name,
                                                tarball_url: t.tarball_url,
                                                date: date
                                            })];
                                }
                            });
                        }); }))
                            .then(function (tags) { return tags.sort(function (a, b) { return a.date.getTime() - b.date.getTime(); }).reverse(); }); })];
                case 6:
                    tags = _e.sent();
                    tag = version_1 === 'latest' ? tags[0] : tags.find(function (t) { return t.name === version_1; });
                    if (!tag)
                        throw new Error('Invalid version');
                    swigRoot = path.join(process.env.GITHUB_WORKSPACE, 'swig');
                    cached = false;
                    cacheKey = "swig-".concat(branch_1, "-").concat(tag.name, "-").concat(os.platform(), "-").concat(os.arch(), "-").concat(os.release());
                    if (!shouldCache) return [3 /*break*/, 13];
                    _e.label = 7;
                case 7:
                    _e.trys.push([7, 12, , 13]);
                    _e.label = 8;
                case 8:
                    _e.trys.push([8, 9, , 11]);
                    fs.accessSync(swigRoot, fs.constants.X_OK);
                    return [3 /*break*/, 11];
                case 9:
                    _c = _e.sent();
                    return [4 /*yield*/, cache.restoreCache([swigRoot], cacheKey)];
                case 10:
                    _e.sent();
                    return [3 /*break*/, 11];
                case 11:
                    fs.accessSync(swigRoot, fs.constants.X_OK);
                    core.info("Found cached instance ".concat(cacheKey));
                    cached = true;
                    return [3 /*break*/, 13];
                case 12:
                    _d = _e.sent();
                    core.info('Rebuilding from source');
                    return [3 /*break*/, 13];
                case 13:
                    if (!!cached) return [3 /*break*/, 21];
                    core.info("Downloading from ".concat(tag.tarball_url));
                    core.info("Installing SWIG".concat(branch_1 !== 'main' ? "-".concat(branch_1) : '', " ").concat(tag.name, " in ").concat(swigRoot));
                    return [4 /*yield*/, tc.downloadTool(tag.tarball_url)];
                case 14:
                    swigArchive = _e.sent();
                    return [4 /*yield*/, tc.extractTar(swigArchive, swigRoot, ['-zx', '--strip-components=1'])];
                case 15:
                    _e.sent();
                    return [4 /*yield*/, exec.exec('sh', ['autogen.sh'], { cwd: swigRoot })];
                case 16:
                    _e.sent();
                    return [4 /*yield*/, exec.exec('sh', ['configure'], { cwd: swigRoot })];
                case 17:
                    _e.sent();
                    return [4 /*yield*/, exec.exec('make', [], { cwd: swigRoot })];
                case 18:
                    _e.sent();
                    return [4 /*yield*/, exec.exec('ln', ['-s', 'swig', "swig-".concat(branch_1)], { cwd: swigRoot })];
                case 19:
                    _e.sent();
                    if (!shouldCache) return [3 /*break*/, 21];
                    return [4 /*yield*/, cache.saveCache([swigRoot], cacheKey)];
                case 20:
                    _e.sent();
                    core.info("Saved to cache ".concat(cacheKey));
                    _e.label = 21;
                case 21:
                    core.exportVariable('SWIG_LIB', path.resolve(swigRoot, 'Lib'));
                    core.exportVariable('PATH', swigRoot + ':' + process.env.PATH);
                    return [3 /*break*/, 23];
                case 22:
                    error_1 = _e.sent();
                    if (error_1 &&
                        typeof error_1 === 'object' &&
                        'message' in error_1 &&
                        (typeof error_1.message === 'string' ||
                            error_1.message instanceof Error)) {
                        core.setFailed(error_1.message);
                    }
                    return [3 /*break*/, 23];
                case 23: return [2 /*return*/];
            }
        });
    });
}
run();
