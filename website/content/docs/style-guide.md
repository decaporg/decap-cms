---
title: Style Guide
weight: 30
group: contributing
---

# Netlify CMS Style Guide

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


