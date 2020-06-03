import React from 'react';
import _ from 'lodash';
import createReactClass from 'create-react-class';
import update from 'immutability-helper';

import { Card, CardHeader, CardActions, CardContent } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';

import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser;

// defaults of the settings stored in 'config' and controlled by popup
const DEFAULT_SETTINGS = { active: false, ux: false };

function toggleActivation(syntheticEvent, value) {
    console.log('toggleActivation, now switching to:', value);
    return value;
}

const Settings = createReactClass({

    render () {
        console.log(this.state, this);
        if(!this.props) {
            console.log("Invalid condition of !this.state before render <Settings>");
            return;
        }

        let isActive = _.get(this, 'props.active');
        let specialUX = _.get(this, 'props.ux');
        let state = {
            active: isActive,
            ux: specialUX
        };

        if( _.isUndefined(isActive) || _.isUndefined(specialUX)) {
            console.log("Lack of saved parameters, imposing defaults");
            isActive = DEFAULT_SETTINGS.active;
            specialUX = DEFAULT_SETTINGS.ux;
        }

        return (
            <Card>
                <FormControl component="fieldset" >
                    <FormLabel component="legend">form label component legend </FormLabel>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    size="medium"
                                    checked={state.active}
                                    onChange={toggleActivation}
                                />
                            }
                            label="Tracking Exposed activated (youtube)"
                        />
                    </FormGroup>
                    <FormHelperText>Be careful</FormHelperText>
                </FormControl>
                <FormHelperText>You can display an error</FormHelperText>
            </Card>
        );
    }
});

export default Settings;