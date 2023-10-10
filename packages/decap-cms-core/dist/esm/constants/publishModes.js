"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.statusDescriptions = exports.status = exports.Statues = exports.SIMPLE = exports.EDITORIAL_WORKFLOW = void 0;
var _immutable = require("immutable");
// Create/edit workflow modes
const SIMPLE = 'simple';
exports.SIMPLE = SIMPLE;
const EDITORIAL_WORKFLOW = 'editorial_workflow';
exports.EDITORIAL_WORKFLOW = EDITORIAL_WORKFLOW;
const Statues = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PENDING_PUBLISH: 'pending_publish'
};

// Available status
exports.Statues = Statues;
const status = (0, _immutable.OrderedMap)(Statues);
exports.status = status;
const statusDescriptions = (0, _immutable.Map)({
  [status.get('DRAFT')]: 'Draft',
  [status.get('PENDING_REVIEW')]: 'Waiting for Review',
  [status.get('PENDING_PUBLISH')]: 'Waiting to go live'
});
exports.statusDescriptions = statusDescriptions;