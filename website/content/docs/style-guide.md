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
