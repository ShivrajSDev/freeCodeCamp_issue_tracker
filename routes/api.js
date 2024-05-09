'use strict';

module.exports = function (app) {

  const mongoose = require('mongoose');

  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  let Project;
  let Issue;

  let projectSchema = mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    issues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }]
  });

  let issueSchema = mongoose.Schema({
    issue_title: {
      type: String,
      required: true
    },
    issue_text: {
      type: String,
      required: true
    },
    created_on: {
      type: Date,
      default: Date.now
    },
    updated_on: {
      type: Date,
      default: Date.now
    },
    created_by: {
      type: String,
      required: true
    },
    assigned_to: String,
    open: {
      type: Boolean,
      default: true
    },
    status_text: String
  });

  Project = mongoose.model('Project', projectSchema);
  Issue = mongoose.model('Issue', issueSchema);

  const acceptableGetQueries = ['_id', 'issue_title', 'issue_text', 'created_by', 'assigned_to', 'open', 'status_text'];

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      let queries = req.query;

      for(let key in queries) {
        if(!acceptableGetQueries.find(i => i === key)) {
          delete queries[key];
        }
      }
      
      Project.findOne({name: project})
      .populate({path: "issues"})
        .exec((err1, existing) => {
          if(err1) {
            res.json(err1);
            return;
          }
          let existingIssues = existing.issues
            .filter(issue => Object.entries(queries)
            .every(([key,query]) => issue[key].toString().toLowerCase().includes(query.toLowerCase())))
            .map(issue => {
            return {
              "_id": issue._id,
              "issue_title": issue.issue_title,
              "issue_text": issue.issue_text,
              "created_on": issue.created_on,
              "updated_on": issue.updated_on,
              "created_by": issue.created_by,
              "assigned_to": issue.assigned_to,
              "open": issue.open,
              "status_text": issue.status_text
            };
          });

          res.json(existingIssues);
        });
    })
    
    .post(function (req, res){
      let project = req.params.project;

      if(!req.body.issue_title || ! req.body.issue_text || !req.body.created_by) {
        res.json({error: 'required field(s) missing'});
        return;
      }
      
      let saveOptions = { upsert: true, new: true, setDefaultsOnInsert: true };
      Project.findOneAndUpdate({name: project}, {}, saveOptions, function(err1, existingProject) {
        if(err1) {
          res.json(err1);
          return;
        }
        
        let newIssue = Issue({
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || "",
          status_text: req.body.status_text || ""
        });

        newIssue.save(function(err2, savedIssue) {
          if(err2) {
            res.json(err2);
            return;
          }
          existingProject.issues.push(savedIssue);
          existingProject.save(function(err3, data) {
            if(err3) {
              res.json(err3);
            } else {
              res.json({
                "assigned_to": savedIssue.assigned_to,
                "status_text": savedIssue.status_text,
                "open": savedIssue.open,
                "_id": savedIssue._id,
                "issue_title": savedIssue.issue_title,
                "issue_text": savedIssue.issue_text,
                "created_by": savedIssue.created_by,
                "created_on": savedIssue.created_on,
                "updated_on": savedIssue.updated_on
              });
            }
          });
        });
      });
    })
    
    .put(function (req, res){
      let project = req.params.project;

      if(!req.body._id) {
        res.json({error: 'missing _id'});
        return;
      }

      const {_id, ...updateParams } = req.body;

      if(Object.values(updateParams).every(i => i.length === 0)) {
        res.json({error: 'no update field(s) sent', _id: req.body._id});
        return;
      }

      Project.findOne({name: project})
        .populate({path: "issues"})
        .exec((err1, existing) => {
          if(err1) {
            res.json(err1);
            return;
          }
          let existingIssues = existing.issues;

          let matchingIssueInProject = existingIssues.find(i => i._id.toString() === req.body._id);
          if(!matchingIssueInProject) {
            res.json({
              error: "could not update",
              "_id": req.body._id
            });
          } else {
            let updatedParams = {
              updated_on: new Date(),
              issue_title: req.body.issue_title?.trim() || undefined,
              issue_text: req.body.issue_text?.trim() || undefined,
              created_by: req.body.created_by?.trim() || undefined,
              assigned_to: req.body.assigned_to?.trim() || undefined,
              status_text: req.body.status_text?.trim() || undefined,
              open: req.body.open || true
            }
            for(let key in updatedParams) {
              if(updatedParams[key] === undefined) {
                delete updatedParams[key];
              }
            }

            Issue.findOneAndUpdate({_id: req.body._id}, updatedParams, {runValidators: true})
              .then(updatedIssue => res.json({
                result: "successfully updated",
                _id: req.body._id
              }))
              .catch(err => res.json(err));
          }
        });
    })
    
    .delete(function (req, res){
      let project = req.params.project;

      if(!req.body._id) {
        res.json({error: 'missing _id'});
        return;
      }
      
      Project.findOne({name: project})
      .populate({path: "issues"})
        .exec((err1, existing) => {
          if(err1) {
            res.json(err1);
            return;
          }
          let existingIssues = existing.issues;

          let matchingIssueInProject = existingIssues.find(i => i._id.toString() === req.body._id);
          if(!matchingIssueInProject) {
            res.json({
              error: "could not delete",
              "_id": req.body._id
            });
          } else {
            Issue.deleteOne({_id: req.body._id})
              .then(updatedIssue => res.json({
                result: "successfully deleted",
                _id: req.body._id
              }))
              .catch(err => res.json(err));
          }
        });
    });
    
};
