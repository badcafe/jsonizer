import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('[GENERATING docs/REPORTS.md]');

const loc = JSON.parse(fs.readFileSync(`${__dirname}/sloc-report.json`, 'utf8')); // this file is generated (see package.json)
const locTests = JSON.parse(fs.readFileSync(`${__dirname}/sloc-tests-report.json`, 'utf8')); // this file is generated (see package.json)
const jest = JSON.parse(fs.readFileSync(`${__dirname}/jest-report.json`, 'utf8')); // this file is generated (see package.json)
const esl: ESLint[] = JSON.parse(fs.readFileSync(`${__dirname}/eslint-report.json`, 'utf8')); // this file is generated (see package.json)

interface ESLint {
    "filePath": string,
    "messages": ESLint.Message[],
    "errorCount": number,
    "warningCount": number,
    "fixableErrorCount": number,
    "fixableWarningCount": number,
    "usedDeprecatedRules": []
}
namespace ESLint {
    export interface Message {
        "ruleId": string,
        "severity": number,
        "message": string,
        "line": number,
        "column": number,
        "nodeType": string,
        "messageId": string,
        "endLine": number,
        "endColumn": number
    }
    export interface Summary {
        problems: number,
        errorCount: number,
        warningCount: number
    }
}

const eslintSummary = esl.reduce<ESLint.Summary>((prev, curr) => {
    prev.problems += curr.errorCount + curr.warningCount;
    prev.errorCount += curr.errorCount;
    prev.warningCount += curr.warningCount;
    return prev;
}, {problems: 0,
    errorCount: 0,
    warningCount: 0
})

/**
 * Generate docs/REPORTS.md
 * 
 * * Metrics from sloc + Pie chart
 * * Linter from tslint
 * * Tests from jest
 */
const lines: string = `<!--DO NOT EDIT : this file has been generated-->

# Reports

> Code quality reports

## Metrics

<div class="chart-container" style="float:right; height:450px; width:450px">
    <canvas id="metricsChart"></canvas>
</div>

| Files | ${loc.files.length} | |
| ----- | -: | - |
| Lines of code | ${loc.summary.source} | (w/o comments) |
| Comments | ${loc.summary.comment - loc.summary.mixed} | (+ ${loc.summary.mixed} with code) |
| Empty lines | ${loc.summary.empty} | |
| **Total lines** | **${loc.summary.total}** | (w/o tests) |
| TODO | ${loc.summary.todo} | lines |
| Tests | ${locTests.summary.source} | (w/o comments) |

<script>
var ctx = document.getElementById('metricsChart');
var myChart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Code', 'Comments', 'Empty', 'Tests'],
        datasets: [{
            label: 'Metrics',
            data: [${loc.summary.source}, 
                ${loc.summary.comment - loc.summary.mixed}, 
                ${loc.summary.empty},
                ${locTests.summary.source}
            ],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 2
        }]
    }
});
</script>

## Linter

**${eslintSummary.problems === 0 ? '✅': '❌'} &nbsp; ${eslintSummary.problems} problem${eslintSummary.problems === 1 ? '': 's'}**

${eslintSummary.problems === 0 ? '': `
| File | Position | Severity | Rule | Failure |
| ---- | --- | -------- | ---- | ------- |
${esl.filter(file => ! file.filePath.endsWith('/index.ts'))
    .map(file => file.messages.map(msg =>
`| \`${file.filePath.slice(file.filePath.indexOf('/src/')+5)}\` | ${position(msg)} | ${msg.severity >= 2 ? '🌧' : msg.severity === 1 ? '⛅️': ''} | ${msg.ruleId} | ${msg.message} |
`).join('')).join('')}
` /* end eslintSummary.problems === 0 */}

## Tests

|   | Tests suites | Tests |
| - | ------------ | ----- |
| ❌ &nbsp; Failed | ${jest.numFailedTestSuites} | ${jest.numFailedTests} |
| ✅ &nbsp; Passed | ${jest.numPassedTestSuites} | ${jest.numPassedTests} |
| ✴ &nbsp; Pending | ${jest.numPendingTestSuites} | ${jest.numPendingTests} |
| ☢ &nbsp; Error | ${jest.numRuntimeErrorTestSuites} | |
| **Total** | **${jest.numTotalTestSuites}** | **${jest.numTotalTests}** |

${jest.wasInterrupted ? '💥 Tests interrupted !': ''}

${jest.testResults.map((suite: any) => `
### ${statusIcon(suite.status)} \`${suite.name.substring(suite.name.indexOf('/test/'))}\` **${(suite.endTime - suite.startTime) / 1000}s** ${(suite.endTime - suite.startTime) / 1000 > 5 ? '🐢': ''}

${suite.assertionResults.length === 0
    ? ''
    : suite.assertionResults.reduce((prev: any, test: any) => {
        if (prev[prev.length -1]?.group === test.ancestorTitles[0]) {
            prev[prev.length -1].tests.push(test)
        } else {
            prev.push({
                group: test.ancestorTitles[0],
                tests: [test]
            })
        }
        return prev;
    }, []).map(({group, tests}: any) => `
#### 🔹 ${group}

| Status | Suite | Test |
| ------ | ----- | ---- |
${tests.map((test: any) =>
    `| ${statusIcon(test.status)} | ${test.ancestorTitles.slice(1).join(' 🔹 ')} | ${test.title} |
`).join('')}
`).join('')}
`).join('')}
`;

fs.writeFileSync('./docs/REPORTS.md', lines);

/**
 * Display a position of a lint result :
 * 
 * * `264,12`
 * * `264,12-13`
 * * `264,12 - 275,8`
 * 
 * @param lint Linter value
 */
function position(msg: ESLint.Message) {
    let pos = `${msg.line},${msg.column}`;
    if (msg.line === msg.endLine) {
        if (msg.column !== msg.endColumn) {
            pos += `-${msg.endColumn}`
        }
    } else {
        pos += ` - ${msg.endLine},${msg.endColumn}`
    }
    return pos;
}

/**
 * Get the status Icon
 * 
 * @param status 
 */
function statusIcon(status: string) {
    return ({
        'passed':  '✅',
        'failed': '❌',
        'pending': '✴'
    } as any)[status]
}
