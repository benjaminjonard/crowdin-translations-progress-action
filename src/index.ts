import * as core from '@actions/core';
import * as dotenv from 'dotenv';
import {TranslationStatus} from '@crowdin/crowdin-api-client';
import fs from 'fs';

dotenv.config();

async function run(): Promise<void> {
    try {
        checkEnvironmentVariables();
        let languages = await getLanguagesProgress();
        let markdown = generateMarkdown(languages);
        writeReadme(markdown);
        core.info('Done !');
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

function checkEnvironmentVariables(): void {
    core.info('Checking environment variables...');

    let token = process.env.CROWDIN_PERSONAL_TOKEN;
    if (!token) {
        throw Error('Missing environment variable: CROWDIN_PERSONAL_TOKEN');
    }

    let projectId = process.env.CROWDIN_PROJECT_ID;
    if (!projectId) {
        throw Error('Missing environment variable: CROWDIN_PROJECT_ID');
    }
}

function getLanguagesProgress() {
    core.info('Retrieving languages progress from Crowdin...');

    const translationStatusApi = new TranslationStatus({
        token: String(process.env.CROWDIN_PERSONAL_TOKEN)
    });

    return translationStatusApi
        .withFetchAll()
        .getProjectProgress(Number(process.env.CROWDIN_PROJECT_ID))
        .then((response) => {
            let languages:any[] = [];

            response.data.forEach(function (language) {
                languages.push(language.data);
            })

            languages.sort((a, b) => (a.translationProgress < b.translationProgress) ? 1 : -1)

            return languages;
        })
        .catch(error => console.error(error))
    ;
}

function generateMarkdown(languages: any[] | void): string {
    core.info('Generate Markdown table...');

    let markdown: string = `## Languages`;

    let minimumCompletionPercent: number = +core.getInput('minimum_completion_percent');
    markdown += generateTableSection(languages?.filter(language => language.translationProgress >= minimumCompletionPercent), 'Available');
    markdown += generateTableSection(languages?.filter(language => language.translationProgress < minimumCompletionPercent), 'In progress');

    return markdown;
}

function generateTableSection(languages: any[] | void, title: string): string {
    if (!languages || languages.length == 0) {
        return '';
    }

    const count: number = languages ? languages.length : 0;
    let languagesPerRow: number = +core.getInput('languages_per_row');
    languagesPerRow = count < languagesPerRow ? count : languagesPerRow;

    let markdown: string = '\n\n';
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

    languages.forEach(function (language, index: number) {
        const currentIndex: number = index + 1;
        if (currentIndex % languagesPerRow == 1 || currentIndex == 1) {
            markdown += '\n';
            markdown += '|';
        }

        markdown += `<div align="center" valign="top"><img width="30px" height="30px" src="https://d2gma3rgtloi6d.cloudfront.net/16abbf59/images/flags/small/${language.languageId}.png"></div><div align="center" valign="top">${language.translationProgress}%</div>|`;
    });

    return markdown;
}

function writeReadme(markdown: string): void {
    let file: string = core.getInput('file');

    if (!fs.existsSync(file)) {
        throw Error(`The file ${file} doesn't exists`);
    }

    let fileContents = fs.readFileSync(file).toString();

    markdown = `<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-START -->\n${markdown}\n<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-END -->`
    fileContents = fileContents.replace(/<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-START -->.*<!-- ACTION-CROWDIN-LANGUAGES-PROGRESS-END -->/gs, markdown);

    fs.writeFileSync(file, fileContents);
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
