# Tolgas IT-Sec Blog

Der Hugo-Blog sammelt praktische Untersuchungen aktueller IT-Schwachstellen und CVEs sowie Beiträge zu weiteren Themen der IT-Sicherheit. Die Website ist zweisprachig. Englisch liegt unter `/`, Deutsch unter `/de/`.

## Lokal ansehen

Der GitHub-Pages-Workflow verwendet Hugo 0.170.1. Externe Feeds werden mit Python 3.11 oder neuer eingelesen.

```sh
hugo server -D
```

Hugo gibt im Terminal die lokale Vorschauadresse aus. Mit `-D` erscheinen auch Entwürfe. Die Vorschau schreibt nach `public-preview/`. Der Produktionsbuild für GitHub Pages schreibt nach `public/`. Für externe Kacheln in der Vorschau kannst du vorher `python scripts/update-feeds.py` ausführen.

## Beiträge und Übersetzungen

Schreibe deine Beiträge als Markdown-Dateien unter `content/posts/`. Die [NGINX-Blaupause](content/posts/nginx-cve_de.md) ist ein Entwurf. Ergänze vor der Veröffentlichung Titel, Datum, Beschreibung und CVE-Kennung. Setze anschließend `draft = false`.

```sh
hugo new content posts/blogxyz_en.md
hugo new content posts/blogxyz_de.md
```

Dateien mit demselben Namen vor dem Sprachsuffix gehören zum selben Beitrag. Weitere Varianten wie `blogxyz_fr.md` oder `blogxyz_pt-BR.md` erscheinen automatisch in der Artikelauswahl. Dateien ohne Suffix gelten als englische Fassung.

Jede Sprachfassung braucht `visible = true`, damit sie angezeigt wird. Neue Beiträge starten mit `visible = false`. Für die Veröffentlichung auf GitHub Pages muss zusätzlich `draft = false` gesetzt sein. Die lokale Vorschau mit `-D` zeigt auch Entwürfe mit `visible = true`.

Die Website-Sprache bestimmt die bevorzugte Fassung der Kachel. Fehlt sie, bleibt eine vorhandene Sprachfassung erreichbar, mit Englisch als erster Ausweichsprache. Innerhalb eines Artikels erscheint die Sprachwahl, sobald mehrere Fassungen veröffentlicht sind. Der Wechsel dort betrifft nur den Artikel.

## Externe Feeds

Trage in [data/external_feeds.toml](data/external_feeds.toml) für jeden RSS- oder Atom-Feed einen Block ein. Optional überschreibt `name` den Quellnamen aus dem Feed.

```toml
[[feeds]]
url = "https://example.org/feed.xml"
name = "Name des Blogs"
```

Unter deinen Beiträgen erscheinen bis zu zwölf externe Beiträge im selben Kachelformat. Die Titel verlinken auf die Originalartikel. GitHub Actions ruft die Feeds bei jedem Build und planmäßig alle sechs Stunden ab. Bei einem Abruffehler kann der Workflow die zuletzt gespeicherten Einträge der Quelle verwenden.

Die RSS-Feeds des Blogs enthalten die eigenen Beiträge. Sie liegen unter `/index.xml` und `/de/index.xml` relativ zur Blog-Adresse.

## Datenschutz

Setze in [data/privacy.toml](data/privacy.toml) den Namen des Verantwortlichen und die für Datenschutzanfragen vorgesehene Kontaktadresse ein. Beide Sprachfassungen der Datenschutzerklärung übernehmen diese Angaben automatisch. Ihre Links stehen im Footer.

## GitHub Pages

Wähle im Repository unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions**. Der [Workflow](.github/workflows/pages.yml) baut und veröffentlicht die Website bei Pushes auf `main`. Er übernimmt die Basis-URL aus der Pages-Konfiguration. Die voreingestellte Projektadresse ist [tolga-tolga.github.io/Tolgas-IT-Sec-Blog](https://tolga-tolga.github.io/Tolgas-IT-Sec-Blog/). [GitHub Pages konfigurieren](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Kitty-Themes

Die Theme-Auswahl enthält alle 435 Paletten des eingebundenen Katalogstands. Tokyo Night ist voreingestellt. Die Auswahl gilt für den aktuellen Tab. Mit **Theme auf diesem Gerät merken** bleibt sie im selben Browser bis zu 180 Tage gültig. Das Entfernen des Häkchens löscht den dauerhaft gespeicherten Eintrag. [Kitty-Katalogstand](https://github.com/kovidgoyal/kitty-themes/tree/500a1d16525edae093e854a3190d87bdbd302dd0) · [Kataloglizenz](static/licenses/kitty-themes.txt)

Der Katalog lässt sich aus einem ausgecheckten Upstream-Stand mit `python scripts/import-kitty-themes.py <Pfad> <Commit-SHA>` aktualisieren.
