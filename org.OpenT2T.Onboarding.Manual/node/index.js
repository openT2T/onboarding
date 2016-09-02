'use strict';

var inquirer = require('inquirer');

// module exports, implementing the schema
module.exports = {

    onboard: function(name, instructionsUrl, successCallback) {
        console.log('Onboarding device  : ' + name);
        console.log('instructions Url   : ' + instructionsUrl);

        // build questions for credentials
        console.log('\nPlease onboard the device per instructions at %s:\n', instructionsUrl);

        var questions = [
            {
                type: 'input',
                name: 'token',
                message: 'Token Value: ',
                validate: function(value) {
                    var token = !!value;
                    if (token) {
                        return true;
                    } else {
                        return 'Please enter a valid Token.';
                    }
                }
            }
        ];

        // show questions for credentials
        inquirer.prompt(questions, function(answers) {
            console.log('\nThanks! Onboarding complete.');

            // all done. Now we have all the parameters we needed.
            if (successCallback) {
                successCallback(answers.token, 'All done. Happy coding!');
                return;
            }
        });
    }
};