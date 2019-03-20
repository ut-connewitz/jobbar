import React, { Component} from "react";
import {request} from '../../utils/helper';
import moment from 'moment';
import { Icon, Button, Dropdown, Modal, Form, Dimmer, Loader, Segment, Transition } from 'semantic-ui-react'

import { getJobsAtDate, getJobsInDates, getDays, MonthListDay } from '../etc/Calendar_Helper';

import JobsListEntry from './Component_JobsBrowserEntry';
import JobsForm from './Component_JobsForm';

import { alertError } from '../etc/Error_Tools';

const jobsFormSettings = {
    hide_fields: [ 'users_required', 'users_subscribed' ],
    allow_childJobs: true,
    allow_childJobs_from_templates: true,
    childSettings: {
        hide_fields: [ 'state', 'description', 'start_date', 'end_date' ],
        allow_childJobs: false,
    }
}

class Page_JobsBrowser extends Component{

    constructor(props) {
        super(props);

        this.formRef = React.createRef();

        this.state = {
            startDate: moment(),

            jobs: [],
            templates: [],
            nextOpenJobs: [],
            loadingJobs: true,

            newFormOpen: false,
            editFormOpen: false,
            editFormValues: {},
            formLoading: false
        };

        this.getNextOpenJobs = this.getNextOpenJobs.bind(this);

        this.handleNextMonth = this.handleNextMonth.bind(this);
        this.handlePrevMonth = this.handlePrevMonth.bind(this);

        this.handleOpenNewForm = this.handleOpenNewForm.bind(this);
        this.handleCloseNewForm = this.handleCloseNewForm.bind(this);
        this.handleSaveNewForm = this.handleSaveNewForm.bind(this);

        this.handleOpenEditForm = this.handleOpenEditForm.bind(this);
        this.handleCloseEditForm = this.handleCloseEditForm.bind(this);
        this.handleSaveEditForm = this.handleSaveEditForm.bind(this);

        this.handlerAfterUpdate = this.handlerAfterUpdate.bind(this);
        this.handleDeleteJob = this.handleDeleteJob.bind(this);
    }

    componentDidMount() {
        // TODO may get only jobs in future for some months, dynamically load later/earlier jobs
        // get jobs
        request('jobs', '', 'GET')
        .then(res => {
            const jobs = res.data;
            this.setState({ jobs, loadingJobs: false });
        })
        .catch(error => {
            alertError(error);
        })

        // get templates
        request('templates', '', 'GET')
        .then(res => {
            const templates = res.data;
            this.setState({ templates });
        })
        .catch(error => {
            alertError(error);
        })

        // may update caldavjobs
        // setTimeout(() => {
        //     const showUpdateMsg = setTimeout(() => {
        //         console.log("sync from caldav...");
        //     }, 1000);
        //     request('jobs/caldavsync', '', 'GET')
        //     .then(res => {
        //         console.log(res);
        //         clearTimeout(showUpdateMsg);
        //         request('jobs', '', 'GET')
        //         .then(res => {
        //             const jobs = res.data;
        //             this.setState({ jobs, loadingJobs: false });
        //         })
        //         .catch(error => {
        //             console.log(error);
        //         })
        //     })
        //     .catch(error => {
        //         console.log("An error occured on update jobs from caldav", error);
        //     })
        // }, 1000)
    }

    getNextOpenJobs(jobs) {
        const from = moment();
        const to = from.clone().add(1, "weeks");
        const nextJobs = getJobsInDates(jobs, from, to);
        const nextOpenJobs = nextJobs.filter(job => {
            if (job.users_required != null && job.users_required > job.users_subscribed.length) {
                return true;
            }
            const openChilds = job.has_jobs.filter(childJob => {
                if (childJob.users_required != null && childJob.users_required > childJob.users_subscribed.length) {
                    return true;
                }
                return false;
            })
            return openChilds.length > 0;
        })
        return nextOpenJobs;
    }

    handleNextMonth(e) {
        const current = this.state.startDate;
        const next = current.clone().add(1, "months").startOf('month');
        this.setState({
            startDate: next
        });
        e.preventDefault();
    }

    handlePrevMonth(e) {
        const current = this.state.startDate;
        const prev = current.clone().subtract(1, "months").startOf('month');
        this.setState({
            startDate: prev
        });
        e.preventDefault();
    }

    handleOpenNewForm(e, template = {}, date = null) {
        let values = {...template, ...{id: null, type: null}};
        if (date !== null) {
            values.start_date = moment(date).format("YYYY-MM-DD");
            values.start_time = moment(date).format("HH:mm");
        }
        this.setState({
            newFormOpen: true,
            editFormValues: values
        });
        e.preventDefault()
    }

    handleSaveNewForm(e) {
        const self = this;
        const values = this.formRef.current.getPreparedValues();
        const jobs = [...self.state.jobs];
        self.setState({formLoading: true})

        request('jobs', '', 'POST', values)
        .then(result => {
            jobs.push(result.data);
            self.setState({ jobs });
            self.handleCloseNewForm();
        })
        .catch(error => {
            alertError(error);
        })

        e.preventDefault()
    }

    handleCloseNewForm(e) {
        this.setState({
            newFormOpen: false,
            formLoading: false
        })
        if (typeof e !== "undefined") {
            e.preventDefault()
        }
    }

    handleOpenEditForm(e, job = {}) {
        // console.log('handleOpenEditForm', e, job);
        this.setState({
            editFormOpen: true,
            editFormValues: job
        })
        e.preventDefault()
    }

    handleSaveEditForm(e) {
        const self = this;
        const values = this.formRef.current.getPreparedValues();
        const jobId = values.id;
        let jobs = [...this.state.jobs];
        self.setState({formLoading: true})

        request('jobs/'+jobId, '', 'PUT', values)
        .then(result => {

            // BUGFIX remove job from state and add updated
            // otherwise the job-entry component will not update! But why...?
            const i = jobs.findIndex(j => j.id === jobId);
            jobs.splice(i, 1);
            self.setState({ jobs });

            setTimeout(() => {
                jobs.splice(i, 0, result.data);
                self.setState({ jobs });
                self.handleCloseEditForm();
            }, 1);
        })
        .catch(error => {
            alertError(error);
        })

        e.preventDefault()
    }

    handleCloseEditForm(e) {
        this.setState({
            editFormOpen: false,
            formLoading: false
        })

        if (typeof e !== "undefined") {
            e.preventDefault()
        }
    }

    handleDeleteJob(e, jobId) {
        let jobs = [...this.state.jobs];

        request('jobs/'+jobId, '', 'DELETE')
        .then(() => {
            const i = jobs.findIndex(j => j.id === jobId);
            jobs.splice(i, 1);
            this.setState({ jobs });
        })
        .catch(error => {
            alertError(error);
        })

        e.preventDefault();
    }

    handlerAfterUpdate(updatedJob) {
        let jobs = [...this.state.jobs];

        jobs = jobs.map(job => {
            return job.id == updatedJob.id ? updatedJob : job;
        })

        // update current state
        this.setState({jobs});
    }

    render(){
        const {jobs, templates, startDate, loadingJobs, formLoading} = this.state;
        const days = getDays(startDate);
        const nextOpenJobs = this.getNextOpenJobs(jobs);

        const modalFormNew = (
            <Modal
                open={this.state.newFormOpen}
                onClose={this.handleCloseNewForm}
                closeOnDimmerClick={false}
                closeOnEscape={false}
                centered={false}
            >
                <Modal.Header>
                    <Button className="right floated" onClick={this.handleCloseNewForm}>Cancel</Button>
                    <Button className="primary right floated" onClick={this.handleSaveNewForm} disabled={formLoading}>Save</Button>
                    New Job
                </Modal.Header>
                <Modal.Content>
                    <Form className="jobs-form" onSubmit={this.handleSaveNewForm} loading={formLoading}>
                        <JobsForm ref={this.formRef}
                            settings={jobsFormSettings}
                            templates={templates}
                            values={this.state.editFormValues}
                        />
                    </Form>
                </Modal.Content>
            </Modal>
        );

        const modalFormEdit = (
            <Modal
                open={this.state.editFormOpen}
                onClose={this.handleCloseEditForm}
                closeOnDimmerClick={false}
                closeOnEscape={false}
                centered={false}
            >
                <Modal.Header>
                    <Button className="right floated" onClick={this.handleCloseEditForm}>Cancel</Button>
                    <Button className="primary right floated" onClick={this.handleSaveEditForm} disabled={formLoading}>Save</Button>
                    Edit Job
                </Modal.Header>
                <Modal.Content>
                    <Form className="jobs-form" onSubmit={this.handleSaveEditForm} loading={formLoading}>
                        <JobsForm ref={this.formRef}
                            settings={jobsFormSettings}
                            templates={templates}
                            values={this.state.editFormValues}
                        />
                    </Form>
                </Modal.Content>
            </Modal>
        );

        return(
            <div className="jobs-list-wrapper">

                {modalFormNew}
                {modalFormEdit}

                {/* TODO: how to show jobs without date ??? -> als sub-menu (filter "jobs without date") */}

                <Transition visible={nextOpenJobs.length > 0} animation='slide down' duration={500}>
                    <div className="ui warning message">
                        <h3>You have open jobs next week in:</h3>
                        {nextOpenJobs.map(openJob =>
                            <div key={openJob.id}>{openJob.title}</div>
                        )}
                    </div>
                </Transition>

                <div className="jobs-list-action-panel">
                    {/* <Link className="ui button" to={`/admin/jobs/new`}>New</Link>
                    <Link className="ui button" to={`/admin/jobs/new`}>New (from Template)</Link> */}
                    <Button.Group>
                        <Button onClick={this.handleOpenNewForm}><Icon name='file' />New Job</Button>
                        <Dropdown floating button className='icon'>
                            <Dropdown.Menu>
                                <Dropdown.Header content=' Templates' icon='tags' />
                                <Dropdown.Menu scrolling>
                                    {templates.map(tml =>
                                        <Dropdown.Item key={tml.id} text={tml.title} value={tml.id} onClick={e => this.handleOpenNewForm(e, tml, null)} />
                                    )}
                                </Dropdown.Menu>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Button.Group>
                </div>

                <div className="jobs-list-navigation">
                    <button className="left attached ui basic icon button" onClick={this.handlePrevMonth}><i className="angle left icon"></i></button>
                    {<div>{startDate.format("MMMM")}</div>}
                    <button className="right attached ui basic icon button" onClick={this.handleNextMonth}><i className="angle right icon"></i></button>
                </div>

                <Dimmer.Dimmable as={Segment} dimmed={loadingJobs} className="grid">
                    {days.map((day, i) => {
                        const jobsAt = getJobsAtDate(jobs, day);
                        const newEventDate = moment(day).hours(moment().hours()).add(1, "hours").minutes(0);

                        return (
                            <MonthListDay key={i} date={day}>
                                <div className="two wide column">
                                    <Button.Group compact={true}>
                                        <Button onClick={e => this.handleOpenNewForm(e, null, newEventDate)} compact={true}><Icon name='plus' /></Button>
                                        <Dropdown floating button className='icon' compact={true}>
                                            <Dropdown.Menu>
                                                <Dropdown.Header content=' Templates' icon='tags' />
                                                <Dropdown.Menu scrolling>
                                                    {templates.map(tml =>
                                                        <Dropdown.Item key={tml.id} text={tml.title} value={tml.id} onClick={e => this.handleOpenNewForm(e, tml, newEventDate)} />
                                                    )}
                                                </Dropdown.Menu>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </Button.Group>
                                </div>
                                <div className="thirteen wide column content-wrapper">
                                    <div className="ui items">
                                        {jobsAt.map(job => {
                                            return (
                                                <JobsListEntry
                                                    key={job.id}
                                                    settings={{allow_childJobs: true}}
                                                    job={job}
                                                    templates={templates}
                                                    parentHandlerEditJob={this.handleOpenEditForm}
                                                    parentHandlerAfterUpdate = {this.handlerAfterUpdate}
                                                    handleDeleteJob={this.handleDeleteJob}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            </MonthListDay>
                        );
                    })}
                    <Dimmer active={loadingJobs} inverted verticalAlign='top'>
                        <Loader>Loading</Loader>
                    </Dimmer>
                </Dimmer.Dimmable>

            </div>
        );
  }
}

export default Page_JobsBrowser;