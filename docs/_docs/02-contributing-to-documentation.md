---
title: Contributing to Developer Guide
excerpt: How to update the documentation
permalink: /docs/contributing-to-documentation/
---

This page explains how to update the documentation.

## Quick workflow

1. Add/Edit docs in `docs/_docs` (or pages in `docs/_pages`).
   - Name the file with a number prefix to control ordering in the sidebar (e.g. `01-developer-guide.md`).
   - For a new page, ensure there is the YAML Front Matter at the start:
   ```yml
   ---
   title: Developer Guide
   excerpt: Quick orientation to the project
   permalink: /docs/developer-guide/
   ---
   ```
2. Add a left sidebar item, following the instructions [here](#add-page-to-sidebar).
3. Run the docs locally from `docs/`:
   - Ensure you have the pre-requesites installed: [Jekyll Installation](https://jekyllrb.com/docs/installation/)
   - `bundle install`
   - `bundle exec jekyll serve`
4. Open a PR

## Add page to sidebar

Sidebar links are defined in `docs/_data/navigation.yml` under `docs:`.

1. Add your new doc page in `docs/_docs` (for example, `my-topic.md`).
2. Add a sidebar item in `docs/_data/navigation.yml`:

```yml
docs:
	- title: "Backend Code"
		children:
			- title: "My Topic"
				url: /docs/my-topic/  # based on permalink or filename
```

3. Run `bundle exec jekyll serve` and verify the link appears in the left sidebar.

Use URL format `/docs/<file-name>/` where `<file-name>` matches the markdown file name.

## Troubleshooting

### Liquid Syntax Error

{% raw %}
**Example error message:**

```
Liquid Warning: Liquid syntax error (line 724): Expected end_of_string but found colon in "{{ color: code.colorHex }}" in docs/_docs/drizzle-orm.md/#excerpt
```

**Why it happens**

Double braces `{{ }}` are treated as [Liquid template syntax](https://liquidjs.com/tutorials/intro-to-liquid.html). Liquid interprets these as template variables, so `{{ color: code.colorHex }}` is invalid syntax.

**How to solve it**

Escape curly braces by wrapping the code block with `raw` and `endraw` tags wrapped with `{%` and `%}`:

Read more [here](https://liquidjs.com/tutorials/escaping.html).

{% endraw %}
