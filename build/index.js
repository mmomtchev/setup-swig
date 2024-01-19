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
var core_1 = require("@octokit/core");
var os = require("os");
var path = require("path");
var repos = {
    main: { owner: 'swig', repo: 'swig' },
    jse: { owner: 'mmomtchev', repo: 'swig' }
};
var octokit = new core_1.Octokit;
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var version_1, branch, tags, tag, target, swigArchive, swigRoot, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    if (os.platform() !== 'linux') {
                        throw new Error('Only Linux runners are supported at the moment');
                    }
                    return [4 /*yield*/, core.getInput('version')];
                case 1:
                    version_1 = _a.sent();
                    return [4 /*yield*/, core.getInput('branch')];
                case 2:
                    branch = _a.sent();
                    if (!repos[branch])
                        throw new Error('Invalid branch');
                    return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/tags', {
                            owner: repos[branch].owner,
                            repo: repos[branch].repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        }).then(function (tags) { return tags.data.sort(function (a, b) { return a.name.localeCompare(b.name); }).reverse(); })];
                case 3:
                    tags = _a.sent();
                    console.log(tags);
                    console.log(version_1);
                    tag = version_1 === 'last' ? tags[0] : tags.find(function (t) { return t.name === version_1; });
                    if (!tag)
                        throw new Error('Invalid version');
                    target = path.join(process.env.GITHUB_WORKSPACE, 'swig');
                    console.log("Installing SWIG".concat(branch !== 'main' ? "-".concat(branch) : '', " ").concat(tag.name, " in ").concat(target));
                    return [4 /*yield*/, tc.downloadTool(tag.tarball_url)];
                case 4:
                    swigArchive = _a.sent();
                    return [4 /*yield*/, tc.extractTar(swigArchive, target)];
                case 5:
                    swigRoot = _a.sent();
                    return [4 /*yield*/, exec.exec("cd swig/swig-".concat(version_1, " && sh autogen.sh && ./configure && make"))];
                case 6:
                    _a.sent();
                    core.exportVariable('SWIG_LIB', path.resolve(swigRoot, 'Lib'));
                    core.exportVariable('PATH', process.env.PATH + ':' + swigRoot);
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    if (error_1 &&
                        typeof error_1 === 'object' &&
                        'message' in error_1 &&
                        (typeof error_1.message === 'string' ||
                            error_1.message instanceof Error)) {
                        core.setFailed(error_1.message);
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
run();
