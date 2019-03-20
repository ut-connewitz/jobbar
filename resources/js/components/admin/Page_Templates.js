import React, { Component} from "react";
import {request} from '../../utils/helper';
import { Route, Link } from "react-router-dom";
import { Modal, Form, Button } from 'semantic-ui-react'


import Component_TemplatesEntry from './Component_TemplatesEntry';
// import TemplatesForm from './TemplatesForm';
import TemplatesForm from './Component_JobsForm';

import { alertError } from '../etc/Error_Tools';

const templatesFormSettings = {
    hide_fields: [ 'state', 'start_date', 'start_time', 'end_date', 'end_time' ],
    allow_childJobs: true,
    allow_childJobs_from_templates: false,
    childSettings: {
        hide_fields: [ 'state', 'start_date', 'end_date', 'description' ],
        allow_childJobs: false,
    }
}

class Page_Templates extends Component{

    constructor(props) {
        super(props);

        this.formRef = React.createRef();

        this.state = {
            templates: [],
            newFormOpen: false,
            editFormOpen: false,

            formErrors: [],

            editTemplateValues: {},
            formLoading: false
        };

        this.handleOpenNewForm = this.handleOpenNewForm.bind(this);
        this.handleCloseNewForm = this.handleCloseNewForm.bind(this);
        this.handleSaveNewForm = this.handleSaveNewForm.bind(this);

        this.handleOpenEditForm = this.handleOpenEditForm.bind(this);
        this.handleCloseEditForm = this.handleCloseEditForm.bind(this);
        this.handleSaveEditForm = this.handleSaveEditForm.bind(this);

        this.handleDeleteTemplate = this.handleDeleteTemplate.bind(this);
    }

    componentDidMount() {
        request('templates', '', 'GET', {order: 'desc'})
        .then(res => {
            const templates = res.data;
            this.setState({ templates });
        })
        .catch(error => {
            alertError(error);
        })
    }

    handleOpenNewForm(e) {
        this.setState({
            newFormOpen: true,
            editTemplateValues: {}
        })
        e.preventDefault()
    }

    handleCloseNewForm() {
        this.setState({
            newFormOpen: false,
            formLoading: false
        })
    }

    handleSaveNewForm(e) {
        const self = this;
        const values = this.formRef.current.getPreparedValues();
        let templates = [...this.state.templates];
        const formErrors = [...this.state.formErrors];
        self.setState({formLoading: true})

        // TODO disable form / loading state !

        request('templates', '', 'POST', values)
        .then(result => {
            templates.push(result.data);
            self.setState({ templates });
            self.handleCloseNewForm();
        })
        .catch(error => {
            formErrors.push(error);
            self.setState({ formErrors });
        })

        e.preventDefault();
    }

    handleOpenEditForm(e, values) {
        this.setState({
            editFormOpen: true,
            editTemplateValues: values
        })
        e.preventDefault()
    }

    handleCloseEditForm() {
        this.setState({
            editFormOpen: false,
            formLoading: false
        })
    }

    handleSaveEditForm(e) {
        const self = this;
        const values = this.formRef.current.getPreparedValues();
        const tmlId = values.id;
        const templates = [...this.state.templates];
        const formErrors = [...this.state.formErrors];
        self.setState({formLoading: true})

        request('templates/'+tmlId, '', 'PUT', values)
        .then(result => {

            // BUGFIX remove job from state and add updated
            // otherwise the job-entry component will not update! But why...?
            const i = templates.findIndex(j => j.id === tmlId);
            templates.splice(i, 1);
            self.setState({ templates });

            setTimeout(() => {
                templates.splice(i, 0, result.data);
                self.setState({ templates });
                self.handleCloseEditForm();
            }, 1);

        })
        .catch(error => {
            formErrors.push(error);
            self.setState({ formErrors });
        })

        e.preventDefault();
    }

    handleDeleteTemplate(e, tmlId) {
        const templates = [...this.state.templates];

        request('templates/'+tmlId, '', 'DELETE')
        .then(() => {
            const i = templates.findIndex(j => j.id === tmlId);
            templates.splice(i, 1);
            this.setState({ templates });
        })
        .catch(error => {
            alertError(error);
        })

        e.preventDefault();
    }

    render(){
        const {templates, formLoading} = this.state;

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
                    New Template
                </Modal.Header>
                <Modal.Content>
                    <Form className="jobs-form" onSubmit={this.handleSaveNewForm} loading={formLoading}>
                        <TemplatesForm ref={this.formRef}
                            settings={templatesFormSettings}
                            values={this.state.editTemplateValues}
                            errors={this.state.formErrors}
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
                    Edit Template
                </Modal.Header>
                <Modal.Content>
                    <Form className="jobs-form" onSubmit={this.handleSaveEditForm} loading={formLoading}>
                        <TemplatesForm ref={this.formRef}
                            settings={templatesFormSettings}
                            values={this.state.editTemplateValues}
                            errors={this.state.formErrors}
                        />
                    </Form>
                </Modal.Content>
            </Modal>
        );

        return(
            <div className="">

                {modalFormNew}
                {modalFormEdit}

                <Route path="/admin/templates" exact={true} render={(props) => {
                    return (
                    <div>
                        <div>
                            <Link className="ui button" to={`/admin/templates/new`} onClick={this.handleOpenNewForm}>New Template</Link>
                        </div>
                        <table className="ui selectable celled table">
                            <thead>
                                <tr>
                                <th></th>
                                <th>Title</th>
                                <th>Users Required</th>
                                <th>Users Subscribed</th>
                                <th>Tasks</th>
                            </tr></thead>
                            {templates.map((template, jidx) => {
                                return (
                                    <Component_TemplatesEntry key={template.id}
                                        template={template}
                                        handleOpenEditForm={this.handleOpenEditForm}
                                        handleDeleteTemplate={this.handleDeleteTemplate}
                                    />
                                );
                            })}
                        </table>
                    </div>
                )}} />

                <Route path="/admin/templates/new" render={(props) => {
                    return (
                        <Form className="jobs-form" onSubmit={this.handleSaveNewForm} loading={formLoading}>
                            <Button onClick={this.handleCloseNewForm}>Cancel</Button>
                            <Button className="primary" onClick={this.handleSaveNewForm} disabled={formLoading}>Save</Button>
                            <TemplatesForm ref={this.formRef}
                                settings={templatesFormSettings}
                                values={this.state.editTemplateValues}
                                errors={this.state.formErrors}
                            />
                        </Form>
                    );
                }} />

                <Route path="/admin/templates/edit/:id" render={(props) => {
                    const tmlId = props.match.params.id;
                    const template = this.state.templates.find(el => {
                        return el.id == tmlId;
                    })

                    if (typeof template === "undefined") {
                        // return (
                        //     <form className="ui loading form">
                        //         <TemplatesForm ref={this.formRef} allow_childJobs={true} />
                        //     </form>
                        // );
                        return (<div>Error: template not found...</div>);
                    }

                    return (
                        <Form className="jobs-form" onSubmit={this.handleSaveEditForm} loading={formLoading}>
                            <div className="field">
                                <Button onClick={this.handleCloseEditForm}>Cancel</Button>
                                <Button className="primary" onClick={this.handleSaveEditForm} disabled={formLoading}>Save</Button>
                            </div>
                            <TemplatesForm ref={this.formRef}
                                settings={templatesFormSettings}
                                values={this.state.editTemplateValues}
                                errors={this.state.formErrors}
                            />
                        </Form>
                    );
                }} />


            </div>
        );
  }
}

export default Page_Templates;