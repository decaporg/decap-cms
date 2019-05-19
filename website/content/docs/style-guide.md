---
title: Style Guide
weight: 30
group: contributing
---

# Netlify CMS Style Guide

NOTE: Guide taken from [Kubernete's Style Guide](https://kubernetes.io/docs/contribute/style/style-guide/#use-bold-for-user-interface-elements)

## Documentation Formatting Standards

### Use camel case for API objects

When you refer to an API object, use the same uppercase and lowercase letters that are used in the actual object name. Typically, the names of API objects use [camel case](https://en.wikipedia.org/wiki/Camel_case).

Don’t split the API object name into separate words. For example, use PodTemplateList, not Pod Template List.

Refer to API objects without saying “object,” unless omitting “object” leads to an awkward construction.

Do: The Pod has two containers.

Don't: The pod has two containers.
_____

Do: The Deployment is responsible for ...	

Don't: The Deployment object is responsible for ...
_____

Do: A PodList is a list of Pods.

Don't: A Pod List is a list of pods.
_____

Do: The two ContainerPorts ...

Don't: The two ContainerPort objects ...
_____

Do: The two ContainerStateTerminated objects ...

Don't: The two ContainerStateTerminateds ...
_____

### Use angle brackets for placeholders

Use angle brackets for placeholders. Tell the reader what a placeholder represents.

1. Display information about a Pod:

``` 
kubectl describe pod <pod-name>
```

where ```<pod-name>``` is the name of one of your Pods.

### Use bold for user interface elements

Do: Click **Fork**.

Don't: Click "Fork".
_____

Do: Select **Other**.

Don't: Select 'Other'.
_____

### Use italics to define or introduce new terms

Do: A _cluster_ is a set of nodes ...	

Don't: A "cluster" is a set of nodes ...
_____

Do: These components form the _control plane_.	

Don't: These components form the **control plane**.
_____

### Use code style for filenames, directories, and paths

Do: Open the `envars.yaml` file.

Don't: Open the envars.yaml file.
_____

Do: Go to the `/docs/tutorials` directory.	

Don't: Go to the /docs/tutorials directory.
_____

Do: Open the `/_data/concepts.yaml` file.	

Don't: Open the /_data/concepts.yaml file.
_____

### Use the international standard for punctuation inside quotes

Do: events are recorded with an associated "stage".	

Don't: events are recorded with an associated "stage."
_____

Do: The copy is called a "fork".	

Don't: The copy is called a "fork."
_____

## Inline code formatting

### Use code style for inline code and commands

For inline code in an HTML document, use the `<code>` tag. In a Markdown document, use the backtick (`).

Do: The `kubectl run` command creates a Deployment.	

Don't: The "kubectl run" command creates a Deployment.
_____

Do: For declarative management, use `kubectl apply`.	

Don't: For declarative management, use "kubectl apply".
_____

Do: Enclose code samples with triple backticks. `(```)`	

Don't:Enclose code samples with any other syntax.
_____

### Use code style for object field names

Do: Set the value of the `replicas` field in the configuration file.	

Don't: Set the value of the "replicas" field in the configuration file.
_____

Do: The value of the `exec` field is an ExecAction object.	

Don't: The value of the "exec" field is an ExecAction object.
_____

### Use normal style for string and integer field values

For field values of type string or integer, use normal style without quotation marks.

Do: Set the value of `imagePullPolicy` to Always.	

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

Do: kubectl get pods	

Don't: $ kubectl get pods

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

Do: The YAML file specifies the replica count.

Don't: The replica count is specified in the YAML file.
_____

Exception: Use passive voice if active voice leads to an awkward construction.

### Use simple and direct language

Use simple and direct language. Avoid using unnecessary phrases, such as saying “please.”

Do: To create a ReplicaSet, ...	

Don't: In order to create a ReplicaSet, ...
_____

Do: See the configuration file.	

Don't: Please see the configuration file.
_____

Do: View the Pods.	

Don't: With this next command, we'll view the Pods.
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

Do: Kubernetes provides a new feature for ...

Don't: We provide a new feature ...
_____

Do: This page teaches you how to use Pods.	

Don't: In this page, we are going to learn about Pods.
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

