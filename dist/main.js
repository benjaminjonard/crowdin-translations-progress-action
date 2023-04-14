"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const dotenv = __importStar(require("dotenv"));
const crowdin_api_client_1 = require("@crowdin/crowdin-api-client");
const fs_1 = __importDefault(require("fs"));
dotenv.config();
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            checkEnvironmentVariables();
            let languages = yield getLanguagesProgress();
            let markdown = generateMarkdown(languages);
            writeReadme(markdown);
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
function checkEnvironmentVariables() {
    core.info('Checking environment variables...');
    let token = process.env.CROWDIN_PERSONAL_TOKEN;
    if (!token) {
        throw Error('Missing environment variable: CROWDIN_PERSONAL_TOKEN');
    }
    core.setSecret(String(process.env.CROWDIN_PERSONAL_TOKEN));
    let projectId = process.env.CROWDIN_PROJECT_ID;
    if (!projectId) {
        throw Error('Missing environment variable: CROWDIN_PROJECT_ID');
    }
    core.setSecret(String(process.env.CROWDIN_PROJECT_ID));
}
function getLanguagesProgress() {
    core.info('Retrieving languages progress from Crowdin...');
    const translationStatusApi = new crowdin_api_client_1.TranslationStatus({
        token: String(process.env.CROWDIN_PERSONAL_TOKEN)
    });
    return translationStatusApi
        .withFetchAll()
        .getProjectProgress(Number(process.env.CROWDIN_PROJECT_ID))
        .then((response) => {
        let languages = [];
        response.data.forEach(function (language) {
            languages.push(language.data);
        });
        languages.sort((a, b) => (a.translationProgress < b.translationProgress) ? 1 : -1);
        return languages;
    })
        .catch(error => console.error(error));
}
function generateMarkdown(languages) {
    core.info('Generate Markdown table...');
    let markdown = `## Languages`;
    let minimumCompletionPercent = +core.getInput('minimum_completion_percent');
    markdown += generateTableSection(languages === null || languages === void 0 ? void 0 : languages.filter(language => language.translationProgress >= minimumCompletionPercent), 'Available');
    markdown += generateTableSection(languages === null || languages === void 0 ? void 0 : languages.filter(language => language.translationProgress < minimumCompletionPercent), 'In progress');
    return markdown;
}
function generateTableSection(languages, title) {
    if (!languages || languages.length == 0) {
        return '';
    }
    const count = languages ? languages.length : 0;
    let languagesPerRow = +core.getInput('languages_per_row');
    languagesPerRow = count < languagesPerRow ? count : languagesPerRow;
    let markdown = '\n\n';
    markdown += `#### ${title}`;
    markdown += '\n\n';
    markdown += `|`;
    for (let i = 0; i < languagesPerRow; i++) {
        markdown += ` |`;
    }
    markdown += '\n';
    markdown += `|`;
    for (let i = 0; i < languagesPerRow; i++) {
        markdown += `-------------------------|`;
    }
    languages.forEach(function (language, index) {
        const currentIndex = index + 1;
        if (currentIndex % languagesPerRow == 1 || currentIndex == 1) {
            markdown += '\n';
            markdown += '|';
        }
        markdown += `<div align="center" valign="top"><img width="30px" height="30px" src="https://d2gma3rgtloi6d.cloudfront.net/16abbf59/images/flags/small/${language.languageId}.png"></div><div align="center" valign="top">${language.translationProgress}%</div>|`;
    });
    return markdown;
}
function writeReadme(markdown) {
    let fileContents = fs_1.default.readFileSync('README.md').toString();
    markdown = `<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-START -->\n${markdown}\n<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-END -->`;
    fileContents = fileContents.replace(/<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-START -->.*<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-END -->/gs, markdown);
    fs_1.default.writeFileSync('README.md', fileContents);
}
/*function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
        .toUpperCase()
        .slice(0, 2)
        .split('')
        .map(char =>  127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
}*/
run();
