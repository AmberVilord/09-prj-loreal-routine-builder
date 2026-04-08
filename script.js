/* Get the main elements we need from the page */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearSelectedBtn = document.getElementById("clearSelected");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

/* Store all products after we fetch them from products.json */
let allProducts = [];

/* Store selected product ids so we can add/remove them easily */
const selectedProductIds = new Set();
const STORAGE_KEY = "loreal-selected-products";

/* Show a starting message before a category is chosen */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Choose a category to view matching products.
  </div>
`;

/* Add a message to the chat window */
function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Save selected product ids in localStorage so they stay after reload */
function saveSelectedProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...selectedProductIds]));
}

/* Load saved product ids from localStorage */
function loadSavedSelectedProducts() {
  const savedProductIds = localStorage.getItem(STORAGE_KEY);

  if (!savedProductIds) {
    return;
  }

  try {
    const parsedIds = JSON.parse(savedProductIds);

    if (!Array.isArray(parsedIds)) {
      return;
    }

    parsedIds.forEach((productId) => {
      if (typeof productId === "number") {
        selectedProductIds.add(productId);
      }
    });
  } catch (error) {
    console.error("Could not load saved selected products.", error);
  }
}

/* Load product data from the JSON file */
async function loadProducts() {
  if (allProducts.length > 0) {
    return allProducts;
  }

  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Return only the products the user has selected */
function getSelectedProducts() {
  return allProducts.filter((product) => selectedProductIds.has(product.id));
}

/* Update card borders so selected products are clearly marked */
function syncSelectedCardStyles() {
  const cards = productsContainer.querySelectorAll(".product-card");

  cards.forEach((card) => {
    const productId = Number(card.dataset.productId);
    card.classList.toggle("selected", selectedProductIds.has(productId));
  });
}

/* Show selected products above the Generate Routine button */
function renderSelectedProducts() {
  const selectedProducts = getSelectedProducts();

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p class="selected-empty">No products selected yet.</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product-item">
          <span>${product.name}</span>
          <button
            type="button"
            class="selected-product-remove"
            data-product-id="${product.id}"
            aria-label="Remove ${product.name}"
          >
            ×
          </button>
        </div>
      `
    )
    .join("");
}

/* Build the product cards for the current filtered products */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products matched that category.
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (product) => `
        <article class="product-card" data-product-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" />
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-brand">${product.brand}</p>
            <button
              type="button"
              class="details-toggle"
              aria-expanded="false"
              aria-controls="product-description-${product.id}"
            >
              Show description
            </button>
            <p
              id="product-description-${product.id}"
              class="product-description"
              hidden
            >
              ${product.description}
            </p>
          </div>
        </article>
      `
    )
    .join("");

  syncSelectedCardStyles();
}

/* Add or remove a product from the selected set */
function toggleProductSelection(productId) {
  if (selectedProductIds.has(productId)) {
    selectedProductIds.delete(productId);
  } else {
    selectedProductIds.add(productId);
  }

  saveSelectedProducts();
  syncSelectedCardStyles();
  renderSelectedProducts();
}

/* Remove one selected product directly from the selected list */
function removeSelectedProduct(productId) {
  selectedProductIds.delete(productId);
  saveSelectedProducts();
  syncSelectedCardStyles();
  renderSelectedProducts();
}

/* Filter products when the category changes */
categoryFilter.addEventListener("change", async (event) => {
  const products = await loadProducts();
  const selectedCategory = event.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Handle clicks inside the product grid */
productsContainer.addEventListener("click", (event) => {
  const detailsButton = event.target.closest(".details-toggle");

  if (detailsButton) {
    const descriptionId = detailsButton.getAttribute("aria-controls");
    const description = document.getElementById(descriptionId);
    const isExpanded = detailsButton.getAttribute("aria-expanded") === "true";

    detailsButton.setAttribute("aria-expanded", String(!isExpanded));
    detailsButton.textContent = isExpanded
      ? "Show description"
      : "Hide description";

    if (description) {
      description.hidden = isExpanded;
    }

    return;
  }

  const card = event.target.closest(".product-card");

  if (!card) {
    return;
  }

  const productId = Number(card.dataset.productId);
  toggleProductSelection(productId);
});

/* Handle remove buttons inside the selected products list */
selectedProductsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".selected-product-remove");

  if (!removeButton) {
    return;
  }

  const productId = Number(removeButton.dataset.productId);
  removeSelectedProduct(productId);
});

/* Clear every selected product */
clearSelectedBtn.addEventListener("click", () => {
  selectedProductIds.clear();
  saveSelectedProducts();
  syncSelectedCardStyles();
  renderSelectedProducts();
});

/* Placeholder for routine generation */
generateRoutineBtn.addEventListener("click", () => {
  const selectedProducts = getSelectedProducts();

  if (selectedProducts.length === 0) {
    appendMessage(
      "assistant",
      "Select at least one product first. This button is a placeholder for routine generation."
    );
    return;
  }

  const productNames = selectedProducts.map((product) => product.name).join(", ");

  appendMessage("user", `Generate a routine for: ${productNames}`);
  appendMessage(
    "assistant",
    "Routine generation placeholder: connect this button to your AI routine builder here."
  );
});

/* Placeholder for continuing the conversation in the chat window */
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const question = userInput.value.trim();

  if (!question) {
    return;
  }

  appendMessage("user", question);
  appendMessage(
    "assistant",
    "Chat placeholder: connect this form to your conversation logic so the assistant can continue the routine discussion."
  );

  userInput.value = "";
});

/* Start the page with saved selections and starter content */
async function initializeApp() {
  await loadProducts();
  loadSavedSelectedProducts();

  /* Remove any saved ids that no longer exist in products.json */
  const validProductIds = new Set(allProducts.map((product) => product.id));

  [...selectedProductIds].forEach((productId) => {
    if (!validProductIds.has(productId)) {
      selectedProductIds.delete(productId);
    }
  });

  saveSelectedProducts();
  renderSelectedProducts();

  appendMessage(
    "assistant",
    "Choose a category, select products, and use the placeholders to keep building this project."
  );
}

initializeApp();
