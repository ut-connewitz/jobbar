import React, { Component} from "react";
import moment, { relativeTimeThreshold } from 'moment';
import {request} from '../../utils/helper';

import { Checkbox, Dropdown, Message } from 'semantic-ui-react'

const settingsDefault = {
    // show_fields: [ 'title', '...' ],
    hide_fields: [ 'users_required', 'users_subscribed' ],

    allow_childJobs: false,

}

const childSettingsDefault = {
    hide_fields: [ 'state', 'date_start', 'date_end', 'description' ],
    allow_childJobs: false,
}

class Component_TemplatesForm extends Component{

    constructor(props) {
        super(props);

        let values =  {
            state: "private",
            title: '',
            description: '',
            // start datetime and this form date/time properties
            start_at: '',
            date_start: '',
            time_start: '',
            // end datetime and this form date/time properties
            end_at: '',
            date_end: '',
            time_end: '',

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
                inValues: childJobValues
            };
        })

        if (values.start_at !== '') {
            values.time_start = moment(values.start_at).format("HH:mm");
            values.date_start = moment(values.start_at).format("YYYY-MM-DD");
        }
        if (values.end_at !== '') {
            values.time_end = moment(values.end_at).format("HH:mm");
            values.date_end = moment(values.end_at).format("YYYY-MM-DD");
        }

        console.log("JobsForm values", values);

        this.isChildJob = props.isChildJob || false;
        this.isNewJob = typeof props.values === 'undefined' || ! "id" in props.values || props.values.id === null;
        this.settings = {...settingsDefault, ...props.settings};

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

        if (!this.isNewJob && !this.isChildJob) {
            // request('jobs', 'activity', 'GET', {id: this.state.values.id})
            // .then(result => {
            //     this.setState({activity: result.data})
            // })
            // .catch(error => {
            //     alertError(new Error(error))
            // })
            console.log("TODO: get activities...");
        }

    }

    getPreparedValues() {
        let values = {...this.state.values}; // copy object to avoid affetcs on form values

        if (values.date_start != '') {
            // TODO try/catch date creation... eg with moment().isValid()
            // values.date_start = new Date(
            //     values.time_start != ''
            //         ? values.date_start + ' ' + values.time_start
            //         : values.date_start
            // )
            // .toISOString().slice(0, 19).replace('T', ' '); // convert to mysql datetime format
            values.start_at = moment(values.date_start + ' ' + values.time_start).format("YYYY-MM-DD HH:mm:ss")
            delete values.date_start;
            delete values.time_start;
        }

        if (values.date_end != '') {
            // TODO try/catch date creation... eg with moment().isValid()
            // values.date_end = new Date(
            //     values.time_end != ''
            //         ? values.date_end + ' ' + values.time_end
            //         : values.date_end
            // )
            // .toISOString().slice(0, 19).replace('T', ' '); // convert to mysql datetime format
            values.end_at = moment(values.date_end + ' ' + values.time_end).format("YYYY-MM-DD HH:mm:ss")
            delete values.date_end;
            delete values.time_end;
        }

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

        if ("has_jobs" in childValues && childValues.has_jobs.length > 0) {
            alert("This job contains other sub-job. Sub-sub-jobs are currently not implemented");
            childValues.has_jobs = [];
        }
        // BUGFIX remove templates child id
        // TODO the backend should create a new child job if given child id comes from a template!
        // if ("id" in childValues) {
        //     childValues.id = null;
        // }

        const values = this.state.values;
        values.has_jobs.push({
            ref: React.createRef(),
            inValues: childValues
        });
        this.setState({ values });
        e.preventDefault();
    }

    handleRemoveChildJob(e, removeJob) {
        const values = {...this.state.values};
        values.has_jobs = values.has_jobs.filter(childJob =>
            childJob.inValues.id !== removeJob.inValues.id
        );
        this.setState({ values });
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

    render() {
        const values = this.state.values;
        const templates = this.state.templates;
        const errors = this.props.errors;

        // TODO use somehow generic settings function
        const showDateStart = this.settings.hide_fields.findIndex(v => v == "date_start") < 0;
        const showDateEnd = this.settings.hide_fields.findIndex(v => v == "date_end") < 0;
        const showState = this.settings.hide_fields.findIndex(v => v == "state") < 0;
        const showDescription = this.settings.hide_fields.findIndex(v => v == "description") < 0;
        const showUsersSubscribed = this.settings.hide_fields.findIndex(v => v == "users_subscribed") < 0;
        const showUsersRequired = this.settings.hide_fields.findIndex(v => v == "users_required") < 0;

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
                <div className="ten wide column">
                    <div className="required field">
                        <label>Title</label>
                        <input required={true} type="text" name="title" placeholder="Title" value={values.title} onChange={this.handleChangeInput} />
                    </div>

                    {showDescription && <div className="field">
                        <label>Description / Notes</label>
                        <textarea name="description" rows="1" value={values.description} onChange={this.handleChangeInput}></textarea>
                    </div> }

                    <div className="two fields">
                        {/* TODO add handler onUpdateDate to auto-generate the other date (eg. date end 1 hour after date start) */}
                        {showDateStart && <div className="field two fields">
                            <div className="field">
                                <label>Date Start</label>
                                <input type="date" name="date_start" value={values.date_start} placeholder="Date - YYYY/MM/DD" onChange={this.handleChangeInput} />
                            </div>
                            <div className="field">
                                <label>Time</label>
                                <input type="time" name="time_start" value={values.time_start} placeholder="Time - HH:TT" onChange={this.handleChangeInput} />
                            </div>
                        </div> }
                        {showDateEnd && <div className="field two fields">
                            <div className="field">
                                <label>Date End</label>
                                <input type="date" name="date_end" value={values.date_end} placeholder="Date - YYYY/MM/DD" onChange={this.handleChangeInput} />
                            </div>
                            <div className="field">
                                <label>Time</label>
                                <input type="time" name="time_end" value={values.time_end} placeholder="Time - HH:TT" onChange={this.handleChangeInput} />
                            </div>
                        </div> }
                    </div>

                    {values.has_jobs.map((childJob, cjidx) =>
                        <div className="ui grid field has_job" key={cjidx}>
                            <div className="one wide column">
                                <a onClick={e => this.handleRemoveChildJob(e, childJob)}><i className="trash icon"></i></a>
                            </div>
                            <div className="fifteen wide column field">
                                <Component_JobsForm ref={childJob.ref}
                                    settings={childSettingsDefault}
                                    values={childJob.inValues}
                                    templates={templates}
                                    isChildJob={true}
                                />
                            </div>
                        </div>
                    )}

                    {this.settings.allow_childJobs && <div className="field">
                        {/* WORKAROUND while templates are not strict for parents/childs only, do not use templates here */}
                        <button className="ui labeled icon button" onClick={this.handleAddChildJob}><i className="file icon"></i>New Subtask TODO template dropdown...</button>
                        {/* <Dropdown text='New Subtask' icon='file' floating labeled button pointing={"top"} className='icon'>
                            <Dropdown.Menu>
                                <Dropdown.Item text="New" value={0} onClick={this.handleAddChildJob} />
                                <Dropdown.Divider />
                                <Dropdown.Header content='Based on template:' icon='tags' />
                                <Dropdown.Menu scrolling>
                                    {templates.map(tml =>
                                        <Dropdown.Item key={tml.id} text={tml.title} value={tml.id} onClick={(e) => this.handleAddChildJob(e, tml)} />
                                    )}
                                </Dropdown.Menu>
                            </Dropdown.Menu>
                        </Dropdown> */}
                    </div> }

                </div>

                <div className="six wide column">
                    {showState && <div className="field">
                        <label>State</label>
                        <Checkbox toggle checked={values.state == "public"} name="state" className="job-is-public-toggle" onChange={this.handleToggleState} />
                        {/* <select className="ui dropdown" value={values.state} name="state" onChange={this.handleChangeInput}>
                            <option value="">State</option>
                            <option value="private" >Private</option>
                            <option value="public">Public</option>
                        </select> */}
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

                    {showUsersRequired && <div className="field">
                        <label>Required Users</label>
                        <input type="number" name="users_required" value={values.users_required} placeholder="Required Users, e.g. 2" onChange={this.handleChangeInput} />
                    </div>}

                    {showUsersSubscribed && <div className="field">
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
                                    <li key={entry.id}>{entry.message}</li>
                                )}
                            </ul>
                    </div>}

                </div>

            </div>
        );
  }
}

export default Component_TemplatesForm;