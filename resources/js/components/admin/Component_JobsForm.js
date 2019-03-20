import React, { Component} from "react";
import moment, { relativeTimeThreshold } from 'moment';
import {request} from '../../utils/helper';

import { Icon, Button, Checkbox, Dropdown, Message } from 'semantic-ui-react'

const childSettingsDefault = {
    hide_fields: [ 'state' ],
    allow_childJobs: false,
    allow_childJobs_from_templates: false
}

const settingsDefault = {
    hide_fields: [  ],
    allow_childJobs: true,
    allow_childJobs_from_templates: true,
    childSettings: childSettingsDefault
}

class Component_JobsForm extends Component{

    constructor(props) {
        super(props);

        let values =  {
            state: "private",
            title: '',
            description: '',
            start_date: '',
            start_time: '',
            end_date: '',
            end_time: '',

            // has_additionals: [
            //     {type: 'location', value: ''},
            //     {type: 'category', value: ''}
            // ],
            // location: [],
            // category: [],

            users_required: '',
            users_subscribed: [],
            has_jobs: [],
        };

        // merge given jobs properties to this state value
        if (typeof props.values !== 'undefined') {
            Object.keys(props.values).forEach(key => {
                if (props.values[key] !== null) {
                    values[key] = props.values[key]
                }
            });
        }

        // create react refs for child forms if given job has child jobs
        values.has_jobs = values.has_jobs.map(childJobValues => {
            return {
                ref: React.createRef(),
                values: childJobValues
            };
        })

        console.log("JobsForm values", values);

        values.start_date = values.start_date === '' ? '' : moment(values.start_date).format("YYYY-MM-DD");
        values.start_time = values.start_time === '' ? '' : moment.utc(values.start_time, "HH:mm").format("HH:mm");
        values.end_date = values.end_date === '' ? '' : moment(values.end_date).format("YYYY-MM-DD");
        values.end_time = values.end_time === '' ? '' : moment.utc(values.end_time, "HH:mm").format("HH:mm");

        this.isChildJob = props.isChildJob || false;
        this.isNewJob = typeof props.values === 'undefined' || ! "id" in props.values || props.values.id === null;

        this.settings = "settings" in props
            ? {...settingsDefault, ...props.settings}
            : settingsDefault;
        this.settings.childSettings = "settings" in props && "childSettings" in props.settings
            ? {...childSettingsDefault, ...props.settings.childSettings}
            : childSettingsDefault;

        this.state = {
            values: values,
            templates: "templates" in props ? props.templates : [],
            activity: [],
            user: {nick: ''},
        };

        this.getPreparedValues = this.getPreparedValues.bind(this);
        this.handleChangeInput = this.handleChangeInput.bind(this);
        this.handleToggleState = this.handleToggleState.bind(this);
        this.handleAddChildJob = this.handleAddChildJob.bind(this);
        this.handleRemoveChildJob = this.handleRemoveChildJob.bind(this);
        this.handleAddUser = this.handleAddUser.bind(this);
        this.handleRemoveUser = this.handleRemoveUser.bind(this);
        this.showField = this.showField.bind(this);
    }

    componentDidMount() {

        if (this.state.templates.length == 0) {
            // TODO may given templates-list is empty??!! WE dont mneed to fetch them again!
            request('templates', '', 'GET')
            .then(res => {
                const templates = res.data;
                this.setState({ templates });
            })
            .catch(error => {
                console.error(error);
            })
        }

        if (!this.isNewJob && !this.isChildJob && this.state.values.id) {
            request(`jobs/${this.state.values.id}/activities`, '', 'GET')
            .then(result => {
                this.setState({activity: result.data})
            })
            .catch(error => {
                alertError(new Error(error))
            })
        }

    }

    getPreparedValues() {
        let values = {...this.state.values}; // copy object to avoid affetcs on form values

        values.start_date = values.start_date === '' ? '' : moment(values.start_date).format("YYYY-MM-DD");
        values.start_time = values.start_time === '' ? '' : moment.utc(values.start_time, "HH:mm").format("HH:mm");
        values.end_date = values.end_date === '' ? '' : moment(values.end_date).format("YYYY-MM-DD");
        values.end_time = values.end_time === '' ? '' : moment.utc(values.end_time, "HH:mm").format("HH:mm");

        // let additionals = [];
        // values.has_additionals.forEach(entry => {
        //     const type = `has_additionals[${entry.type}]`;
        //     if (typeof values[type] !== 'undefined') {
        //         console.log('values[type]', values[type]);
        //         values[type].forEach(value => {
        //             if (value != "") {
        //                 additionals.push({
        //                     type: entry.type,
        //                     value
        //                 });
        //             }
        //         })
        //     }
        // })
        // console.log("additionals: ", additionals);

        values.has_jobs = values.has_jobs.map(entry => {
            return entry.ref.current.getPreparedValues();
        });

        // values.users_subscribed = JSON.stringify(values.users_subscribed);

        let newValues = {};

        // nullable empty values
        Object.keys(values).forEach(key => {
            if (values[key] !== "") {
                newValues[key] = values[key];
            } else {
                newValues[key] = null;
            }
        });

        console.log("new values", newValues);

        return newValues;
    }

    /**
     *
     * @param {*} e
     * @param {*} childValues
     */
    handleAddChildJob(e, childValues = {}) {
        const values = this.state.values;

        if ("has_jobs" in childValues) {
            childValues.has_jobs.forEach(childJob => {
                childJob.id = null;
                values.has_jobs.push({
                    ref: React.createRef(),
                    values: childJob
                });
            })
        } else {
            values.has_jobs.push({
                ref: React.createRef()
            });
        }

        this.setState({ values });
        e.preventDefault();
    }

    handleRemoveChildJob(e, i) {
        const values = {...this.state.values};
        const childJobs = values.has_jobs;
        // BUGFIX: we need to clear the childjobs first, remove it after a timeout
        values.has_jobs = [];
        this.setState({ values });

        setTimeout(() => {
            childJobs.splice(i, 1);
            values.has_jobs = childJobs;
            this.setState({ values });
        }, 1);

        e.preventDefault();
    }

    handleRemoveUser(e, uidx) {
        const values = this.state.values;
        values.users_subscribed.splice(uidx, 1);
        this.setState({ values });
        e.preventDefault();

    }

    handleAddUser(e) {
        let user = this.state.user;
        let values = this.state.values;
        values.users_subscribed.push(
            {nick: user.nick}
        );
        user.nick = '';
        this.setState({ values, user });

        e.preventDefault();
    }

    handleChangeInput(e) {
        const self = this;
        const values = this.state.values;
        const target = e.target;
        //const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name
        let value = target.value;
        if (target.type === 'checkbox') {
            value = target.checked;
        }
        else if (target.type === 'select-multiple') {
            value = [];
            for (var i = 0, l = target.options.length; i < l; i++) {
                if (target.options[i].selected) {
                  value.push(target.options[i].value);
                }
            }
        }

        if (name == "nick") {
            let user = this.state.user;
            user.nick = value;
            this.setState({user});
            e.preventDefault();
            return;
        }

        // if (name.indexOf("has_additionals") >= 0) {
        //     const key = name.match(new RegExp(/\[(\w+)\]/))
        //     console.log('Handle additionals: ', key, value);
        //     values['has_additionals'][key] = value;
        // }
        // else {
        //     values[name] = value;
        // }

        // console.log("Set value", name, value);

        values[name] = value;

        this.setState({values});
        e.preventDefault();
    }

    handleToggleState() {
        const values = this.state.values;
        values.state = values.state == "public" ? "private" : "public";
        this.setState({ values })
    }

    showField(field) {
        return !this.settings.hide_fields.includes(field);
    }

    render() {
        const {values, templates} = this.state;
        const errors = this.props.errors ? this.props.errors : [];

        const startDate = (
            <div className="field">
                <label>Date Start</label>
                <input type="date" name="start_date" value={values.start_date} placeholder="Date - YYYY/MM/DD" onChange={this.handleChangeInput} />
            </div>
        );

        const startTime = (
            <div className="field">
                <label>Time Start</label>
                <input type="time" name="start_time" value={values.start_time} placeholder="Time - HH:TT" onChange={this.handleChangeInput} />
            </div>
        );

        const endDate = (
            <div className="field">
                <label>Date End</label>
                <input type="date" name="end_date" value={values.end_date} placeholder="Date - YYYY/MM/DD" onChange={this.handleChangeInput} />
            </div>
        );

        const endTime = (
            <div className="field">
                <label>Time End</label>
                <input type="time" name="end_time" value={values.end_time} placeholder="Time - HH:TT" onChange={this.handleChangeInput} />
            </div>
        );

        return(
            <div className="ui grid jobs-form-component">
                {errors.length > 0 &&
                    <div className="sixteen wide column">
                        {errors.map((error, ei) => {
                            return (
                                <Message key={ei} negative
                                    header='Error'
                                    content={error.message}
                                />
                            )
                        })}
                    </div>
                }
                <div className="twelve wide column">
                    <div className="required field">
                        <label>Title</label>
                        <input required={true} type="text" name="title" placeholder="Title" value={values.title} onChange={this.handleChangeInput} />
                    </div>

                    {this.showField('description') && <div className="field">
                        <label>Description / Notes</label>
                        <textarea name="description" rows="2" value={values.description} onChange={this.handleChangeInput}></textarea>
                    </div> }

                    <div className="two fields">
                        {/* TODO add handler onUpdateDate to auto-generate the other date (eg. date end 1 hour after date start) */}
                        {(this.showField('start_date') && this.showField('start_time')) && <div className="field two fields">
                            {startDate}
                            {startTime}
                        </div>}

                        {(this.showField('start_date') && !this.showField('start_time')) && <div className="field">
                            {startDate}
                        </div>}

                        {(!this.showField('start_date') && this.showField('start_time')) && <div className="field">
                            {startTime}
                        </div>}

                        {(this.showField('end_date') && this.showField('end_time')) && <div className="field two fields">
                            {endDate}
                            {endTime}
                        </div>}

                        {(this.showField('end_date') && !this.showField('end_time')) && <div className="field">
                            {endDate}
                        </div>}

                        {(!this.showField('end_date') && this.showField('end_time')) && <div className="field">
                            {endTime}
                        </div>}

                    </div>

                    {values.has_jobs.map((childJob, cjidx) =>
                        <div className="ui grid field has_job" key={cjidx}>
                            <div className="one wide column">
                                <a onClick={e => this.handleRemoveChildJob(e, cjidx)}><i className="trash icon"></i></a>
                            </div>
                            <div className="fifteen wide column field">
                                <Component_JobsForm ref={childJob.ref}
                                    settings={this.settings.childSettings}
                                    values={childJob.values}
                                    templates={templates}
                                    isChildJob={true}
                                />
                            </div>
                        </div>
                    )}

                    {this.settings.allow_childJobs && <div className="field">
                        {!this.settings.allow_childJobs_from_templates &&
                            <button className="ui labeled icon button" onClick={this.handleAddChildJob}><i className="file icon"></i>New Subtask</button>
                        }
                        {this.settings.allow_childJobs_from_templates &&
                            <Button.Group>
                                <Button onClick={this.handleAddChildJob}><Icon name='file' />New Subtask</Button>
                                <Dropdown floating button className='icon'>
                                    <Dropdown.Menu>
                                        <Dropdown.Header content=' Templates' icon='tags' />
                                        <Dropdown.Menu scrolling>
                                            {templates.map(tml =>
                                                <Dropdown.Item key={tml.id} text={tml.title} value={tml.id} onClick={e => this.handleAddChildJob(e, tml)} />
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Button.Group>
                        }
                    </div> }

                </div>

                <div className="four wide column">
                    {this.showField('state') && <div className="field">
                        <label>State</label>
                        <Checkbox toggle checked={values.state == "public"} name="state" className="job-is-public-toggle" onChange={this.handleToggleState} />
                    </div>}

                    {/* <div className="field">
                        <label>Location</label>
                        <select multiple name="has_additionals[location]" className="ui fluid dropdown" onChange={this.handleChangeInput}>
                            <option value="">Select Location...</option>
                            <option value="3" >Leipzig</option>
                            <option value="4" >Amerika</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Category</label>
                        <select multiple name="has_additionals[category]" className="ui dropdown" onChange={this.handleChangeInput}>
                            <option value="">Select Category...</option>
                            <option value="1" >Konzert</option>
                            <option value="2" >Lesung</option>
                        </select>
                    </div> */}

                    {this.showField('users_required') && <div className="field">
                        <label>Required Users</label>
                        <input type="number" name="users_required" value={values.users_required} placeholder="Required Users, e.g. 2" onChange={this.handleChangeInput} />
                    </div>}

                    {this.showField('users_subscribed') && <div className="field">
                        <label>Subscribed Users</label>
                        {values.users_subscribed.map((user, uidx) =>
                            <div className="ui label" key={uidx}>
                                {user.nick}
                                <i className="delete icon" onClick={(e) => this.handleRemoveUser(e, uidx)}></i>
                            </div>
                        )}
                        <div className="ui mini action input">
                            <input type="text" name="nick" placeholder="Name" value={this.state.user.nick} onChange={this.handleChangeInput} />
                            <button className="ui button" disabled={this.state.user.nick == ''} onClick={this.handleAddUser}>Add</button>
                        </div>
                    </div>}

                    {this.state.activity.length > 0 &&
                        <div className="field">
                            <h3>Activities</h3>
                            <ul>
                                {this.state.activity.map(entry =>
                                    <li key={entry.id}>{entry.meta_value}</li>
                                )}
                            </ul>
                    </div>}

                </div>

            </div>
        );
  }
}

export default Component_JobsForm;