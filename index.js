const inquire = require('inquirer').createPromptModule();
const _ = require('underscore');

const choices = [
    {name: 'PHP 5.4', value: 'php54'},
    {name: 'PHP 5.6', value: 'php56'},
    {name: 'PHP 7', value: 'php70'},
    {name: 'PHP 7.1', value: 'php71'}
];

const parseAnswers = (answers) => {

    let choice = _.findWhere(choices, {
        value: answers.version
    });

    if (choice) {
        deactiveActiveVersion();
        activateChosenVersion(choice);
    } else {
        return console.error('No valid version found');
    }
};

const deactiveActiveVersion = () => {
    console.log('// To do --- find active version');
};

const activateChosenVersion = (version) => {
    console.log('// To do --- activate ' + version.name);
};

inquire([{
    type: 'list',
    name: 'version',
    message: 'What version of PHP do you desireee?',
    choices: choices
}])
.then(parseAnswers);
