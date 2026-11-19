from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
import html
import http.client
import json
from pathlib import Path
import re
import sys
import tomllib
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "data/external_feeds.toml"
OUTPUT = ROOT / "data/external_posts.json"
CACHE = ROOT / ".feed-cache/posts.json"
MAX_BYTES = 2 * 1024 * 1024
XML_BASE = "{http://www.w3.org/XML/1998/namespace}base"


def web_url(url):
    try:
        parts = urlsplit(url)
    except ValueError:
        return ""
    if parts.scheme in ("http", "https") and parts.hostname and parts.username is None:
        return url
    return ""


class WebRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not web_url(newurl):
            raise ValueError("Feed redirect must use HTTP or HTTPS")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class FeedTree(ET.TreeBuilder):
    def doctype(self, name, pubid, system):
        raise ValueError("Feed XML must not declare a DTD")


def text(element, *names):
    for name in names:
        child = element.find(f"{{*}}{name}")
        if child is not None:
            value = "".join(child.itertext()).strip()
            if value:
                return value
    return ""


def plain_text(value):
    return " ".join(re.sub(r"<[^>]*>", " ", html.unescape(value)).split())


def date_key(value):
    for parse in (datetime.fromisoformat, parsedate_to_datetime):
        try:
            date = parse(value)
            if date.tzinfo is None:
                date = date.replace(tzinfo=UTC)
            return date.astimezone(UTC).isoformat(timespec="seconds")
        except (TypeError, ValueError, OverflowError):
            continue
    return ""


def article_url(item, base):
    base = urljoin(base, item.get(XML_BASE, ""))
    for link in item.findall("{*}link"):
        href = link.get("href") or link.text or ""
        if href.strip() and link.get("rel", "alternate") == "alternate":
            url = web_url(urljoin(urljoin(base, link.get(XML_BASE, "")), href.strip()))
            if url:
                return url
    guid = item.find("{*}guid")
    if guid is not None and guid.get("isPermaLink", "true").lower() == "true":
        return web_url((guid.text or "").strip())
    return ""


def parse_feed(payload, url):
    root = ET.fromstring(payload, parser=ET.XMLParser(target=FeedTree()))
    base = urljoin(url, root.get(XML_BASE, ""))
    channel = root.find("{*}channel")
    if channel is not None:
        base = urljoin(base, channel.get(XML_BASE, ""))
        metadata = channel
        articles = channel.findall("{*}item") + root.findall("{*}item")
    elif root.tag.rsplit("}", 1)[-1] == "feed":
        metadata = root
        articles = root.findall("{*}entry")
    else:
        raise ValueError("unsupported RSS or Atom format")

    source = plain_text(text(metadata, "title")) or urlsplit(url).hostname
    posts = []
    for article in articles:
        title = plain_text(text(article, "title"))
        link = article_url(article, base)
        if title and link:
            summary = plain_text(text(article, "description", "summary"))
            if len(summary) > 150:
                summary = summary[:149].rsplit(" ", 1)[0] + "…"
            posts.append({
                "title": title,
                "url": link,
                "date": date_key(text(article, "pubDate", "published", "date", "updated")),
                "description": summary,
            })
    return {"source": source, "posts": sorted(posts, key=lambda post: post["date"], reverse=True)[:12]}


def fetch(url):
    request = Request(url, headers={
        "User-Agent": "Tolgas-IT-Sec-Blog/1.0 (RSS reader)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    })
    with build_opener(WebRedirects()).open(request, timeout=12) as response:
        payload = response.read(MAX_BYTES + 1)
        if len(payload) > MAX_BYTES:
            raise ValueError("feed exceeds 2 MiB")
        return parse_feed(payload, response.geturl())


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def main():
    with CONFIG.open("rb") as config:
        sources = {}
        for feed in tomllib.load(config).get("feeds", []):
            url = web_url(feed["url"])
            if not url:
                raise ValueError("Feed URLs must use HTTP or HTTPS")
            sources[url] = feed.get("name", "").strip()

    cached = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}

    def update(url):
        try:
            return fetch(url)
        except (OSError, http.client.HTTPException, ET.ParseError, ValueError) as error:
            print(f"Feed {url}: {error}", file=sys.stderr)
            return cached.get(url, {})

    with ThreadPoolExecutor(max_workers=4) as pool:
        snapshots = dict(zip(sources, pool.map(update, sources), strict=True))
    entries = [
        {**post, "source": sources[url] or snapshot["source"]}
        for url, snapshot in snapshots.items() if snapshot
        for post in snapshot["posts"]
    ]
    unique = {}
    for post in sorted(entries, key=lambda post: post["date"], reverse=True):
        unique.setdefault(post["url"], post)
    write_json(CACHE, snapshots)
    write_json(OUTPUT, {"posts": list(unique.values())[:12]})
    print(f"Loaded {len(unique)} unique posts from {len(sources)} feeds.")


if __name__ == "__main__":
    main()
