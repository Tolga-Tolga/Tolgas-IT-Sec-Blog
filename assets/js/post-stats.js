(() => {
  const readingTime = document.querySelector("[data-post-minutes]");
  const article = readingTime.closest("article[lang]");
  const locale = article.lang;

  try {
    if (!Intl.DateTimeFormat.supportedLocalesOf(locale).length) return;

    const date = article.querySelector("[data-post-date]");
    if (date) {
      const formatDate = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
      date.textContent = formatDate.format(new Date(`${date.dateTime}T00:00:00Z`));
    }

    const formatDuration = new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "minute",
      unitDisplay: "long",
    });
    readingTime.textContent = `≈ ${formatDuration.format(Number(readingTime.dataset.postMinutes))}`;
  } catch {
    // Keep the readable fallback for unsupported locale tags.
  }
})();
