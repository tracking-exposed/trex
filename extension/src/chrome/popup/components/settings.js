import React from 'react';
import _ from 'lodash';
import update from 'immutability-helper';

import {Card, CardActions, CardHeader, CardTitle, CardText} from 'material-ui/Card';
import Checkbox from 'material-ui/Checkbox';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

import db from '../../db';

export default class Settings extends React.Component {

    constructor (props) {
        super(props);

        db
            .get('whatever', {tagId: '', isStudyGroup: false, lessInfo: false})
            .then(settings => this.setState({
                oldSettings: _.cloneDeep(settings),
                settings: settings
            }));
    }

    saveSettings () {
        const settings = _.cloneDeepWith(this.state.settings, value => _.isString(value) ? _.trim(value) : value);

        db
            .set('whatever', settings)
            .then(() => this.setState(update(this.state, {oldSettings: {$set: _.cloneDeep(settings)},
                                                          settings: {$set: settings},
                                                          reloadBrowser: {$set: true}})));

        bo.tabs.reload();
    }

    resetSettings () {
        this.setState(update(this.state, {settings: {$set: _.cloneDeep(this.state.oldSettings)}}));
    }

    render () {
        if (!this.state) {
            return null;
        }

        console.log('settings', this.state.settings);
        const state = this.state;

        const dirty = !_.isEqual(state.settings, state.oldSettings);

        return (
            <Card>
                <CardHeader title='Consider the option below only if you belong to a research group' />

                <CardText>
                    <div>
                        <Checkbox
                            label='TAG your contributions'
                            labelPosition="left"
                            checked={state.settings.isStudyGroup}
                            onCheck={(_, val) => this.setState(update(state, {settings: {isStudyGroup: {$set: val}}}))} />

                        {state.settings.isStudyGroup &&
                        <TextField
                            hintText='settingsTagId'
                            value={state.settings.tagId}
                            onChange={(_, val) => this.setState(update(state, {settings: {tagId: {$set: val }}}))}
                        />
                        }
                    </div>

                    {dirty &&
                        <CardActions>
                            <RaisedButton
                                label='Save!'
                                primary={true}
                                onClick={this.saveSettings.bind(this)}
                            />
                        </CardActions>
                    }

                </CardText>
            </Card>
        );
    }
};
