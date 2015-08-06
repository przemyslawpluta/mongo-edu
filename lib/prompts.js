/*
 * mongo-edu
 *
 * Copyright (c) 2014-2015 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

module.exports = (function build() {

    'use strict';

    return {
        savePreset: [{ type: 'input', name: 'save', message: 'Missing [ --save ] Preset Name', default: '', validate: function(value) {
            if (value !== '') { return true; }
            return 'Please enter [ --save ] preset name';
        }}],

        loadPreset: function loadPreset(data) {
            return [{ type: 'list', name: 'preset', message: 'Select Preset To Load:', choices: data}];
        },

        list: [{ type: 'list', name: 'url', message: '', choices: [] }],

        confirm: [{ type: 'confirm', name: 'confirm', message: '' }],

        check: [{ type: 'checkbox', message: '', name: 'videos', choices: [],
            validate: function validate(answer) {
                if ( answer.length < 1 ) { return 'You must choose at least one option.'; }
                return true;
            }
        }],

        profile: [
            { type: 'input', name: 'user', message: 'MongoDB Uni User Name', default: '', validate: function(value) {
                if (value !== '') { return true; }
                return 'Please enter your MongoDB Uni user name - email address';
            }},
            { type: 'password', message: 'MongoDB Uni Password', name: 'password', validate: function(value) {
                if (value !== '') { return true; }
                return 'Please enter your MongoDB Uni password';
            }}
        ]
    };

}());
