const API_URL = "http://localhost:4000/api";

const safeParseJSON = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: res.status };
  }
};

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestScript/1.0",
  "Origin": "http://localhost:5173",
};

const logResult = (stepName, success, data = null) => {
  if (success) {
    console.log(`✅ [OK] ${stepName}`);
    if (data) console.log("   --> Data:", JSON.stringify(data).slice(0, 150));
  } else {
    console.error(`❌ [ÉCHEC] ${stepName}`);
    if (data) console.error("   --> Détail:", JSON.stringify(data));
  }
};

async function runTests() {
  console.log("\n🚀 --- DÉBUT DES TESTS AUTOMATISÉS DU BACKEND (PORT 4000) ---\n");

  let clientCookie = "";
  let adminCookie = "";
  let createdCategoryId = "";
  let createdProductId = "";

  const timestamp = Date.now();
  const clientEmail = `client_${timestamp}@test.com`;
  const testPassword = "Password123!";

  try {
    // 1. Health Check
    console.log("--> Test 1: Health Check...");
    const healthRes = await fetch(`${API_URL}/health`, {
      headers: { "User-Agent": "TestScript/1.0" },
    });
    const healthData = await safeParseJSON(healthRes);
    logResult("1. Health Check (/health)", healthRes.ok && healthData.success, healthData);

    // 2. Inscription Client
    console.log("--> Test 2: Inscription Client...");
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        name: "Client Test",
        email: clientEmail,
        password: testPassword,
        phone: "+242060000000",
      }),
    });
    const registerData = await safeParseJSON(registerRes);
    logResult("2. Création de compte Client", registerRes.ok && registerData.success, registerData);

    // 3. Connexion Client
    console.log("--> Test 3: Connexion Client...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email: clientEmail, password: testPassword }),
    });
    const loginData = await safeParseJSON(loginRes);
    clientCookie = loginRes.headers.get("set-cookie") || "";
    logResult("3. Connexion Client (JWT Cookie)", loginRes.ok && loginData.success, loginData);

    // 4. Connexion Admin Seeded
    console.log("--> Test 4: Connexion Admin Seeded...");
    const loginAdminRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email: "okabamariam@05gmail.com", password: "mariam1234" }),
    });
    const adminLoginData = await safeParseJSON(loginAdminRes);
    adminCookie = loginAdminRes.headers.get("set-cookie") || "";
    logResult("4. Connexion Admin", loginAdminRes.ok && adminLoginData.success, adminLoginData);

    // 5. Récupération Profil Client
    console.log("--> Test 5: Profil Client...");
    const profileRes = await fetch(`${API_URL}/auth/me`, {
      headers: { ...DEFAULT_HEADERS, cookie: clientCookie },
    });
    const profileData = await safeParseJSON(profileRes);
    logResult("5. Profil Client (/auth/me)", profileRes.ok && profileData.success, profileData);

    // 6. Création d'une Catégorie (Admin)
    console.log("--> Test 6: Création Catégorie...");
    const catRes = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { ...DEFAULT_HEADERS, cookie: adminCookie },
      body: JSON.stringify({ name: `Catégorie ${timestamp}`, description: "Test" }),
    });
    const catData = await safeParseJSON(catRes);
    if (catData.data?.category?.id) createdCategoryId = catData.data.category.id;
    logResult("6. Création Catégorie (Admin)", catRes.ok && catData.success, catData);

    // 7. Création d'un Produit (Admin)
    if (createdCategoryId) {
      console.log("--> Test 7: Création Produit...");
      const prodRes = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { ...DEFAULT_HEADERS, cookie: adminCookie },
        body: JSON.stringify({
          name: `Produit ${timestamp}`,
          description: "Description test produit Longrich",
          price: 15000,
          stock: 50,
          categoryId: createdCategoryId,
          images: ["uploads/products/placeholder.jpg"],
        }),
      });
      const prodData = await safeParseJSON(prodRes);
      if (prodData.data?.product?.id) createdProductId = prodData.data.product.id;
      logResult("7. Publication Produit (Admin)", prodRes.ok && prodData.success, prodData);
    }

    // 8. Interaction Like (Correct Path: /interactions/products/:productId/like)
    if (createdProductId) {
      console.log("--> Test 8: Like Produit...");
      const likeRes = await fetch(`${API_URL}/interactions/products/${createdProductId}/like`, {
        method: "POST",
        headers: { ...DEFAULT_HEADERS, cookie: clientCookie },
      });
      const likeData = await safeParseJSON(likeRes);
      logResult("8. Liker un produit", likeRes.ok && likeData.success, likeData);
    }

    console.log("\n✨ --- FIN DE L'EXÉCUTION DES TESTS ---\n");
  } catch (error) {
    console.error("\n❌ ERREUR DANS LE SCRIPT DE TEST :", error);
  }
}

runTests();