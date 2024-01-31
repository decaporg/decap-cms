---
group: Add
weight: 4
title: 3. Configure Decap CMS
---

Configuration is different for every site, so we'll break it down into parts.  Add all the code snippets in this section to your `admin/config.yml` file.

### Backend

We're using [Netlify](https://www.netlify.com) for our hosting and authentication in this tutorial, so backend configuration is fairly straightforward.

For GitHub and GitLab repositories, you can start your Decap CMS `config.yml` file with these lines:

```yaml
backend:
  name: git-gateway
  branch: main # Branch to update (optional; defaults to master)
```

*(For Bitbucket repositories, use the [Bitbucket backend](/docs/bitbucket-backend) instructions instead.)*

The configuration above specifies your backend protocol and your publication branch. Git Gateway is an open source API that acts as a proxy between authenticated users of your site and your site repo. (We'll get to the details of that in the [Authentication section](#authentication) below.) If you leave out the `branch` declaration, it defaults to `master`.

### Media and Public Folders

Decap CMS allows users to upload images directly within the editor. For this to work, the CMS needs to know where to save them. If you already have an `images` folder in your project, you could use its path, possibly creating an `uploads` sub-folder, for example:

```yaml
# This line should *not* be indented
media_folder: "images/uploads" # Media files will be stored in the repo under images/uploads
```

If you're creating a new folder for uploaded media, you'll need to know where your static site generator expects static files. You can refer to the paths outlined above in [App File Structure](#app-file-structure), and put your media folder in the same location where you put the `admin` folder.

Note that the `media_folder` file path is relative to the project root, so the example above would work for Jekyll, GitBook, or any other generator that stores static files at the project root. However, it would not work for Hugo, Hexo, Middleman, or others that store static files in a subfolder. Here's an example that could work for a Hugo site:

```yaml
# These lines should *not* be indented
media_folder: "static/images/uploads" # Media files will be stored in the repo under static/images/uploads
public_folder: "/images/uploads" # The src attribute for uploaded media will begin with /images/uploads
```

The configuration above adds a new setting: `public_folder`. Whereas `media_folder` specifies where uploaded files are saved in the repo, `public_folder` indicates where they are found in the published site. Image `src` attributes use this path, which is relative to the file where it's called. For this reason, we usually start the path at the site root, using the opening `/`.

*__Note:__ If `public_folder` is not set, Decap CMS defaults to the same value as `media_folder`, adding an opening `/` if one is not included.*

### Collections

Collections define the structure for the different content types on your static site. Since every site is different, the `collections` settings differ greatly from one site to the next.

Let's say your site has a blog, with the posts stored in `_posts/blog`, and files saved in a date-title format, like `1999-12-31-lets-party.md`. Each post begins with settings in yaml-formatted front matter, like so:

```yaml
---
layout: blog
title: "Let's Party"
date: 1999-12-31 11:59:59 -0800
thumbnail: "/images/prince.jpg"
rating: 5
---

This is the post body, where I write about our last chance to party before the Y2K bug destroys us all.
```

Given this example, our `collections` settings would look like this in your Decap CMS `config.yml` file:

```yaml
collections:
  - name: "blog" # Used in routes, e.g., /admin/collections/blog
    label: "Blog" # Used in the UI
    folder: "_posts/blog" # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}" # Filename template, e.g., YYYY-MM-DD-title.md
    fields: # The fields for each document, usually in front matter
      - {label: "Layout", name: "layout", widget: "hidden", default: "blog"}
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Featured Image", name: "thumbnail", widget: "image"}
      - {label: "Rating (scale of 1-5)", name: "rating", widget: "number"}
      - {label: "Body", name: "body", widget: "markdown"}
```

Let's break that down:

<table>
  <tr>
    <td><code>name</code></td>
    <td>Post type identifier, used in routes. Must be unique.</td>
  </tr>
  <tr>
    <td><code>label</code></td>
    <td>What the admin UI calls the post type.</td>
  </tr>
  <tr>
    <td><code>folder</code></td>
    <td>Where files of this type are stored, relative to the repo root.</td>
  </tr>
  <tr>
    <td><code>create</code></td>
    <td>Set to <code>true</code> to allow users to create new files in this collection.
</td>
  </tr>
  <tr>
    <td><code>slug</code></td>
    <td>Template for filenames. <code>{{year}}</code>, <code>{{month}}</code>, and <code>{{day}}</code> pulls from the post's <code>date</code> field or save date. <code>{{slug}}</code> is a URL-safe version of the post's <code>title</code>. Default is simply <code>{{slug}}</code>.
</td>
  </tr>
  <tr>
    <td><code>fields</code></td>
    <td>Fields listed here are shown as fields in the content editor, then saved as front matter at the beginning of the document (except for <code>body</code>, which follows the front matter). Each field contains the following properties:
      <ul>
        <li><code>label</code>: Field label in the editor UI.</li>
        <li><code>name</code>: Field name in the document front matter.</li>
        <li><code>widget</code>: Determines UI style and value data type (details below).</li>
        <li><code>default</code> (optional): Sets a default value for the field.</li>
      </ul>
    </td>
  </tr>
</table>

As described above, the `widget` property specifies a built-in or custom UI widget for a given field. When a content editor enters a value into a widget, that value is saved in the document front matter as the value for the `name` specified for that field. A full listing of available widgets can be found in the [Widgets doc](../widgets).

Based on this example, you can go through the post types in your site and add the appropriate settings to your Decap CMS `config.yml` file. Each post type should be listed as a separate node under the `collections` field. See the [Collections reference doc](../configuration-options/#collections) for more configuration options.

### Filter

The entries for any collection can be filtered based on the value of a single field. The example collection below only shows post entries with the value `en` in the `language` field.

```yaml
collections:
  - name: "posts"
    label: "Post"
    folder: "_posts"
    filter:
      field: language
      value: en
    fields:
      - {label: "Language", name: "language"}
```

<p>
    <strong>Once this is completed, proceed to</strong> <a href="/docs/access-your-content/" class="button">4. Access Your Content</a>
</p>
