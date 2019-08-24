---
title: Writing Style Guide
weight: 30
group: contributing
---

# Netlify CMS Style Guide
_Adapted from the [Kubernetes Style Guide](https://kubernetes.io/docs/contribute/style/style-guide)_

## Documentation Formatting Standards

### Use angle brackets for placeholders

Use angle brackets for placeholders. Tell the reader what a placeholder represents.

1. Display information about a cli command:

``` 
npm install <package-name>
```

where `<package-name>` is the name of a package.

### Use bold for user interface elements

Do: Click **Save**.

Don't: Click "Save".
_____

Do: Select **Log Out**.

Don't: Select 'Log Out'.
_____

### Use italics to define or introduce new terms

Do: A _collection_ is a set of entries ...	

Don't: A "collection" is a set of entries ...
_____

Do: These components form the _control pane_.	

Don't: These components form the **control pane**.
_____

### Use code style for filenames, directories, and paths

Do: Open the `config.yaml` file.

Don't: Open the config.yaml file.
_____

Do: Go to the `/docs/guides` directory.	

Don't: Go to the /docs/guides directory.
_____

Do: Open the `/admin/index.html` file.	

Don't: Open the /admin/index.html file.
_____

### Use the international standard for punctuation inside quotes

Do: Branch names begin with "cms".	

Don't: Branch names begin with "stage."
_____

Do: The copy is called a "fork".	

Don't: The copy is called a "fork."
_____

## Inline code formatting

### Use code style for inline code and commands

For inline code in an HTML document, use the `<code>` tag. In a Markdown document, use the backtick (`).

Do: The `yarn start` command starts the development server.	

Don't: The "yarn start" command starts the development server.
_____

Do: For a production build, use `yarn build`.	

Don't: For a production build, use "yarn build".
_____

Do: Enclose code samples with triple backticks. `(```)`	

Don't:Enclose code samples with any other syntax.
_____

### Use code style for object field names

Do: Set the value of the `media_folder` field in the configuration file.	

Don't: Set the value of the "media_folder" field in the configuration file.
_____

Do: The value of the `name` field is a string.	

Don't: The value of the "name" field is a string.
_____

### Use normal style for string and integer field values

For field values of type string or integer, use normal style without quotation marks.

Do: Set the value of `publish_mode` to editorial_workflow.	

Don't: Set the value of `imagePullPolicy` to "Always".
_____

Do: Set the value of `image` to nginx:1.8.	

Don't: Set the value of `image` to `nginx:1.8`.
_____

Do: Set the value of the `replicas` field to 2.	

Don't: Set the value of the `replicas` field to 2.
_____

## Code snippet formatting

### Don’t include the command prompt

Do: yarn start	

Don't: $ yarn start

## Content best practices

This section contains suggested best practices for clear, concise, and consistent content.

### Use present tense

Do: This command starts a proxy.	

Don't: This command will start a proxy.

Exception: Use future or past tense if it is required to convey the correct meaning.

### Use active voice

Do: You can explore the API using a browser.	

Don't: The API can be explored using a browser.
_____

Do: The YAML file specifies the collection name.

Don't: The collection name is specified in the YAML file.
_____

Exception: Use passive voice if active voice leads to an awkward construction.

### Use simple and direct language

Use simple and direct language. Avoid using unnecessary phrases, such as saying “please.”

Do: To create an entry, ...	

Don't: In order to create an entry, ...
_____

Do: See the configuration file.	

Don't: Please see the configuration file.
_____

Do: View the fields.	

Don't: With this next command, we'll view the fields.
_____

### Address the reader as “you”

Do: You can create a Deployment by ...	

Don't: We'll create a Deployment by ...
_____

Do: In the preceding output, you can see...	

Don't: In the preceding output, we can see ...

### Avoid Latin phrases

Prefer English terms over Latin abbreviations.

Do: For example, ...	

Don't: e.g., ...
_____

Do: That is, ...	

Don't: i.e., ...
_____

Exception: Use “etc.” for et cetera.

## Patterns to avoid

### Avoid using “we”

Using “we” in a sentence can be confusing, because the reader might not know whether they’re part of the “we” you’re describing.

Do: Version 1.4 includes ...	

Don't: In version 1.4, we have added ...
_____

Do: Netlify CMS provides a new feature for ...

Don't: We provide a new feature ...
_____

Do: This page teaches you how to use Widgets.	

Don't: In this page, we are going to learn about Widgets.
_____

### Avoid jargon and idioms

Some readers speak English as a second language. Avoid jargon and idioms to help them understand better.

Do: Internally

Don't: Under the hood, ...
_____

Do: Create a new cluster.	

Don't: Turn up a new cluster.
_____

### Avoid statements about the future

Avoid making promises or giving hints about the future. If you need to talk about an alpha feature, put the text under a heading that identifies it as alpha information.

### Avoid statements that will soon be out of date

Avoid words like “currently” and “new.” A feature that is new today might not be considered new in a few months.

Do: In version 1.4, ...	

Don't: In the current version, ...
_____

Do: The Federation feature provides ...	

Don't: The new Federation feature provides ...
_____

