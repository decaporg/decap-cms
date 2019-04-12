const workflowStatus = { draft: 'Drafts', review: 'In Review', ready: 'Ready' };
const editorStatus = { draft: 'Draft', review: 'In review', ready: 'Ready' };
const setting1 = { limit: 10, author: 'John Doe' };
const setting2 = { name: 'Jane Doe', description: 'description' };
const publishTypes = { publishNow: 'Publish now' };
const notifications = {
  saved: 'Entry saved',
  published: 'Entry published',
  unpublished: 'Entry unpublished',
  updated: 'Entry status updated',
  deletedUnpublished: 'Unpublished changes deleted',
  error: {
    missingField: "Oops, you've missed a required field. Please complete before saving.",
  },
  validation: {
    range: {
      fieldLabel: 'Number of posts on frontpage',
      message: 'Number of posts on frontpage must be between 1 and 10.',
    },
  },
};

module.exports = {
  workflowStatus,
  editorStatus,
  setting1,
  setting2,
  notifications,
  publishTypes,
};
