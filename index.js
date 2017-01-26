const inquire = require('inquirer').createPromptModule();
const _ = require('underscore');
require('shelljs/global');

const choices = [
    {name: 'PHP 5.4', value: 'php54'},
    {name: 'PHP 5.6', value: 'php56'},
    {name: 'PHP 7', value: 'php70'},
    {name: 'PHP 7.1', value: 'php71'}
];

let myChoice = _.first(choices);

const parseAnswers = (answers) => {

    myChoice = _.findWhere(choices, {
        value: answers.version
    });

    if (myChoice) {
        deactiveActiveVersion(activateChosenVersion);
    } else {
        return console.error('No valid version found');
    }
};

const deactiveActiveVersion = (next) => {

    console.log('\nStopping existing PHP instances, and unlinking symlinks.\n');

    exec('brew services list | grep php', {silent: true, async: false}, function(exitCode, stdout, stderr){

        let potentials = stdout.split('\n');

        _.each(potentials, function (v) {

            let version = v.split(' ');

            if (version[0].indexOf('php') > -1) {
                version = version[0];

                if (v.indexOf('started') > -1) {
                    exec('brew services stop ' + version);
                }

                exec('brew unlink ' + version);
            }
        });

        return next();
    });
};

const activateChosenVersion = () => {
    console.log('\n// To do --- activate ' + myChoice.name);
};

inquire([{
    type: 'list',
    name: 'version',
    message: 'What version of PHP do you desireee?',
    choices: choices
}])
.then(parseAnswers);
