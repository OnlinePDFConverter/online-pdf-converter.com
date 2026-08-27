import gulp from 'gulp';
import zip from 'gulp-zip';
import $C from './webpack.constants.js';
import { exec } from 'child_process';
import chalk from 'chalk';


const BUILD_DIR = 'build/';
const APP_DIR = BUILD_DIR + 'app/';
const ZIP_DIR = BUILD_DIR + 'zip/';
const DEST_DIR = 'output/';
const formattedDate = new Date().toLocaleString().replace(' ', '_').replace(/:/g, '_').replace(/\//g, '_');
const ZIP_NAME = 'dist_' + formattedDate + '.zip';
$C.NODE_ENV = process.argv[4] ?? 'production';
process.env.NODE_ENV = $C.NODE_ENV;

function hasArg(name) {
    return process.argv.some(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
}

function getBuildCommand() {
    const args = [
        '--i18n=de,es,fr,it,ja,ko,pt,ar'
    ];

    if (process.env.npm_config_no_assets !== undefined || hasArg('no_assets')) {
        args.push('--no_assets=1');
    }

    return `npm run build ${args.join(' ')}`;
}

async function npmBuild(cb) {
    try {
        await execCommand(getBuildCommand());
        console.log(chalk.green('All Compiled Successfully!'));
    } catch (err) {
        console.error('Error executing commands:', err);
    }
    cb();
}
  
function execCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(chalk.yellow(command));
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                // console.log(`stdout: ${stdout}`);
                // console.error(`stderr: ${stderr}`);
                console.log(chalk.green('Compiled Successfully!'));
                resolve();
            }
        });
    });
}

function makeZip() {
    console.log(chalk.green('Zip file: ' + ZIP_NAME));
    return gulp.src(APP_DIR + '**/**', { encoding: false })
        .pipe(zip(ZIP_NAME))
        .pipe(gulp.dest(ZIP_DIR));
}


gulp.task('build', gulp.series(npmBuild, makeZip));
