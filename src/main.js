import { addLike, fetchLikes, isFirebaseConfigured } from "./firebase.js";

const root = document.documentElement;
const themeButton = document.querySelector(".theme");
const projectGrid = document.querySelector(".project-grid");
const projectOrder = [
  "project-nine-dialog",
  "project-eight-dialog",
  "project-one-dialog",
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
  "applied ai": "applied-ai",
  "compound ai": "applied-ai",
  "llm evaluation": "machine-learning",
  "python": "automation",
  "optimization": "optimization",
  "genetic algorithms": "optimization",
  "computer vision": "vision",
  "3d reconstruction": "vision",
  "image processing": "vision",
  "machine learning": "machine-learning",
  "statistical modeling": "statistical",
  "quality analytics": "statistical",
  "graph analytics": "graph",
  "neo4j": "graph",
  "anomaly detection": "anomaly",
  "time series": "time-series",
  "energy markets": "business-analytics",
  "explainable ai": "applied-ai",
  "automation": "automation",
  "process improvement": "automation",
  "business impact": "business-impact",
  "business analytics": "business-analytics",
  "nlp": "nlp",
  "fine-tuning": "nlp",
  "api": "api",
};

document.querySelectorAll(".tag").forEach((tag) => {
  tag.dataset.tone = tagTones[normalizeTag(tag.textContent)] || "blue";
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
  "applied ai",
  "optimization",
  "computer vision",
  "machine learning",
  "graph analytics",
  "automation",
  "business impact",
];

filterCategories.forEach((tag, index) => {
  const label = document.createElement("label");
  label.className = "filter-option";
  label.innerHTML = `<input type="checkbox" value="${tag}" id="filter-${index}"><span class="filter-swatch" data-tone="${tagTones[tag] || "blue"}" aria-hidden="true"></span><span>${tag}</span>`;
  filterOptions.append(label);
});

const filterCheckboxes = [...filterOptions.querySelectorAll("input")];

function applyFilters() {
  const selected = new Set(filterCheckboxes.filter((input) => input.checked).map((input) => input.value));
  cards.forEach((card) => {
    card.hidden = selected.size > 0 && !card.filterTags.some((tag) => selected.has(tag));
  });

  const shown = cards.filter((card) => !card.hidden).length;
  filterCount.textContent = selected.size === 0 || selected.size === filterCategories.length ? "All" : String(selected.size);
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
  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));

  if (activeIndex < 0) activeIndex = 0;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });
    count.textContent = `${activeIndex + 1} / ${slides.length}`;
  }

  carousel.querySelector(".carousel-prev").addEventListener("click", () => showSlide(activeIndex - 1));
  carousel.querySelector(".carousel-next").addEventListener("click", () => showSlide(activeIndex + 1));
  showSlide(activeIndex);
});

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
