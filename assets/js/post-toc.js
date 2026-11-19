(() => {
  const toc = document.querySelector(".post-toc");
  const sections = Array.from(toc.querySelectorAll('a[href^="#"]'), (link) => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1))),
  })).filter(({ heading }) => heading);
  if (!sections.length) return;

  let activeLink;
  let framePending = false;
  let anchorJump;

  function followSection(index, readingLine, viewportHeight) {
    if (toc.scrollHeight <= toc.clientHeight || toc.querySelector("a:focus-visible")) return;

    const tocTop = toc.getBoundingClientRect().top;
    const visibleTop = Math.max(0, -tocTop);
    const visibleBottom = Math.min(toc.clientHeight, viewportHeight - tocTop);
    if (visibleBottom <= visibleTop) return;

    const { link, heading } = sections[index];
    const linkTop = link.offsetTop;
    const next = sections[index + 1];
    let offset = linkTop;
    if (next) {
      const start = heading.getBoundingClientRect().top;
      const end = next.heading.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, (readingLine - start) / Math.max(1, end - start)));
      offset += (next.link.offsetTop - linkTop) * progress;
    }

    const guide = visibleTop + (visibleBottom - visibleTop) * 0.25;
    const min = linkTop + link.offsetHeight - visibleBottom;
    const max = linkTop - visibleTop;
    toc.scrollTop = Math.min(max, Math.max(min, offset - guide));
  }

  function updateActiveSection() {
    framePending = false;
    if (!toc.getClientRects().length) return;

    const { scrollY } = window;
    const { clientHeight, scrollHeight } = document.documentElement;
    const atBottom = scrollY > 0 && scrollY + clientHeight >= scrollHeight - 1;
    const readingLine = atBottom ? clientHeight : Math.min(120, clientHeight * 0.2);
    let index = 0;

    if (anchorJump && anchorJump.scrollY === scrollY) {
      index = anchorJump.index;
    } else {
      anchorJump = undefined;
      while (index + 1 < sections.length && sections[index + 1].heading.getBoundingClientRect().top <= readingLine) {
        index++;
      }
    }

    const { link } = sections[index];
    if (link !== activeLink) {
      activeLink?.removeAttribute("aria-current");
      link.setAttribute("aria-current", "location");
      activeLink = link;
    }

    followSection(index, readingLine, clientHeight);
  }

  function scheduleUpdate() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateActiveSection);
  }

  function trackAnchorJump() {
    const index = sections.findIndex(({ heading }) => heading.matches(":target"));
    anchorJump = index >= 0 ? { index, scrollY: window.scrollY } : undefined;
    scheduleUpdate();
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", trackAnchorJump);
  window.addEventListener("load", trackAnchorJump, { once: true });
  toc.addEventListener("focusout", scheduleUpdate);
  scheduleUpdate();
})();
