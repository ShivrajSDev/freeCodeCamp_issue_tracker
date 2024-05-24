const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const testProjectName = 'apitest';
let newIssueID;

suite('Functional Tests', function() {
    this.timeout(5000);

    //Create an issue with every field: POST request to /api/issues/{project}
    test("Create an issue with every field", function(done) {
        chai.request(server)
            .keepOpen()
            .post(`/api/issues/${testProjectName}`)
            .send({ issue_title: 'Chai Test Issue', issue_text: 'Testing via Chai', created_by: 'User A', assigned_to: 'User B', status_text: 'New' })
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                // Check all filled-in fields were included
                assert.equal(res.body.issue_title, 'Chai Test Issue');
                assert.equal(res.body.issue_text, 'Testing via Chai');
                assert.equal(res.body.created_by, 'User A');
                assert.equal(res.body.assigned_to, 'User B');
                assert.equal(res.body.status_text, 'New');
                // Check fields defined on save
                assert.equal(res.body.open, true);
                assert.exists(res.body._id);
                assert.exists(res.body.created_on);
                assert.exists(res.body.updated_on);

                newIssueID = res.body._id;

                done();
            });
    });
    
    //Create an issue with only required fields: POST request to /api/issues/{project}
    test("Create an issue with only required fields", function(done) {
        chai.request(server)
            .keepOpen()
            .post(`/api/issues/${testProjectName}`)
            .send({ issue_title: 'Chai Test Issue', issue_text: 'Testing via Chai', created_by: 'User A'})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                // Check all filled-in fields were included
                assert.equal(res.body.issue_title, 'Chai Test Issue');
                assert.equal(res.body.issue_text, 'Testing via Chai');
                assert.equal(res.body.created_by, 'User A');
                assert.equal(res.body.assigned_to, '');
                assert.equal(res.body.status_text, '');
                // Check fields defined on save
                assert.equal(res.body.open, true);
                assert.exists(res.body._id);
                assert.exists(res.body.created_on);
                assert.exists(res.body.updated_on);

                newIssueID = res.body._id;

                done();
            });
    });

    //Create an issue with missing required fields: POST request to /api/issues/{project}
    test("Create an issue with missing required fields", function(done) {
        chai.request(server)
            .keepOpen()
            .post(`/api/issues/${testProjectName}`)
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.exists(res.body.error);
                assert.equal(res.body.error, 'required field(s) missing');
                /*assert.exists(res.body.errors.issue_title);
                assert.exists(res.body.errors.issue_text);
                assert.exists(res.body.errors.created_by);
                assert.include(res.body.message, '`issue_title` is required');
                assert.include(res.body.message, '`issue_text` is required');
                assert.include(res.body.message, '`created_by` is required');*/
                done();
            });
    });

    //View issues on a project: GET request to /api/issues/{project}
    test("View issues on a project", function(done) {
        chai.request(server)
            .keepOpen()
            .get(`/api/issues/${testProjectName}`)
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                assert.isArray(res.body);
                // Check if new issue exists
                const newIssue = res.body.find(i => i._id);
                assert.exists(newIssue);

                done();
            });
    });

    //View issues on a project with one filter: GET request to /api/issues/{project}
    test("View issues on a project with one filter", function(done) {
        chai.request(server)
            .keepOpen()
            .get(`/api/issues/${testProjectName}?issue_title=Chai`)
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                assert.isArray(res.body);
                // Check if new issue exists
                const newIssue = res.body.find(i => i._id);
                assert.exists(newIssue);

                done();
            });
    });

    //View issues on a project with multiple filters: GET request to /api/issues/{project}
    test("View issues on a project with multiple filters", function(done) {
        chai.request(server)
            .keepOpen()
            .get(`/api/issues/${testProjectName}?issue_title=Chai&issue_text=Testing`)
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                assert.isArray(res.body);
                // Check if new issue exists
                const newIssue = res.body.find(i => i._id);
                assert.exists(newIssue);

                done();
            });
    });

    //Update one field on an issue: PUT request to /api/issues/{project}
    test("Update one field on an issue", function(done) {
        chai.request(server)
            .keepOpen()
            .put(`/api/issues/${testProjectName}`)
            .send({ _id: newIssueID, issue_text: 'Updating Chai test results'})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                assert.exists(res.body.result);
                assert.equal(res.body.result, 'successfully updated');
                assert.exists(res.body._id);
                assert.equal(res.body._id, newIssueID);

                done();
            });
    });

    //Update multiple fields on an issue: PUT request to /api/issues/{project}
    test("Update multiple fields on an issue", function(done) {
        chai.request(server)
            .keepOpen()
            .put(`/api/issues/${testProjectName}`)
            .send({ _id: newIssueID, issue_text: 'Updating Chai test results once again', status_text: 'In progress'})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                assert.exists(res.body.result);
                assert.equal(res.body.result, 'successfully updated');
                assert.exists(res.body._id);
                assert.equal(res.body._id, newIssueID);

                done();
            });
    });

    //Update an issue with missing _id: PUT request to /api/issues/{project}
    test("Update an issue with missing _id", function(done) {
        chai.request(server)
            .keepOpen()
            .put(`/api/issues/${testProjectName}`)
            .send({ issue_text: 'Updating Chai test results once again', status_text: 'In progress'})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.exists(res.body.error);
                assert.equal(res.body.error, 'missing _id');

                done();
            });
    });

    //Update an issue with no fields to update: PUT request to /api/issues/{project}
    test("Update an issue with no fields to update", function(done) {
        chai.request(server)
            .keepOpen()
            .put(`/api/issues/${testProjectName}`)
            .send({ _id: newIssueID})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.exists(res.body.error);
                assert.equal(res.body.error, 'no update field(s) sent');
                assert.exists(res.body._id);
                assert.equal(res.body._id, newIssueID);

                done();
            });
    });

    //Update an issue with an invalid _id: PUT request to /api/issues/{project}
    test("Update an issue with an invalid _id", function(done) {
        chai.request(server)
            .keepOpen()
            .put(`/api/issues/${testProjectName}`)
            .send({ _id: 'invalid', issue_title: 'Updating title'})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.exists(res.body.error);
                assert.equal(res.body.error, 'could not update');
                assert.exists(res.body._id);
                assert.equal(res.body._id, 'invalid');

                done();
            });
    });

    //Delete an issue: DELETE request to /api/issues/{project}
    test("Delete an issue", function(done) {
        chai.request(server)
            .keepOpen()
            .delete(`/api/issues/${testProjectName}`)
            .send({ _id: newIssueID})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.notExists(res.body.errors);
                assert.exists(res.body.result);
                assert.equal(res.body.result, 'successfully deleted');
                assert.exists(res.body._id);
                assert.equal(res.body._id, newIssueID);

                done();
            });
    });

    //Delete an issue with an invalid _id: DELETE request to /api/issues/{project}
    test("Delete an issue with an invalid _id", function(done) {
        chai.request(server)
            .keepOpen()
            .delete(`/api/issues/${testProjectName}`)
            .send({ _id: 'invalid'})
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.exists(res.body.error);
                assert.equal(res.body.error, 'could not delete');
                assert.exists(res.body._id);
                assert.equal(res.body._id, 'invalid');

                done();
            });
    });

    //Delete an issue with missing _id: DELETE request to /api/issues/{project}
    test("Delete an issue with missing _id", function(done) {
        chai.request(server)
            .keepOpen()
            .delete(`/api/issues/${testProjectName}`)
            .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.exists(res.body.error);
                assert.equal(res.body.error, 'missing _id');

                done();
            });
    });

});
