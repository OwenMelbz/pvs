#!/usr/bin/env node

'use strict';

const inquire = require('inquirer').createPromptModule();
const _ = require('underscore');
const fs = require('fs');
const readline = require('readline');
const S = require('cli-spinner').Spinner;
require('shelljs/global');

const choices = [
    {name: 'PHP 5.3', value: 'php53'},
    {name: 'PHP 5.4', value: 'php54'},
    {name: 'PHP 5.6', value: 'php56'},
    {name: 'PHP 7', value: 'php70'},
    {name: 'PHP 7.1', value: 'php71'},
    {name: 'PHP 7.2', value: 'php72'},
];

const httpConfigPath = '/usr/local/etc/httpd/httpd.conf';

let myChoice = _.first(choices);
let hasChoiceInstalled = false;
let spinner = new S('%s ');
    spinner.setSpinnerString(19);

const parseAnswers = (answers) => {

    spinner.start();

    myChoice = _.findWhere(choices, {
        value: answers.version
    });

    if (myChoice) {
        deactiveActiveVersion();
    } else {
        return console.error('No valid version found');
    }
};

const deactiveActiveVersion = () => {

    spinner.setSpinnerTitle('Stopping existing PHP instances, and removing symlinks');

    exec('brew services list | grep php', {silent: true, async: false}, function(exitCode, stdout, stderr){

        let potentials = stdout.split('\n');

        _.each(potentials, function (v) {

            let version = v.split(' ');

            if (version[0].indexOf('php') > -1) {
                version = version[0];

                if (version == myChoice.value) {
                    hasChoiceInstalled = true;
                }

                if (v.indexOf('started') > -1) {
                    spinner.setSpinnerTitle('Stopping ' + version);
                    exec('brew services stop ' + version, {silent: true});
                }

                spinner.setSpinnerTitle('Unlinking ' + version);
                exec('brew unlink ' + version, {silent: true});
            }
        });

        return activateChosenVersion();
    });
};

const activateChosenVersion = () => {

    spinner.setSpinnerTitle('Migrating apache configs to ' + myChoice.name);

    let activate = function () {
        changeHttpdConfig();
    };

    let changeHttpdConfig = function () {
        const rl = readline.createInterface({
            input: fs.createReadStream(httpConfigPath),
            crlfDelay: Infinity
        });

        let newConfig = [];

        rl.on('line', line => {
            if (line.indexOf('LoadModule php') === -1) {
                return newConfig.push(line);
             }

            let newLine = line;

            newLine = line.replace('#LoadModule', 'LoadModule');
            newLine = newLine.replace('LoadModule', '#LoadModule');

            if (newLine.indexOf(myChoice.value) !== -1) {
                newLine = line.replace('#LoadModule', 'LoadModule');
            }

            return newConfig.push(newLine);
        }).on('close', () => {
            const config = newConfig.join('\n');

            spinner.setSpinnerTitle('Saving new httpd config');

            fs.writeFile(httpConfigPath, config, err => {
                spinner.setSpinnerTitle('Restarting apache');
                exec('brew services restart httpd', {silent: true});

                return changeBrewLinks();
            });
        });
    };

    let changeBrewLinks = function () {

        exec(`brew link ${myChoice.value} && brew services start ${myChoice.value}`, {silent: true}, function(){
            spinner.setSpinnerTitle(myChoice.name + ' Activated!');

            setTimeout(function(){
                spinner.stop();
                console.log('\n');
            }, 500);
        });
    };

    if (hasChoiceInstalled) {
        return activate();
    } else {
        spinner.setSpinnerTitle(myChoice.name + ' is not installed - installing now (this could take a while)');
        exec(`brew install ${myChoice.value} --with-httpd ${myChoice.value}-mcrypt ${myChoice.value}-xdebug ${myChoice.value}-intl && brew install -s ${myChoice.value}-imagick`, {silent: true}, function(){
            spinner.setSpinnerTitle(myChoice.name + ' now installed');
            activate();
        });
    }
};

inquire([{
    type: 'list',
    name: 'version',
    message: 'What version of PHP do you desireee?',
    choices: choices
}])
.then(parseAnswers);
