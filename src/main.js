import { addLike, fetchLikes, isFirebaseConfigured } from "./firebase.js";

const root = document.documentElement;
const themeButton = document.querySelector(".theme");
const projectGrid = document.querySelector(".project-grid");
const projectOrder = [
  "project-nine-dialog",
  "project-one-dialog",
  "project-retail-dialog",
  "project-eight-dialog",
  "project-four-dialog",
  "project-three-dialog",
  "project-seven-dialog",
  "project-two-dialog",
  "project-five-dialog",
  "project-six-dialog",
];

projectOrder.forEach((dialogId) => {
  const card = projectGrid.querySelector(`[data-dialog="${dialogId}"]`).closest(".card");
  projectGrid.append(card);
});

const cards = [...projectGrid.querySelectorAll(".card")];
const likedProjects = new Set(JSON.parse(localStorage.getItem("likedProjects") || "[]"));

const toProjectId = (title) => title.toLowerCase().replace(/\s+/g, "-");
const normalizeTag = (tag) => tag.trim().toLowerCase();

const tagTones = {
  "time series": "time-series",
  "forecasting": "time-series",
  "explainable ai": "explainable-ai",
  "statistical modeling": "explainable-ai",
  "quality analytics": "explainable-ai",
  "fine-tuning": "explainable-ai",
  "optimization": "optimization",
  "genetic algorithms": "optimization",
  "automation": "optimization",
  "rpa": "optimization",
  "computer vision": "vision",
  "image embeddings": "vision",
  "3d reconstruction": "vision",
  "image processing": "vision",
  "nlp": "nlp",
  "compound ai": "neutral",
  "llm evaluation": "nlp",
  "sentiment analysis": "nlp",
  "graph analytics": "graph",
};

document.querySelectorAll(".tag").forEach((tag) => {
  tag.dataset.tone = tagTones[normalizeTag(tag.textContent)] || "neutral";
});

themeButton.addEventListener("click", () => {
  const dark = root.dataset.theme !== "dark";
  root.dataset.theme = dark ? "dark" : "light";
  themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
});

const filterRoot = document.querySelector(".filters");
const filterToggle = filterRoot.querySelector(".filter-toggle");
const filterMenu = filterRoot.querySelector(".filter-menu");
const filterOptions = filterRoot.querySelector(".filter-options");
const filterCount = filterRoot.querySelector(".filter-count");

cards.forEach((card) => {
  card.filterTags = [...card.querySelectorAll(".card-copy .tag")].map((tag) => normalizeTag(tag.textContent));
});

const filterCategories = [
  { id: "forecasting", label: "Time Series & Forecasting", tags: ["time series", "forecasting"], tone: "time-series" },
  { id: "explainable-ai", label: "Explainable AI", tags: ["explainable ai", "statistical modeling", "quality analytics"], tone: "explainable-ai" },
  { id: "optimization-automation", label: "Optimization & Automation", tags: ["optimization", "genetic algorithms", "automation", "rpa"], tone: "optimization" },
  { id: "vision", label: "Computer Vision", tags: ["computer vision", "image embeddings", "3d reconstruction", "image processing"], tone: "vision" },
  { id: "nlp", label: "NLP & LLMs", tags: ["nlp", "llms", "compound ai", "llm evaluation", "sentiment analysis"], tone: "nlp" },
  { id: "graph", label: "Graph Analytics", tags: ["graph analytics", "neo4j"], tone: "graph" },
];

function matchesFilter(card, category) {
  return category.tags.some((tag) => card.filterTags.includes(tag));
}

filterCategories.forEach((category) => {
  const label = document.createElement("label");
  label.className = "filter-option";
  label.innerHTML = `<input type="checkbox" value="${category.id}" id="filter-${category.id}"><span class="filter-swatch" data-tone="${category.tone}" aria-hidden="true"></span><span>${category.label}</span>`;
  filterOptions.append(label);
});

const filterCheckboxes = [...filterOptions.querySelectorAll("input")];
function applyFilters() {
  const selected = filterCategories.filter((category) =>
    filterCheckboxes.some((input) => input.value === category.id && input.checked));
  cards.forEach((card) => {
    card.hidden = selected.length > 0 && !selected.some((category) => matchesFilter(card, category));
  });

  const shown = cards.filter((card) => !card.hidden).length;
  filterCount.textContent = shown === cards.length ? "All" : String(shown);
  document.querySelector("#project-count").textContent = `${shown} project${shown === 1 ? "" : "s"} shown`;
}

filterToggle.addEventListener("click", () => {
  const willOpen = filterMenu.hidden;
  filterMenu.hidden = !willOpen;
  filterToggle.setAttribute("aria-expanded", String(willOpen));
});

filterOptions.addEventListener("change", applyFilters);
filterRoot.querySelector('[data-filter-action="all"]').addEventListener("click", () => {
  filterCheckboxes.forEach((input) => { input.checked = true; });
  applyFilters();
});
filterRoot.querySelector('[data-filter-action="clear"]').addEventListener("click", () => {
  filterCheckboxes.forEach((input) => { input.checked = false; });
  applyFilters();
});
applyFilters();

document.addEventListener("click", (event) => {
  if (!filterMenu.hidden && !filterRoot.contains(event.target)) {
    filterMenu.hidden = true;
    filterToggle.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !filterMenu.hidden) {
    filterMenu.hidden = true;
    filterToggle.setAttribute("aria-expanded", "false");
    filterToggle.focus();
  }
});

document.querySelectorAll(".card-open").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.dialog).showModal();
  });
});

document.querySelectorAll(".project-dialog").forEach((dialog) => {
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const count = carousel.querySelector(".carousel-count");
  const countLabel = carousel.dataset.countLabel ? `${carousel.dataset.countLabel} ` : "";
  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));

  if (activeIndex < 0) activeIndex = 0;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });
    count.textContent = `${countLabel}${activeIndex + 1} / ${slides.length}`;
  }

  carousel.querySelector(".carousel-prev").addEventListener("click", () => showSlide(activeIndex - 1));
  carousel.querySelector(".carousel-next").addEventListener("click", () => showSlide(activeIndex + 1));
  showSlide(activeIndex);
});

const illustrationTrack = document.querySelector("#illustration-track");
const illustrationCards = [...illustrationTrack.querySelectorAll(".illustration-card")];
const illustrationPrevious = document.querySelector('[data-illustration-direction="previous"]');
const illustrationNext = document.querySelector('[data-illustration-direction="next"]');
const illustrationStatus = document.querySelector("#illustration-status");

function updateIllustrationNavigation() {
  const maxScroll = illustrationTrack.scrollWidth - illustrationTrack.clientWidth;
  illustrationPrevious.disabled = illustrationTrack.scrollLeft <= 2;
  illustrationNext.disabled = illustrationTrack.scrollLeft >= maxScroll - 2;

  const viewport = illustrationTrack.getBoundingClientRect();
  const visible = illustrationCards.filter((card) => {
    const bounds = card.getBoundingClientRect();
    return bounds.right > viewport.left + 8 && bounds.left < viewport.right - 8;
  });
  if (visible.length) {
    const first = illustrationCards.indexOf(visible[0]) + 1;
    const last = illustrationCards.indexOf(visible.at(-1)) + 1;
    illustrationStatus.textContent = first === last
      ? `Showing illustration ${first} of ${illustrationCards.length}`
      : `Showing illustrations ${first} to ${last} of ${illustrationCards.length}`;
  }
}

function moveIllustrations(direction) {
  const gap = parseFloat(getComputedStyle(illustrationTrack).columnGap);
  const step = illustrationCards[0].getBoundingClientRect().width + gap;
  illustrationTrack.scrollBy({
    left: direction * step,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

illustrationPrevious.addEventListener("click", () => moveIllustrations(-1));
illustrationNext.addEventListener("click", () => moveIllustrations(1));
illustrationTrack.addEventListener("scroll", updateIllustrationNavigation, { passive: true });
illustrationTrack.addEventListener("keydown", (event) => {
  if (event.target !== illustrationTrack) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    moveIllustrations(event.key === "ArrowLeft" ? -1 : 1);
  }
});
new ResizeObserver(updateIllustrationNavigation).observe(illustrationTrack);
updateIllustrationNavigation();

function showLiked(button, liked) {
  button.setAttribute("aria-pressed", String(liked));
  button.classList.toggle("liked", liked);
  button.querySelector(".heart").textContent = liked ? "♥" : "♡";
}

cards.forEach(async (card) => {
  const button = card.querySelector(".like");
  const count = button.querySelector(".count");
  const projectId = toProjectId(card.querySelector("h3").textContent.trim());
  const alreadyLiked = likedProjects.has(projectId);

  card.dataset.projectId = projectId;
  showLiked(button, alreadyLiked);

  if (isFirebaseConfigured) {
    try {
      const savedCount = await fetchLikes(projectId);
      count.textContent = savedCount;
      card.dataset.likes = String(savedCount);
    } catch (error) {
      console.error(`Could not load likes for ${projectId}:`, error);
    }
  }

  button.addEventListener("click", async () => {
    if (likedProjects.has(projectId) || button.disabled) return;

    button.disabled = true;
    const previousCount = Number(count.textContent);
    count.textContent = previousCount + 1;
    card.dataset.likes = String(previousCount + 1);
    showLiked(button, true);

    try {
      await addLike(projectId);
      likedProjects.add(projectId);
      localStorage.setItem("likedProjects", JSON.stringify([...likedProjects]));
    } catch (error) {
      count.textContent = previousCount;
      card.dataset.likes = String(previousCount);
      showLiked(button, false);
      console.error(`Could not save like for ${projectId}:`, error);
    } finally {
      button.disabled = false;
    }
  });
});
