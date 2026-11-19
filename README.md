# Tolga's IT Security Blog

A personal, non-commercial IT security blog about hands-on vulnerability analysis, CVEs, and other security topics.

## Architecture

Hugo builds a static site and RSS feeds from Markdown. GitHub Actions imports external feeds, runs Hugo, and deploys the result to GitHub Pages. [Hugo](https://gohugo.io/) · [Deployment workflow](.github/workflows/publish-blog.yml)

## Kitty themes

The theme picker includes 435 color palettes from the [Kitty theme catalog](https://github.com/kovidgoyal/kitty-themes/tree/500a1d16525edae093e854a3190d87bdbd302dd0).

## Local preview

Run the same Hugo version used by GitHub Actions (currently 0.170.1) from the repository root.

```sh
hugo server -D
```

Open the URL printed by Hugo. To include external articles in the preview, run `python scripts/update-feeds.py` with Python 3.11 or newer before starting Hugo.

## Writing posts

From the repository root, create a Markdown file for each language you want to publish.

```sh
hugo new content posts/topic_en.md
hugo new content posts/topic_de.md
```

Both files go in `content/posts/`. Use the same name before the language suffix to group translations. One file is enough for a single-language post. Additional translations can use suffixes such as `_fr` or `_pt-BR`. The site prefers a version matching the page language, with English as the first fallback. The article language switcher appears when multiple versions are available and changes only the article.

Fill in `title` and `description` in the generated TOML front matter. Hugo sets `date` when it creates the file. Add optional `tags` and write the article below the closing `+++`. Set `visible = true` to show it in the preview. Keep `draft = true` while writing, then set `draft = false` when it is ready for the normal build. [Post template](archetypes/posts.md)

## Adding external feeds

Add one `[[feeds]]` block per RSS or Atom source in `data/external_feeds.toml`. Use the feed's XML URL. The optional `name` overrides the source label on the cards. [Feed configuration](data/external_feeds.toml)

```toml
[[feeds]]
url = "https://example.org/feed.xml"
name = "Example Blog"
```

The importer fetches feeds before Hugo builds the site, deduplicates article URLs, and writes up to 12 of the newest entries to `data/external_posts.json`. If a source is unavailable, the importer can reuse its cached entries. Hugo renders the entries as cards below the blog's own posts and links to the originals. GitHub Actions runs on pushes to `main` and is scheduled to refresh the feeds every six hours. [Feed importer](scripts/update-feeds.py)

## Subscribing to this blog

Copy the **RSS** link from the site header into your feed reader. Hugo generates `index.xml` for English and `de/index.xml` for German, relative to the site's base URL. Each feed includes the blog's own posts and prefers the corresponding article language. [English RSS](https://tolga.icu/index.xml) · [German RSS](https://tolga.icu/de/index.xml)

## Adapting the site

1. Set your `baseURL`, shared `title`, `copyright`, and English and German descriptions in `hugo.toml`. The Pages workflow supplies its deployment URL at build time. [Hugo configuration](hugo.toml)
2. Replace the existing posts, logo in `assets/brand.svg`, privacy pages, and contact details with your own. Set your sources in `data/external_feeds.toml`. [Content](content/) · [Privacy contact settings](data/privacy.toml)
3. To customize your own RSS feed, edit `layouts/rss.xml` for the channel and item fields or `[outputs]` in `hugo.toml` to control which page types generate RSS. Share the feed URLs under your own site address. [RSS template](layouts/rss.xml)
4. In your GitHub repository, choose **Settings → Pages → Build and deployment → Source → GitHub Actions**. Enable the workflow if prompted and push to `main` to deploy. [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## License

© 2026 Tolga. The original website code is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). See the [copyright and third-party notices](COPYRIGHT.md).
